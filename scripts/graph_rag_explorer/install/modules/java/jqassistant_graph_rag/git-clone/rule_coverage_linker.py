"""
Rule coverage linker (plan §8.4).

Reads ``audit-rule-map.yaml`` (e.g. ``SF-14: [tech-scripting:ScriptEvaluation, sam-sec:RhinoForbidden]``),
creates ``(:Audit:Rule)-[:COVERS]->(audit item)`` links, computes a coverage status per audit ID and writes
``audit-compliance-dashboard.md``.

Statuses
  confirmed         the audit item's location (or, without location, the rule) carries an active violation
  resolved?         a covering rule was evaluated and has no violation there; needs human confirmation
  contradiction     the audit says it is fine (status OK) but a covering rule still fires
  not automatable   no covering rule, or none of the covering rules was evaluated
  new candidate     (per rule, not per audit ID) an active violation matching no audit finding; counted per rule

An optional top-level ``location_prefixes:`` mapping in the YAML overrides the markdown location prefixes.
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from audit_markdown_importer import classify_id, normalize_status
from audit_model import AuditGraph, RunContext, axis_from_rule_id, pack_from_rule_id

logger = logging.getLogger(__name__)

CONFIRMED = "confirmed"
RESOLVED = "resolved?"
CONTRADICTION = "contradiction"
NOT_AUTOMATABLE = "not automatable"
STATUSES = (CONFIRMED, RESOLVED, CONTRADICTION, NOT_AUTOMATABLE)

_KIND_ORDER = {"epic": 0, "systemic": 1, "finding": 2, "requirement": 3}
_LABEL_KIND = {"Finding": "finding", "Requirement": "requirement", "SystemicFinding": "systemic", "Epic": "epic"}
# Matches any audit item by id (Finding uses `fid`, the others `id`); Rule/Run nodes are excluded.
_ITEM_MATCH = (
    "(a:Finding AND a.fid = {k}) OR ((a:Requirement OR a:SystemicFinding OR a:Epic) AND a.id = {k})"
)


@dataclass
class RuleMap:
    mapping: Dict[str, List[str]] = field(default_factory=dict)
    location_prefixes: Dict[str, str] = field(default_factory=dict)


@dataclass
class RuleState:
    id: str
    evaluated: bool
    status: str = ""
    active: int = 0
    hits: int = 0


@dataclass
class CoverageEntry:
    id: str
    kind: str
    title: str
    audit_status: str
    status: str
    rules: List[RuleState]
    novelty: str = "-"


@dataclass
class LinkReport:
    entries: List[CoverageEntry] = field(default_factory=list)
    candidates: Dict[str, List[str]] = field(default_factory=dict)  # rule id -> descriptions of new candidates
    candidate_counts: Dict[str, int] = field(default_factory=dict)
    links: int = 0


# ----------------------------------------------------------------------------- YAML loading
def _parse_simple_yaml(text: str) -> Dict[str, Any]:
    """Tiny fallback for `KEY: [a, b]`, `KEY:` + `- item` and one-level `KEY:` + `  k: v` (PyYAML absent)."""
    data: Dict[str, Any] = {}
    current: Optional[str] = None
    for raw in text.splitlines():
        line = re.sub(r"\s+#.*$", "", raw).rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        item = re.match(r"^\s+-\s+(.*)$", line)
        if item and current is not None:
            if not isinstance(data[current], list):
                data[current] = []
            data[current].append(item.group(1).strip().strip("'\""))
            continue
        pair = re.match(r"^(\s*)([^\s:#][^:]*?):\s*(.*)$", line)
        if not pair:
            continue
        indent, key, value = len(pair.group(1)), pair.group(2).strip().strip("'\""), pair.group(3).strip()
        if indent and current is not None and isinstance(data.get(current), dict):
            data[current][key] = value.strip("'\"")
            continue
        current = key
        if value.startswith("["):
            data[key] = [v.strip().strip("'\"") for v in value.strip("[]").split(",") if v.strip()]
        elif value:
            data[key] = value.strip("'\"")
        else:
            data[key] = {}
    return data


def _load_yaml(text: str) -> Any:
    try:
        import yaml  # PyYAML (requirements.txt)

        return yaml.safe_load(text)
    except ImportError:
        logger.info("PyYAML not installed; using the minimal built-in YAML reader for the rule map.")
        return _parse_simple_yaml(text)


def _as_rule_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    if isinstance(value, dict):
        return _as_rule_list(value.get("rules"))
    return [str(v).strip() for v in value if str(v).strip()]


def load_rule_map(path: Optional[str]) -> RuleMap:
    """Missing/invalid files yield an empty map (warning), never an exception."""
    if not path or not Path(path).is_file():
        logger.warning("Audit rule map not found, no COVERS links will be created: %s", path)
        return RuleMap()
    try:
        data = _load_yaml(Path(path).read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning("Audit rule map %s could not be parsed: %s", path, exc)
        return RuleMap()
    if not isinstance(data, dict):
        logger.warning("Audit rule map %s is empty or not a mapping.", path)
        return RuleMap()
    container = data.get("mappings") if isinstance(data.get("mappings"), dict) else data
    prefixes = data.get("location_prefixes") or container.get("location_prefixes") or {}
    mapping = {
        str(k).strip(): _as_rule_list(v)
        for k, v in container.items()
        if k not in ("location_prefixes", "mappings") and classify_id(str(k).strip())
    }
    return RuleMap(mapping=mapping, location_prefixes={str(k): str(v) for k, v in dict(prefixes).items()})


# ----------------------------------------------------------------------------- pure logic
def classify(audit_status: str, rules: List[RuleState]) -> str:
    """Coverage status of one audit item from the state of its covering rules (see module docstring)."""
    evaluated = [r for r in rules if r.evaluated]
    if not evaluated:
        return NOT_AUTOMATABLE
    if any(r.hits > 0 for r in evaluated):
        return CONTRADICTION if audit_status == "ok" else CONFIRMED
    return RESOLVED


def novelty(first_seen: List[str], now: str, has_prior: bool) -> str:
    if not first_seen:
        return "-"
    if not has_prior:
        return "baseline"
    return "new" if any(f == now for f in first_seen) else "known"


def _cell(text: Any) -> str:
    return str(text if text is not None else "").replace("|", "\\|").replace("\n", " ").strip()


def render_dashboard(report: LinkReport, run: RunContext) -> str:
    counts = {s: 0 for s in STATUSES}
    for entry in report.entries:
        counts[entry.status] = counts.get(entry.status, 0) + 1
    lines = [
        "# Audit compliance dashboard",
        "",
        f"Generated: {run.now} - commit `{run.commit}`",
        "",
        "Violations are indicated, never blocking. `resolved?` needs human confirmation.",
        "",
        "## Summary",
        "",
        "| Status | Audit IDs |",
        "|---|---|",
    ]
    lines += [f"| {s} | {counts.get(s, 0)} |" for s in STATUSES]
    lines += [
        f"| new candidate (rules with unmatched violations) | {sum(1 for n in report.candidate_counts.values() if n)} |",
        "",
        "## Coverage per audit ID",
        "",
        "| Audit ID | Kind | Title | Audit status | Covering rules | jQA state | Coverage | New / known |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for e in report.entries:
        rule_ids = ", ".join(f"`{r.id}`" for r in e.rules) or "-"
        state = "; ".join(
            f"`{r.id}`: not evaluated" if not r.evaluated else (f"`{r.id}`: {r.hits} violation(s)" if r.hits else f"`{r.id}`: clean")
            for r in e.rules
        ) or "-"
        lines.append(
            f"| {_cell(e.id)} | {e.kind} | {_cell(e.title)[:80]} | {_cell(e.audit_status)} | {rule_ids} | {_cell(state)} | {e.status} | {e.novelty} |"
        )
    lines += ["", "## New candidates (active violations matching no audit finding)", ""]
    candidates = {k: v for k, v in report.candidate_counts.items() if v}
    if candidates:
        lines += ["| Rule | Violations | Examples |", "|---|---|---|"]
        for rule_id, n in sorted(candidates.items(), key=lambda kv: -kv[1]):
            examples = "; ".join(report.candidates.get(rule_id, [])[:3])
            lines.append(f"| `{rule_id}` | {n} | {_cell(examples)} |")
    else:
        lines.append("None.")
    return "\n".join(lines) + "\n"


# ----------------------------------------------------------------------------- linker
class RuleCoverageLinker:
    def __init__(self, graph: AuditGraph):
        self.graph = graph
        self._near_cache: Dict[str, Set[str]] = {}

    # ---- COVERS
    def link(self, rule_map: RuleMap) -> int:
        """Creates/refreshes COVERS from the map (rule map is the source of truth for the IDs it lists)."""
        links = 0
        for audit_id, rule_ids in rule_map.mapping.items():
            self._ensure_item(audit_id)
            self.graph.client.execute_write_query(
                "MATCH (r:Audit:Rule)-[c:COVERS]->(a:Audit) WHERE (" + _ITEM_MATCH.format(k="$id") + ") "
                "AND NOT r.id IN $rules DELETE c",
                {"id": audit_id, "rules": rule_ids},
            )
            for rule_id in rule_ids:
                self.graph.client.execute_write_query(
                    "MERGE (r:AuditRule {id: $rid}) ON CREATE SET r:Audit:Rule, r.pack = $pack, r.axis = $axis",
                    {"rid": rule_id, "pack": pack_from_rule_id(rule_id), "axis": axis_from_rule_id(rule_id)},
                )
                self.graph.client.execute_write_query(
                    "MATCH (r:Audit:Rule {id: $rid}) MATCH (a:Audit) WHERE " + _ITEM_MATCH.format(k="$id") + " "
                    "MERGE (r)-[:COVERS]->(a)",
                    {"rid": rule_id, "id": audit_id},
                )
                links += 1
        logger.info("Rule coverage: %d COVERS link(s) for %d audit ID(s).", links, len(rule_map.mapping))
        return links

    def _ensure_item(self, audit_id: str) -> None:
        """Creates a stub node for IDs that are only known from the rule map (never overwrites an existing item)."""
        existing = self.graph.client.execute_read_query(
            "MATCH (a:Audit) WHERE " + _ITEM_MATCH.format(k="$id") + " RETURN count(a) AS n", {"id": audit_id}
        )
        if existing and existing[0].get("n"):
            return
        kind = classify_id(audit_id)
        if kind == "finding":
            cypher = "MERGE (a:Audit:Finding {fid: $id}) ON CREATE SET a.stub = true"
        elif kind == "systemic":
            cypher = "MERGE (a:Audit:SystemicFinding {id: $id}) ON CREATE SET a.stub = true"
        elif kind == "epic":
            cypher = "MERGE (a:Audit:Epic {id: $id}) ON CREATE SET a.stub = true"
        else:
            cypher = "MERGE (a:Audit:Requirement {id: $id}) ON CREATE SET a.stub = true"
        self.graph.client.execute_write_query(cypher, {"id": audit_id})

    # ---- statuses
    def _near(self, nid: str) -> Set[str]:
        """The node plus its declaring type, declared members and linked source file / sources."""
        if nid not in self._near_cache:
            rows = self.graph.client.execute_read_query(
                """
                MATCH (loc) WHERE elementId(loc) = $nid
                RETURN [elementId(loc)]
                     + [(t)-[:DECLARES]->(loc) | elementId(t)]
                     + [(loc)-[:DECLARES]->(m) | elementId(m)]
                     + [(loc)-[:WITH_SOURCE]->(s) | elementId(s)]
                     + [(x)-[:WITH_SOURCE]->(loc) | elementId(x)] AS ids
                """,
                {"nid": nid},
            )
            self._near_cache[nid] = set(rows[0]["ids"]) if rows else {nid}
        return self._near_cache[nid]

    def compute(self, run: RunContext) -> LinkReport:
        client = self.graph.client
        self._near_cache = {}
        items = client.execute_read_query(
            """
            MATCH (a:Audit) WHERE a:Finding OR a:Requirement OR a:SystemicFinding OR a:Epic
            RETURN labels(a) AS labels, coalesce(a.fid, a.id) AS id, a.title AS title,
                   a.statusNorm AS statusNorm, a.status AS status,
                   [(r:Audit:Rule)-[:COVERS]->(a) | {id: r.id, evaluated: r.lastEvaluated IS NOT NULL, status: r.lastStatus}] AS rules
            """
        ) or []
        violations = client.execute_read_query(
            """
            MATCH (n)-[v:VIOLATES]->(r:Audit:Rule) WHERE coalesce(v.active, true)
            RETURN elementId(n) AS nid, r.id AS rid, v.firstSeen AS firstSeen,
                   coalesce(n.fqn, n.signature, n.key, n.absolute_path, n.fileName, n.name, '?') AS name
            """
        ) or []
        locations = client.execute_read_query(
            """
            MATCH (f:Audit:Finding)-[:LOCATED_IN]->(loc)
            RETURN f.fid AS fid, elementId(loc) AS nid,
                   [(f)-[:MEMBER_OF]->(s) | s.id] AS sfs, [(f)-[:TRACKED_BY]->(e) | e.id] AS epics
            """
        ) or []
        prior = client.execute_read_query(
            "MATCH ()-[v:VIOLATES]->() WHERE v.firstSeen < $now RETURN count(v) > 0 AS prior", {"now": run.now}
        )
        has_prior = bool(prior and prior[0].get("prior"))

        by_rule: Dict[str, List[Dict[str, Any]]] = {}
        for v in violations:
            by_rule.setdefault(v["rid"], []).append(v)

        locs_by_item: Dict[str, Set[str]] = {}
        for row in locations:
            for item_id in [row["fid"], *row.get("sfs", []), *row.get("epics", [])]:
                locs_by_item.setdefault(item_id, set()).add(row["nid"])

        report = LinkReport()
        covered_kinds: Dict[str, Set[str]] = {}
        rule_locs: Dict[str, Set[str]] = {}
        for item in items:
            kind = next((_LABEL_KIND[lb] for lb in item["labels"] if lb in _LABEL_KIND), "requirement")
            loc_nids = locs_by_item.get(item["id"], set())
            near: Set[str] = set().union(*(self._near(n) for n in loc_nids)) if loc_nids else set()
            audit_status = item.get("statusNorm") or (normalize_status(item["status"]) if item.get("status") else "open")
            states: List[RuleState] = []
            first_seen: List[str] = []
            for r in item.get("rules", []):
                active = by_rule.get(r["id"], [])
                relevant = [v for v in active if v["nid"] in near] if loc_nids else active
                states.append(RuleState(r["id"], bool(r["evaluated"]), r.get("status") or "", len(active), len(relevant)))
                first_seen += [v["firstSeen"] for v in relevant if v.get("firstSeen")]
                covered_kinds.setdefault(r["id"], set()).add(kind)
                rule_locs.setdefault(r["id"], set()).update(near)
            report.entries.append(
                CoverageEntry(
                    id=item["id"],
                    kind=kind,
                    title=item.get("title") or "",
                    audit_status=audit_status,
                    status=classify(audit_status, states),
                    rules=states,
                    novelty=novelty(first_seen, run.now, has_prior),
                )
            )
        report.entries.sort(key=lambda e: (_KIND_ORDER.get(e.kind, 9), e.id))

        # New candidates: violations not near any located finding covered by the same rule. Rules that only
        # cover requirements are excluded (their violations are evidence for the requirement).
        for rule_id, active in by_rule.items():
            kinds = covered_kinds.get(rule_id, set())
            if kinds and kinds <= {"requirement"}:
                continue
            fresh = [v for v in active if v["nid"] not in rule_locs.get(rule_id, set())]
            report.candidate_counts[rule_id] = len(fresh)
            report.candidates[rule_id] = [str(v["name"]) for v in fresh[:3]]
        return report

    def persist(self, report: LinkReport, run: RunContext) -> None:
        rows = [
            {
                "id": e.id,
                "status": e.status,
                "novelty": e.novelty,
                "note": ", ".join(f"{r.id}:{'n/a' if not r.evaluated else r.hits}" for r in e.rules),
            }
            for e in report.entries
        ]
        if rows:
            self.graph.client.execute_write_query(
                "UNWIND $rows AS row MATCH (a:Audit) WHERE " + _ITEM_MATCH.format(k="row.id") + " "
                "SET a.coverageStatus = row.status, a.coverageNote = row.note, "
                "a.novelty = row.novelty, a.coverageAt = $now",
                {"rows": rows, "now": run.now},
            )
        if report.candidate_counts:
            self.graph.client.execute_write_query(
                "UNWIND $rows AS row MATCH (r:Audit:Rule {id: row.id}) SET r.newCandidates = row.n",
                {"rows": [{"id": k, "n": n} for k, n in report.candidate_counts.items()]},
            )

    def write_dashboard(self, report: LinkReport, run: RunContext, path: Path) -> Optional[Path]:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(render_dashboard(report, run), encoding="utf-8")
            logger.info("Audit compliance dashboard written: %s", path)
            return path
        except OSError as exc:
            logger.warning("Could not write audit compliance dashboard %s: %s", path, exc)
            return None

    def run(self, rule_map: RuleMap, run: RunContext, dashboard_path: Optional[Path]) -> LinkReport:
        links = self.link(rule_map)
        report = self.compute(run)
        report.links = links
        self.persist(report, run)
        if dashboard_path:
            self.write_dashboard(report, run, dashboard_path)
        return report
