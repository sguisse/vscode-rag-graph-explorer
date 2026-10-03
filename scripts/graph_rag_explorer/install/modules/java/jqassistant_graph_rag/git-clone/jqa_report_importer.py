"""
jQAssistant XML report importer (plan §8.2).

Parses ``jqassistant-report.xml`` (jQA 2.9, default xmlns, matched by local name) and writes
``(code)-[:VIOLATES]->(:Audit:Rule)`` for CONSTRAINT rows only; concept rows are counters and are never violations.

Real layout (verified against a jQA 2.9.1 report)::

    <jqassistant-report><group id=..>(nestable)
      <constraint|concept id=.. abstract="false"><description/>
        <result><columns primary="Element"><column>..</column></columns>
          <rows count><row key><column name="Element">
              <element language="Java">Method|Type|Package|Field|Constructor|File|Pom</element>
              <source fileName="/rel/Foo.java" startLine endLine><parent fileName="/abs/target/classes"/></source>
              <value>void foo()</value></column>
            <column name="Fqn"><value>declaring.type.Fqn</value></column><column name="Detail">..</column></row></rows></result>
        <verificationResult/><status>failure|warning|success|skipped</status><severity level="0">blocker</severity>

* ``status`` / ``severity`` are child elements of the rule (not of ``result``, not attributes).
* The same rule id may appear in several groups: results are de-duplicated by id, preferring the entry with rows.
* The row's primary column (``columns/@primary``, default ``Element``) is the element; the declaring type is the
  ``Fqn`` column (or the first other cell of kind Type). ``source/@fileName`` is relative to ``source/parent``.
* Defensive: tolerant to missing/partial/truncated/empty reports.
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET

from audit_model import AuditGraph, RunContext, normalize_severity, unique_or_none

logger = logging.getLogger(__name__)

_RULE_TAGS = {"constraint", "concept"}
_SKIPPED_STATUSES = {"skipped"}
_LEVEL_SEVERITY = {"0": "blocker", "1": "critical", "2": "major", "3": "minor", "4": "info"}
_SOURCE_SUFFIXES = (".java", ".kt", ".kts")


@dataclass
class ReportRow:
    element: str = ""
    fqn: str = ""
    detail: str = ""
    file: str = ""  # source/@fileName: relative to the parent artifact directory
    line: Optional[int] = None
    kind: str = ""  # Method | Constructor | Field | Type | Package | File | Pom | '' (plain string)
    parent: str = ""  # source/parent/@fileName (artifact directory)


@dataclass
class ReportRule:
    id: str
    kind: str  # 'constraint' | 'concept'
    status: str = ""
    severity: str = "major"
    rows: List[ReportRow] = field(default_factory=list)


@dataclass
class ImportStats:
    rules_seen: int = 0
    constraints_with_rows: int = 0
    concepts_seen: int = 0
    violations_written: int = 0
    anchored_as_fact: int = 0
    resolved_to_code: int = 0
    inactive_marked: int = 0
    partial: bool = False


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def _child(node: Optional[ET.Element], name: str) -> Optional[ET.Element]:
    if node is None:
        return None
    for child in node:
        if _local(child.tag) == name:
            return child
    return None


def _clean(text: Optional[str]) -> str:
    return " ".join((text or "").split())


def _to_int(raw: Optional[str]) -> Optional[int]:
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        return None


@dataclass
class _Cell:
    value: str = ""
    kind: str = ""
    file: str = ""
    start: Optional[int] = None
    parent: str = ""


def _parse_cell(col: ET.Element) -> _Cell:
    """Cell text lives in <value>; <element> carries the node kind, <source> the file/lines."""
    cell = _Cell()
    value = _child(col, "value")
    if value is not None:
        cell.value = _clean("".join(value.itertext()))
    else:
        cell.value = _clean(col.text)
    kind = _child(col, "element")
    if kind is not None:
        cell.kind = _clean(kind.text)
    src = _child(col, "source")
    if src is not None:
        cell.file = src.get("fileName") or src.get("name") or ""
        cell.start = _to_int(src.get("startLine") or src.get("line"))
        parent = _child(src, "parent")
        cell.parent = (parent.get("fileName") if parent is not None else "") or ""
    return cell


def _parse_row(row: ET.Element, header: List[str], primary: str) -> ReportRow:
    cells: Dict[str, _Cell] = {}
    for idx, col in enumerate(c for c in row if _local(c.tag) == "column"):
        name = (col.get("name") or (header[idx] if idx < len(header) else "")).strip()
        cells[name or f"#{idx}"] = _parse_cell(col)
    lower = {k.lower(): v for k, v in cells.items()}
    main = cells.get(primary) or lower.get("element") or next(iter(cells.values()), _Cell())
    fqn = lower["fqn"].value if "fqn" in lower else ""
    if not fqn:  # custom columns (e.g. TestClass / TestMethod): declaring type is the other Type cell
        fqn = next((c.value for c in cells.values() if c is not main and c.kind == "Type"), "")
    file_col = lower.get("file")
    line_col = lower.get("line")
    return ReportRow(
        element=main.value,
        fqn=fqn,
        detail=lower["detail"].value if "detail" in lower else "",
        file=(file_col.value if file_col and file_col.value else main.file),
        line=_to_int(line_col.value) if line_col and line_col.value else main.start,
        kind=main.kind,
        parent=main.parent,
    )


def _parse_rule(node: ET.Element) -> Optional[ReportRule]:
    rule_id = (node.get("id") or "").strip()
    if not rule_id:
        return None
    result = _child(node, "result")
    status_node = _child(node, "status")
    if status_node is None:
        status_node = _child(result, "status")
    severity_node = _child(node, "severity")
    if severity_node is None:
        severity_node = _child(result, "severity")
    severity_raw = _clean(severity_node.text) if severity_node is not None else ""
    if not severity_raw and severity_node is not None:
        severity_raw = _LEVEL_SEVERITY.get(severity_node.get("level", ""), "")
    rule = ReportRule(
        id=rule_id,
        kind=_local(node.tag),
        status=_clean(status_node.text).lower() if status_node is not None else "",
        severity=normalize_severity(severity_raw or node.get("severity")),
    )
    if result is None:
        return rule
    columns = _child(result, "columns")
    header = [_clean(c.text) for c in columns if _local(c.tag) == "column"] if columns is not None else []
    primary = (columns.get("primary") if columns is not None else "") or "Element"
    rows = _child(result, "rows")
    if rows is not None:
        rule.rows = [_parse_row(r, header, primary) for r in rows if _local(r.tag) == "row"]
    return rule


def parse_report(report_path: str) -> Tuple[List[ReportRule], bool]:
    """
    Returns ``(rules, partial)``. Rules are found at any depth (groups nest) and de-duplicated by id, preferring
    the entry with rows. A missing/empty report yields ``([], False)`` with a warning; truncated XML yields every
    rule completely written before the error with ``partial=True``. A complete report = parsed without error and
    containing at least one rule.
    """
    path = Path(report_path)
    if not path.is_file():
        logger.warning("jQA report not found, skipping report import: %s", path)
        return [], False
    if path.stat().st_size == 0:
        logger.warning("jQA report is empty, skipping report import: %s", path)
        return [], False

    by_id: Dict[Tuple[str, str], ReportRule] = {}
    partial = False
    try:
        for _event, elem in ET.iterparse(str(path), events=("end",)):
            if _local(elem.tag) in _RULE_TAGS:
                rule = _parse_rule(elem)
                if rule:
                    key = (rule.kind, rule.id)
                    known = by_id.get(key)
                    if known is None or (rule.rows and not known.rows):
                        by_id[key] = rule
                elem.clear()
    except ET.ParseError as exc:
        partial = True
        logger.warning("jQA report is truncated or malformed (%s); using %d complete rule(s).", exc, len(by_id))
    rules = list(by_id.values())
    if not rules:
        logger.warning("jQA report contains no concept/constraint results: %s", path)
    return rules, partial


class JqaReportImporter:
    """Maps jQA constraint rows onto the code graph and writes the VIOLATES overlay."""

    def __init__(self, graph: AuditGraph):
        self.graph = graph

    def import_report(self, report_path: str, run: RunContext) -> ImportStats:
        stats = ImportStats()
        rules, stats.partial = parse_report(report_path)
        for rule in rules:
            if rule.kind == "concept":
                stats.concepts_seen += 1
                continue
            try:
                self._import_rule(rule, run, stats)
            except Exception as exc:
                logger.error("Failed to import jQA rule '%s': %s", rule.id, exc, exc_info=True)
        logger.info(
            "jQA report import: %d constraint(s), %d concept(s), %d violation(s) written "
            "(%d on code, %d anchored as facts), %d marked inactive%s.",
            stats.rules_seen,
            stats.concepts_seen,
            stats.violations_written,
            stats.resolved_to_code,
            stats.anchored_as_fact,
            stats.inactive_marked,
            " [PARTIAL REPORT]" if stats.partial else "",
        )
        return stats

    def _import_rule(self, rule: ReportRule, run: RunContext, stats: ImportStats) -> None:
        stats.rules_seen += 1
        self.graph.merge_rule(rule.id, rule.severity)
        if rule.status in _SKIPPED_STATUSES:
            return  # registered but not evaluated
        self.graph.record_rule_evaluation(rule.id, rule.status or "unknown", len(rule.rows), run)
        if rule.rows:
            stats.constraints_with_rows += 1

        grouped: Dict[Tuple[str, str], Dict[str, object]] = {}
        for row in rule.rows:
            nid, key = self._resolve_row(rule, row, stats)
            if not nid:
                continue
            entry = grouped.setdefault((nid, key), {"nid": nid, "key": key, "detail": row.detail or row.element, "count": 0})
            entry["count"] = int(entry["count"]) + 1

        stats.violations_written += self.graph.write_violations(rule.id, rule.severity, list(grouped.values()), run)
        stats.inactive_marked += self.graph.reconcile_rule(rule.id, run)

    def _resolve_row(self, rule: ReportRule, row: ReportRow, stats: ImportStats) -> Tuple[Optional[str], str]:
        """By node kind (Method/Constructor/Field/Type/Package), then File+Line -> :SourceFile, then an :Audit:Fact anchor."""
        nid = self._resolve_by_kind(row)
        if nid:
            stats.resolved_to_code += 1
            return nid, ""

        if row.file and row.file.lower().endswith(_SOURCE_SUFFIXES):
            # fileName is relative to the parent artifact directory: match on the relative part only
            file_nid = unique_or_none(self.graph.resolve_source_file(row.file))
            if file_nid:
                stats.resolved_to_code += 1
                return file_nid, str(row.line or "")

        if row.kind in ("Method", "Constructor", "Field") and row.fqn:
            type_nid = unique_or_none(self.graph.resolve_type(row.fqn))
            if type_nid:
                stats.resolved_to_code += 1
                return type_nid, ""

        anchor_key = f"jqa:{rule.id}:{row.element or row.file}:{row.line or ''}"
        nid = self.graph.merge_fact(
            anchor_key,
            {
                "kind": "jqa-row",
                "nodeKind": row.kind,
                "rule": rule.id,
                "element": row.element,
                "fqn": row.fqn,
                "file": row.file,
                "parent": row.parent,
                "line": row.line or 0,
            },
        )
        if nid:
            stats.anchored_as_fact += 1
        return nid, ""

    def _resolve_by_kind(self, row: ReportRow) -> Optional[str]:
        element, fqn, kind = row.element, row.fqn, row.kind
        if kind in ("Method", "Constructor") and fqn:
            return unique_or_none(self.graph.resolve_method(fqn, element))
        if kind == "Field" and fqn:
            return unique_or_none(self.graph.resolve_field(fqn, element))
        if kind == "Type":
            return unique_or_none(self.graph.resolve_type(fqn or element))
        if kind == "Package":
            return unique_or_none(self.graph.resolve_package(fqn or element))
        if not kind:  # plain string cell: only treat it as code when the columns say so
            if "(" in element and fqn:
                return unique_or_none(self.graph.resolve_method(fqn, element))
            if fqn and fqn == element and " " not in fqn and "/" not in fqn and "." in fqn:
                return unique_or_none(self.graph.resolve_type(fqn))
        return None
