"""
Audit overlay graph model (plan §8.1).

Additive layer on top of the jQAssistant graph. It never modifies existing nodes,
labels or relationships; it only adds:

Nodes
  (:Audit:Rule {id, pack, axis, severity})
  (:Audit:Finding {fid, severity, sf, tag, title, fix, source})
  (:Audit:SystemicFinding {id})
  (:Audit:Requirement {id, status, target})
  (:Audit:Epic {id})
  (:Audit:Run {commit, date})
  (:Audit:Fact {key})                  anchor for violations that have no code node (SQL, HTML, Dockerfile ...)
  (:Audit:UnresolvedLocation {raw})    audit location that could not be mapped to code

Relationships
  (code)-[:VIOLATES {key, severity, weight, firstSeen, lastSeen, commit, active, detail, count}]->(:Audit:Rule)
  (:Audit:Rule)-[:COVERS]->(:Audit:Finding|:Audit:Requirement|:Audit:SystemicFinding|:Audit:Epic)
  (:Audit:Finding)-[:LOCATED_IN {startLine, endLine}]->(:SourceFile|:Type|:Method)
  (:Audit:Finding)-[:UNRESOLVED_AT]->(:Audit:UnresolvedLocation)
  (:Audit:Finding)-[:MEMBER_OF]->(:Audit:SystemicFinding)
  (:Audit:Finding|:Audit:Requirement)-[:TRACKED_BY]->(:Audit:Epic)

Re-runs MERGE by key and never duplicate. A violation that is no longer reported keeps its
`lastSeen` and is flagged `active = false` ("resolved since").

All DB access goes through a thin ``GraphClient`` protocol (``execute_read_query`` /
``execute_write_query``), which ``Neo4jManager`` satisfies and tests can mock.
"""

import logging
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Protocol, Sequence

logger = logging.getLogger(__name__)

# --- Severity scale (shared by jQA constraints, facts and the risk score) ---
SEVERITY_WEIGHTS: Dict[str, int] = {
    "info": 1,
    "minor": 2,
    "major": 3,
    "critical": 4,
    "blocker": 5,
}

_SEVERITY_ALIASES: Dict[str, str] = {
    "p0": "blocker",
    "bloquant": "blocker",
    "p1": "critical",
    "high": "critical",
    "haute": "critical",
    "p2": "major",
    "medium": "major",
    "moyenne": "major",
    "p3": "minor",
    "low": "minor",
    "faible": "minor",
    "p4": "info",
    "information": "info",
}

AXES = ("tech", "xc", "sam")


