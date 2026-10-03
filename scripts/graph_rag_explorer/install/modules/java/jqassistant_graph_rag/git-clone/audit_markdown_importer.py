"""
Audit markdown importer (plan §8.3).

Parses audit documents (compliance matrix ``ID | Title | Target | Status | Evidence``, report FID / SF rows,
EPIC backlog) into :Audit:Finding / :Requirement / :SystemicFinding / :Epic nodes and resolves audit locations
(``M/ R/ T/ A/ C/ G/ S/ K/ CFG/`` prefixes, ``path:line[-line][,line]``) to code.

Parsing is pure (no DB). Row kinds are decided from the ID pattern:
  V3-B0-01 / FID column -> Finding      SF-01 -> SystemicFinding      EPIC-19 -> Epic
  14-1 / 7-2a / D07 / R-10 -> Requirement
A heading/bullet layout (``### V3-B0-01 - Title`` + ``- **Severity:** ...``) is accepted as a fallback.
Locations are resolved to the method whose line range contains the line; otherwise to the :SourceFile;
if the file is unknown the location becomes an :Audit:UnresolvedLocation (counted).
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from audit_model import AuditGraph, normalize_severity, unique_or_none

logger = logging.getLogger(__name__)

# Best-effort expansion of location prefixes. If a guess is wrong the resolver falls back to the
# prefix-less path and then to a unique file name. Overridable via `location_prefixes:` in audit-rule-map.yaml.
DEFAULT_LOCATION_PREFIXES: Dict[str, str] = {
    "M": "src/main/java/",
    "R": "src/main/resources/",
    "T": "src/test/java/",
    "A": "assessment/src/main/java/",
    "C": "core/src/main/java/",
    "G": "grid/src/main/java/",
    "S": "supplier/src/main/java/",
    "K": "kit/src/main/java/",
    "CFG": "src/main/resources/",
}
DASHBOARD_TITLE = "# Audit compliance dashboard"  # first line written by rule_coverage_linker.render_dashboard
EXTERNAL_PREFIXES = {"DS"}  # e.g. Document service: not part of this graph

SF_RE = re.compile(r"\bSF-\d{1,3}\b")
EPIC_RE = re.compile(r"\bEPIC-\d{1,3}\b")
FID_RE = re.compile(r"\bV\d+(?:-[A-Za-z0-9]+){2,}\b")
REQ_RE = re.compile(r"(?<![\w-])(?:\d{1,2}-\d{1,2}[a-z]?|D\d{2}|R-\d{2})(?![\w-])")

_EXT = r"(?:java|kt|kts|xml|ya?ml|properties|sql|html|json|md|gradle|sh|ts|tsx|js)"
_LOC_RE = re.compile(
    r"(?<![\w/.\-])(?:(?P<prefix>CFG|DS|[MRTACGSK])/\s*)?"
    r"(?P<path>[\w.$\-]+(?:/[\w.$\-]+)*\.%s)"
    r"(?::(?P<lines>\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*))?" % _EXT
)

_ALIASES: Dict[str, Tuple[str, ...]] = {
    "title": ("title", "finding", "summary", "description", "name", "remark", "observation", "titre"),
    "severity": ("severity", "sev", "priority", "gravite"),
    "sf": ("sf", "systemicfinding", "systemic"),
    "tag": ("tag", "tags", "category", "theme"),
    "fix": ("fix", "remediation", "recommendation", "action", "proposedfix"),
    "location": ("location", "locations", "loc", "where", "file", "files"),
    "status": ("status", "state", "result", "statut"),
    "target": ("target", "objective", "expected", "cible"),
    "evidence": ("evidence", "proof", "preuve"),
    "epic": ("epic", "epics", "backlog"),
}
_ID_HEADERS = ("fid", "id", "ref", "reference")

_STATUS_OK = ("✅", "ok", "pass", "done", "compliant", "conforme", "fixed", "resolved")
_STATUS_PARTIAL = ("⚠", "🟡", "🟠", "partial", "partiel", "wip", "in progress")
_STATUS_KO = ("❌", "🔴", "ko", "fail", "non-compliant", "non conforme", "open", "missing", "todo")


@dataclass
class Location:
    raw: str
    prefix: str
    path: str
    ranges: List[Tuple[int, int]] = field(default_factory=list)


@dataclass
class Record:
    id: str
    kind: str  # finding | requirement | systemic | epic
    fields: Dict[str, str] = field(default_factory=dict)
    refs: str = ""  # all cell text, used for cross references (members, epics)


@dataclass
class ParsedAudit:
    records: List[Record] = field(default_factory=list)


@dataclass
class ImportStats:
    files: int = 0
    findings: int = 0
    requirements: int = 0
    systemic: int = 0
    epics: int = 0
    located: int = 0
    unresolved_locations: int = 0


# --------------------------------------------------------------------------- pure parsing helpers
def _strip_md(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "; ", text, flags=re.IGNORECASE)
    return text.replace("`", "").replace("**", "").replace("__", "").strip()


def _norm_header(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", _strip_md(text).lower())


def _split_row(line: str) -> List[str]:
    body = line.strip()
    if body.startswith("|"):
        body = body[1:]
    if body.endswith("|"):
        body = body[:-1]
    return [c.strip() for c in re.split(r"(?<!\\)\|", body)]


def _is_separator(line: str) -> bool:
    return bool(re.fullmatch(r"\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*", line))


def classify_id(token: str) -> Optional[str]:
    token = token.strip()
    if EPIC_RE.fullmatch(token):
        return "epic"
    if SF_RE.fullmatch(token):
        return "systemic"
    if FID_RE.fullmatch(token):
        return "finding"
    if REQ_RE.fullmatch(token):
        return "requirement"
    return None


def normalize_status(raw: Optional[str]) -> str:
    text = (raw or "").strip().lower()
    if not text:
        return "unknown"
    for group, label in ((_STATUS_KO, "ko"), (_STATUS_PARTIAL, "partial"), (_STATUS_OK, "ok")):
        if any(marker in text for marker in group):
            return label
    return "unknown"


def _canonical_fields(by_header: Dict[str, str]) -> Dict[str, str]:
    fields: Dict[str, str] = {}
    for canon, names in _ALIASES.items():
        for name in names:
            if by_header.get(name):
                fields[canon] = by_header[name]
                break
    return fields


def parse_tables(text: str) -> List[Record]:
    lines = text.splitlines()
    records: List[Record] = []
    i = 0
    while i < len(lines) - 1:
        if lines[i].lstrip().startswith("|") and _is_separator(lines[i + 1]):
            header = [_norm_header(c) for c in _split_row(lines[i])]
            id_idx = next((header.index(h) for h in _ID_HEADERS if h in header), 0)
            j = i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                cells = [_strip_md(c) for c in _split_row(lines[j])]
                if id_idx < len(cells):
                    rec = _record_from_cells(header, cells, id_idx)
                    if rec:
                        records.append(rec)
                j += 1
            i = j
        else:
            i += 1
    return records


def _record_from_cells(header: List[str], cells: List[str], id_idx: int) -> Optional[Record]:
    raw_id = cells[id_idx].split()[0] if cells[id_idx].split() else ""
    kind = classify_id(raw_id)
    if kind is None and header[id_idx] == "fid" and raw_id:
        kind = "finding"
    if kind is None:
        return None
    # In a compliance matrix (status + target/evidence columns) SF-xx rows are the audit findings themselves
    # (fid = SF-xx, located through Evidence); elsewhere SF-xx rows group other findings (systemic findings).
    if kind == "systemic" and "status" in header and ("target" in header or "evidence" in header):
        kind = "finding"
    by_header = {h: cells[idx] for idx, h in enumerate(header) if idx < len(cells) and idx != id_idx}
    refs = " ".join(c for idx, c in enumerate(cells) if idx != id_idx)
    return Record(id=raw_id, kind=kind, fields=_canonical_fields(by_header), refs=refs)


_HEADING_RE = re.compile(r"^#{2,6}\s+(?P<id>\S+)\s*(?:[:—–-]+\s*(?P<title>.*))?$")
_BULLET_RE = re.compile(r"^\s*(?:[-*]\s+)?\**(?P<key>[A-Za-z][A-Za-z ]{1,25}?)\**\s*:\**\s*(?P<value>.+)$")


def parse_blocks(text: str) -> List[Record]:
    """Fallback layout: ``### ID - Title`` heading followed by ``- **Key:** value`` lines."""
    records: List[Record] = []
    current: Optional[Record] = None
    for line in text.splitlines():
        heading = _HEADING_RE.match(line)
        if heading:
            kind = classify_id(_strip_md(heading.group("id")))
            current = None
            if kind:
                current = Record(id=_strip_md(heading.group("id")), kind=kind)
                if heading.group("title"):
                    current.fields["title"] = _strip_md(heading.group("title"))
                records.append(current)
            continue
        if current is not None:
            bullet = _BULLET_RE.match(line)
            if bullet:
                key = _norm_header(bullet.group("key"))
                value = _strip_md(bullet.group("value"))
                canon = next((c for c, names in _ALIASES.items() if key in names), None)
                if canon:
                    current.fields.setdefault(canon, value)
            current.refs += " " + _strip_md(line)
    return records