class GraphClient(Protocol):
    """Minimal DB interface used by the overlay (satisfied by ``Neo4jManager``)."""

    def execute_read_query(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]: ...

    def execute_write_query(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> Any: ...


def normalize_severity(raw: Optional[str], default: str = "major") -> str:
    """Maps free text (``MAJOR``, ``P1``, ``Critical`` ...) onto the shared severity scale."""
    if raw:
        token = str(raw).strip().lower()
        if token in SEVERITY_WEIGHTS:
            return token
        if token in _SEVERITY_ALIASES:
            return _SEVERITY_ALIASES[token]
        for name in SEVERITY_WEIGHTS:
            if name in token:
                return name
    return default


def severity_weight(severity: Optional[str]) -> int:
    return SEVERITY_WEIGHTS.get(normalize_severity(severity), 0)


def axis_from_rule_id(rule_id: str) -> str:
    """Rule axis derived from the id prefix: tech-/xc-/sam-, else 'legacy'."""
    for axis in AXES:
        if rule_id.startswith(f"{axis}-"):
            return axis
    return "legacy"


def pack_from_rule_id(rule_id: str) -> str:
    """Pack = part of the id before ':' (``tech-scripting:ScriptEvaluation`` -> ``tech-scripting``)."""
    return rule_id.split(":", 1)[0] if ":" in rule_id else ""


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass(frozen=True)
class RunContext:
    """Identifies one overlay execution: the commit analysed and the run timestamp."""

    commit: str
    now: str


def resolve_commit(project_path: Optional[Path]) -> str:
    """AUDIT_COMMIT env var, else ``git rev-parse HEAD`` (argument list, no shell), else 'unknown'."""
    env_commit = os.environ.get("AUDIT_COMMIT")
    if env_commit:
        return env_commit
    if project_path:
        try:
            out = subprocess.run(
                ["git", "-C", str(project_path), "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                timeout=15,
                check=False,
                shell=False,
            )
            if out.returncode == 0 and out.stdout.strip():
                return out.stdout.strip()
        except Exception as exc:
            logger.debug("Could not resolve git commit for %s: %s", project_path, exc)
    return "unknown"


def make_run_context(project_path: Optional[Path] = None) -> RunContext:
    return RunContext(commit=resolve_commit(project_path), now=utc_now())


# (constraint name, label, key property)
_UNIQUE_KEYS = [
    # jQA stores its own (:jQAssistant:Rule:Constraint|Concept|Group {id}) nodes, so the overlay never constrains or
    # MERGEs on the bare :Rule label: overlay rules carry the marker label :AuditRule (constrained) next to :Audit:Rule.
    ("audit_rule_marker_id", "AuditRule", "id"),
    ("audit_finding_fid", "Finding", "fid"),
    ("audit_systemic_finding_id", "SystemicFinding", "id"),
    ("audit_requirement_id", "Requirement", "id"),
    ("audit_epic_id", "Epic", "id"),
    ("audit_run_commit", "Run", "commit"),
    ("audit_fact_key", "Fact", "key"),
    ("audit_unresolved_location_raw", "UnresolvedLocation", "raw"),
    ("audit_test_result_key", "TestResult", "key"),
]

# Earlier versions constrained the bare :Rule label, which clashes with jQA's own rule nodes.
LEGACY_CONSTRAINTS = ["audit_rule_id"]

SCHEMA_STATEMENTS: List[str] = [
    f"CREATE CONSTRAINT {name} IF NOT EXISTS FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
    for name, label, prop in _UNIQUE_KEYS
]


class AuditGraph:
    """Idempotent read/write helpers for the audit overlay (all Cypher is parameterised)."""

    def __init__(self, client: GraphClient):
        self.client = client

    # ------------------------------------------------------------------ schema
    def init_schema(self) -> int:
        """Creates the uniqueness constraints (IF NOT EXISTS). One failing statement never stops the others."""
        applied = 0
        for legacy in LEGACY_CONSTRAINTS:
            try:
                self.client.execute_write_query(f"DROP CONSTRAINT {legacy} IF EXISTS")
            except Exception as exc:
                logger.warning("Could not drop legacy constraint %s: %s", legacy, exc)
        for statement in SCHEMA_STATEMENTS:
            try:
                self.client.execute_write_query(statement)
                applied += 1
            except Exception as exc:
                logger.warning("Audit schema statement failed (%s): %s", statement, exc)
        logger.info("Audit overlay schema ready (%d/%d constraints).", applied, len(SCHEMA_STATEMENTS))
        return applied

    def start_run(self, run: RunContext) -> None:
        self.client.execute_write_query(
            "MERGE (r:Audit:Run {commit: $commit}) SET r.date = $now",
            {"commit": run.commit, "now": run.now},
        )

    # ------------------------------------------------------------------- rules
    def merge_rule(
        self,
        rule_id: str,
        severity: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        """MERGE by id. Pack/axis derive from the id; severity/description only overwrite when given."""
        self.client.execute_write_query(
            """
            MERGE (r:AuditRule {id: $id})
            SET r:Audit:Rule
            SET r.pack = $pack, r.axis = $axis,
                r.severity = coalesce($severity, r.severity),
                r.description = coalesce($description, r.description)
            """,
            {
                "id": rule_id,
                "pack": pack_from_rule_id(rule_id),
                "axis": axis_from_rule_id(rule_id),
                "severity": normalize_severity(severity) if severity else None,
                "description": description,
            },
        )

    def record_rule_evaluation(self, rule_id: str, status: str, row_count: int, run: RunContext) -> None:
        """Remembers that a rule was evaluated (even with 0 rows) - needed for 'resolved?' decisions."""
        self.client.execute_write_query(
            """
            MATCH (r:Audit:Rule {id: $id})
            SET r.lastEvaluated = $now, r.lastStatus = $status, r.lastRowCount = $rows, r.lastCommit = $commit
            """,
            {"id": rule_id, "now": run.now, "status": status, "rows": row_count, "commit": run.commit},
        )

    # -------------------------------------------------------------- violations
    def merge_fact(self, key: str, props: Dict[str, Any]) -> Optional[str]:
        """MERGE an :Audit:Fact anchor and return its element id."""
        self.client.execute_write_query(
            "MERGE (f:Audit:Fact {key: $key}) SET f += $props",
            {"key": key, "props": props},
        )
        found = self.client.execute_read_query(
            "MATCH (f:Audit:Fact {key: $key}) RETURN elementId(f) AS nid", {"key": key}
        )
        return found[0]["nid"] if found else None

    def write_violations(
        self,
        rule_id: str,
        default_severity: str,
        rows: Sequence[Dict[str, Any]],
        run: RunContext,
    ) -> int:
        """
        Writes ``(code)-[:VIOLATES]->(rule)`` for rows ``{nid, key, detail, count, severity?}``.
        MERGE key is (code node, rule, key): re-runs update in place and keep ``firstSeen``.
        """
        if not rows:
            return 0
        payload = []
        for row in rows:
            severity = normalize_severity(row.get("severity"), default_severity)
            payload.append(
                {
                    "nid": row["nid"],
                    "key": str(row.get("key", "")),
                    "detail": (row.get("detail") or "")[:500],
                    "count": int(row.get("count", 1)),
                    "severity": severity,
                    "weight": SEVERITY_WEIGHTS[severity],
                }
            )
        self.client.execute_write_query(
            """
            UNWIND $rows AS row
            MATCH (n) WHERE elementId(n) = row.nid
            MATCH (r:Audit:Rule {id: $ruleId})
            MERGE (n)-[v:VIOLATES {key: row.key}]->(r)
              ON CREATE SET v.firstSeen = $now
            SET v.severity = row.severity, v.weight = row.weight, v.lastSeen = $now,
                v.commit = $commit, v.active = true, v.detail = row.detail, v.count = row.count
            """,
            {"rows": payload, "ruleId": rule_id, "now": run.now, "commit": run.commit},
        )
        return len(payload)

    def reconcile_rule(self, rule_id: str, run: RunContext) -> int:
        """
        Violations of an evaluated rule that were not seen in this run become inactive.
        ``lastSeen`` is kept untouched ("resolved since").
        """
        counters = self.client.execute_write_query(
            """
            MATCH ()-[v:VIOLATES]->(r:Audit:Rule {id: $id})
            WHERE coalesce(v.active, true) AND v.lastSeen <> $now
            SET v.active = false
            """,
            {"id": rule_id, "now": run.now},
        )
        return int(getattr(counters, "properties_set", 0) or 0)

    # --------------------------------------------------------------- resolvers
    def _nids(self, cypher: str, params: Dict[str, Any]) -> List[str]:
        return [r["nid"] for r in (self.client.execute_read_query(cypher, params) or []) if r.get("nid")]

    def resolve_type(self, fqn: str) -> List[str]:
        return self._nids("MATCH (t:Type {fqn: $fqn}) RETURN elementId(t) AS nid LIMIT 5", {"fqn": fqn})

    def resolve_method(self, type_fqn: str, signature: str) -> List[str]:
        return self._nids(
            """
            MATCH (t:Type {fqn: $fqn})-[:DECLARES]->(m:Method)
            WHERE m.signature = $sig
            RETURN elementId(m) AS nid LIMIT 5
            """,
            {"fqn": type_fqn, "sig": signature},
        )

    def resolve_field(self, type_fqn: str, signature: str) -> List[str]:
        return self._nids(
            """
            MATCH (t:Type {fqn: $fqn})-[:DECLARES]->(f:Field)
            WHERE f.signature = $sig
            RETURN elementId(f) AS nid LIMIT 5
            """,
            {"fqn": type_fqn, "sig": signature},
        )

    def resolve_package(self, fqn: str) -> List[str]:
        return self._nids("MATCH (p:Package {fqn: $fqn}) RETURN elementId(p) AS nid LIMIT 5", {"fqn": fqn})

    def resolve_source_file(self, path_suffix: str) -> List[str]:
        """
        File node (:SourceFile after normalisation, plain :File on a raw jQA graph) whose absolute_path / fileName
        ends with the given '/'-separated suffix, matched on a path boundary.
        """
        suffix = path_suffix.replace("\\", "/").lstrip("/")
        return self._nids(
            r"""
            MATCH (f:File) WHERE NOT f:Directory
            WITH f, replace(coalesce(f.absolute_path, f.fileName, ''), '\\', '/') AS p
            WHERE p = $suffix OR p ENDS WITH ('/' + $suffix)
            RETURN elementId(f) AS nid LIMIT 5
            """,
            {"suffix": suffix},
        )

    def resolve_method_at(self, file_nid: str, line: int) -> Optional[str]:
        """
        Innermost :Method whose line range contains ``line``. Uses (:Method)-[:WITH_SOURCE]->(file) when the graph
        was normalised; on a raw jQA graph it falls back to the types whose fqn matches the source file path.
        """
        params = {"nid": file_nid, "line": int(line)}
        found = self._nids(
            """
            MATCH (f) WHERE elementId(f) = $nid
            MATCH (m:Method)-[:WITH_SOURCE]->(f)
            WHERE m.firstLineNumber <= $line AND $line <= m.lastLineNumber
            RETURN elementId(m) AS nid
            ORDER BY (m.lastLineNumber - m.firstLineNumber) ASC LIMIT 1
            """,
            params,
        )
        if not found:
            found = self._nids(
                r"""
                MATCH (f) WHERE elementId(f) = $nid
                WITH replace(replace(coalesce(f.absolute_path, f.fileName, ''), '\\', '/'), '/', '.') AS p
                WITH CASE WHEN p ENDS WITH '.java' THEN substring(p, 0, size(p) - 5)
                          WHEN p ENDS WITH '.kt' THEN substring(p, 0, size(p) - 3)
                          ELSE p END AS dotted
                MATCH (t:Type)-[:DECLARES]->(m:Method)
                WHERE (dotted = split(t.fqn, '$')[0] OR dotted ENDS WITH ('.' + split(t.fqn, '$')[0]))
                  AND m.firstLineNumber <= $line AND $line <= m.lastLineNumber
                RETURN elementId(m) AS nid
                ORDER BY (m.lastLineNumber - m.firstLineNumber) ASC LIMIT 1
                """,
                params,
            )
        return found[0] if found else None

    # ------------------------------------------------------------------- state
    def has_overlay_data(self) -> bool:
        """True when at least one VIOLATES relationship exists."""
        try:
            rows = self.client.execute_read_query(
                "MATCH ()-[v:VIOLATES]->(:Audit:Rule) RETURN count(v) AS n LIMIT 1"
            )
            return bool(rows and rows[0].get("n"))
        except Exception as exc:
            logger.debug("Audit overlay data probe failed: %s", exc)
            return False


def unique_or_none(nids: Iterable[str]) -> Optional[str]:
    """Returns the id when exactly one candidate exists (ambiguous matches are not guessed)."""
    items = list(dict.fromkeys(nids))
    return items[0] if len(items) == 1 else None