def parse_audit_markdown(text: str) -> ParsedAudit:
    """Tables first; headings/bullets only add IDs that no table already defined."""
    records = parse_tables(text)
    known = {(r.kind, r.id) for r in records}
    records.extend(r for r in parse_blocks(text) if (r.kind, r.id) not in known)
    return ParsedAudit(records=records)


def _parse_ranges(raw: Optional[str]) -> List[Tuple[int, int]]:
    ranges: List[Tuple[int, int]] = []
    for part in (raw or "").split(","):
        nums = [int(n) for n in re.findall(r"\d+", part)]
        if nums:
            ranges.append((nums[0], nums[-1] if len(nums) > 1 else nums[0]))
    return ranges


def extract_locations(text: str) -> List[Location]:
    return [
        Location(
            raw=m.group(0),
            prefix=m.group("prefix") or "",
            path=m.group("path"),
            ranges=_parse_ranges(m.group("lines")),
        )
        for m in _LOC_RE.finditer(text or "")
    ]


def candidate_suffixes(loc: Location, prefixes: Dict[str, str]) -> List[str]:
    """Path suffixes to try, most specific first: expanded prefix, bare path, bare file name."""
    out: List[str] = []
    if loc.prefix and loc.prefix in prefixes:
        out.append(prefixes[loc.prefix].rstrip("/") + "/" + loc.path)
    out.append(loc.path)
    base = loc.path.rsplit("/", 1)[-1]
    if base != loc.path:
        out.append(base)
    return list(dict.fromkeys(out))


# --------------------------------------------------------------------------- importer
class AuditMarkdownImporter:
    def __init__(
        self,
        graph: AuditGraph,
        prefixes: Optional[Dict[str, str]] = None,
        source: str = "audit-v3",
    ):
        self.graph = graph
        self.prefixes = {**DEFAULT_LOCATION_PREFIXES, **(prefixes or {})}
        self.source = source
        self._file_cache: Dict[str, Optional[str]] = {}

    def import_dir(self, audit_dir: str) -> ImportStats:
        stats = ImportStats()
        root = Path(audit_dir) if audit_dir else None
        if not root or not root.exists():
            logger.warning("Audit directory not found, skipping markdown import: %s", audit_dir)
            return stats
        files = [root] if root.is_file() else sorted(root.rglob("*.md"))
        if not files:
            logger.warning("No markdown files found under audit directory: %s", root)
            return stats

        records: List[Record] = []
        for md in files:
            try:
                text = md.read_text(encoding="utf-8", errors="replace")
                if text.lstrip().startswith(DASHBOARD_TITLE):  # our own output must never be re-imported
                    continue
                records.extend(parse_audit_markdown(text).records)
                stats.files += 1
            except Exception as exc:
                logger.warning("Could not read audit file %s: %s", md, exc)

        # Epics last: they reference findings and systemic findings created by the other kinds.
        order = {"requirement": 0, "systemic": 1, "finding": 2, "epic": 3}
        for rec in sorted(records, key=lambda r: order[r.kind]):
            try:
                self._write_record(rec, stats)
            except Exception as exc:
                logger.error("Failed to import audit record %s: %s", rec.id, exc, exc_info=True)
        logger.info(
            "Audit markdown import: %d file(s), %d finding(s), %d requirement(s), %d systemic, %d epic(s); "
            "%d location(s) resolved, %d unresolved.",
            stats.files, stats.findings, stats.requirements, stats.systemic, stats.epics,
            stats.located, stats.unresolved_locations,
        )
        return stats

    # ---- writers
    def _write_record(self, rec: Record, stats: ImportStats) -> None:
        if rec.kind == "requirement":
            self._write_requirement(rec)
            stats.requirements += 1
        elif rec.kind == "systemic":
            self._write_systemic(rec)
            stats.systemic += 1
        elif rec.kind == "finding":
            self._write_finding(rec, stats)
            stats.findings += 1
        else:
            self._write_epic(rec)
            stats.epics += 1

    def _props(self, rec: Record, keys: Tuple[str, ...]) -> Dict[str, str]:
        return {k: rec.fields[k] for k in keys if rec.fields.get(k)}

    def _write_requirement(self, rec: Record) -> None:
        props = self._props(rec, ("title", "target", "status", "evidence"))
        props["statusNorm"] = normalize_status(rec.fields.get("status"))
        props["source"] = self.source
        self.graph.client.execute_write_query(
            "MERGE (q:Audit:Requirement {id: $id}) SET q += $props", {"id": rec.id, "props": props}
        )

    def _write_systemic(self, rec: Record) -> None:
        props = self._props(rec, ("title", "severity"))
        if "severity" in props:
            props["severity"] = normalize_severity(props["severity"])
        self.graph.client.execute_write_query(
            "MERGE (s:Audit:SystemicFinding {id: $id}) SET s += $props", {"id": rec.id, "props": props}
        )
        for fid in dict.fromkeys(FID_RE.findall(rec.refs)):
            self._member_of(fid, rec.id)

    def _write_epic(self, rec: Record) -> None:
        props = self._props(rec, ("title", "status"))
        self.graph.client.execute_write_query(
            "MERGE (e:Audit:Epic {id: $id}) SET e += $props", {"id": rec.id, "props": props}
        )
        for fid in dict.fromkeys(FID_RE.findall(rec.refs)):
            self.graph.client.execute_write_query(
                "MERGE (f:Audit:Finding {fid: $fid}) MERGE (e:Audit:Epic {id: $eid}) MERGE (f)-[:TRACKED_BY]->(e)",
                {"fid": fid, "eid": rec.id},
            )
        for sf in dict.fromkeys(SF_RE.findall(rec.refs)):
            self.graph.client.execute_write_query(
                """
                MATCH (f:Audit:Finding)-[:MEMBER_OF]->(:Audit:SystemicFinding {id: $sf})
                MERGE (e:Audit:Epic {id: $eid}) MERGE (f)-[:TRACKED_BY]->(e)
                """,
                {"sf": sf, "eid": rec.id},
            )
        for req in dict.fromkeys(m for m in REQ_RE.findall(rec.refs)):
            self.graph.client.execute_write_query(
                """
                MATCH (q:Audit:Requirement {id: $rid})
                MERGE (e:Audit:Epic {id: $eid}) MERGE (q)-[:TRACKED_BY]->(e)
                """,
                {"rid": req, "eid": rec.id},
            )

    def _member_of(self, fid: str, sf_id: str) -> None:
        self.graph.client.execute_write_query(
            "MERGE (f:Audit:Finding {fid: $fid}) MERGE (s:Audit:SystemicFinding {id: $sf}) MERGE (f)-[:MEMBER_OF]->(s)",
            {"fid": fid, "sf": sf_id},
        )

    def _write_finding(self, rec: Record, stats: ImportStats) -> None:
        props = self._props(rec, ("title", "severity", "sf", "tag", "fix", "status", "target", "evidence"))
        if "severity" in props:
            props["severity"] = normalize_severity(props["severity"])
        if "status" in props:
            props["statusNorm"] = normalize_status(props["status"])
        props["source"] = self.source
        self.graph.client.execute_write_query(
            "MERGE (f:Audit:Finding {fid: $fid}) SET f += $props", {"fid": rec.id, "props": props}
        )
        for sf in dict.fromkeys(SF_RE.findall(rec.fields.get("sf", ""))):
            self._member_of(rec.id, sf)
        for epic in dict.fromkeys(EPIC_RE.findall(rec.fields.get("epic", ""))):
            self.graph.client.execute_write_query(
                "MATCH (f:Audit:Finding {fid: $fid}) MERGE (e:Audit:Epic {id: $eid}) MERGE (f)-[:TRACKED_BY]->(e)",
                {"fid": rec.id, "eid": epic},
            )
        self._write_locations(rec, stats)

    def _write_locations(self, rec: Record, stats: ImportStats) -> None:
        # Overlay mirrors the document: previous location edges of this finding are replaced.
        self.graph.client.execute_write_query(
            "MATCH (f:Audit:Finding {fid: $fid})-[r:LOCATED_IN|UNRESOLVED_AT]->() DELETE r", {"fid": rec.id}
        )
        for loc in extract_locations(rec.fields.get("location") or rec.fields.get("evidence", "")):
            targets = self._resolve_location(loc)
            if not targets:
                self.graph.client.execute_write_query(
                    """
                    MATCH (f:Audit:Finding {fid: $fid})
                    MERGE (u:Audit:UnresolvedLocation {raw: $raw})
                    MERGE (f)-[:UNRESOLVED_AT]->(u)
                    """,
                    {"fid": rec.id, "raw": loc.raw},
                )
                stats.unresolved_locations += 1
                continue
            for nid, start, end in targets:
                self.graph.client.execute_write_query(
                    """
                    MATCH (f:Audit:Finding {fid: $fid})
                    MATCH (t) WHERE elementId(t) = $nid
                    MERGE (f)-[:LOCATED_IN {startLine: $start, endLine: $end}]->(t)
                    """,
                    {"fid": rec.id, "nid": nid, "start": start, "end": end},
                )
                stats.located += 1

    def _resolve_file(self, loc: Location) -> Optional[str]:
        if loc.prefix in EXTERNAL_PREFIXES:
            return None
        for suffix in candidate_suffixes(loc, self.prefixes):
            if suffix not in self._file_cache:
                self._file_cache[suffix] = unique_or_none(self.graph.resolve_source_file(suffix))
            if self._file_cache[suffix]:
                return self._file_cache[suffix]
        return None

    def _resolve_location(self, loc: Location) -> List[Tuple[str, int, int]]:
        """[(node element id, startLine, endLine)] - method containing the line, else the source file."""
        file_nid = self._resolve_file(loc)
        if not file_nid:
            return []
        if not loc.ranges:
            return [(file_nid, 0, 0)]
        out: List[Tuple[str, int, int]] = []
        for start, end in loc.ranges:
            method = self.graph.resolve_method_at(file_nid, start)
            out.append((method or file_nid, start, end))
        return out
