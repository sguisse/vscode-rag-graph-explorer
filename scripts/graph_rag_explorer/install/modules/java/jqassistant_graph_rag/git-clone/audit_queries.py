"""
Read-only audit overlay queries behind the MCP tools ``get_audit_findings``, ``get_rule_violations``,
``get_audit_coverage`` and ``explain_finding``.

Kept free of fastmcp/LLM imports so it can be unit-tested with a mocked ``GraphClient``.
All user input travels as Cypher parameters (never interpolated).
"""

import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from audit_model import GraphClient, normalize_severity, severity_weight

# Roots matched by entity id, fqn, method signature, file path suffix or simple type name,
# expanded to their declared members and everything linked through WITH_SOURCE (or, on a raw jQA graph without
# WITH_SOURCE, the types whose fqn matches a source file path).
_SCOPE = """
MATCH (root)
WHERE NOT root:Audit AND (
      root.entity_id = $q OR root.fqn = $q OR root.signature = $q
   OR replace(coalesce(root.absolute_path, root.fileName, ''), '\\\\', '/') ENDS WITH $q
   OR (root:Type AND root.name = $q))
WITH root LIMIT 25
OPTIONAL MATCH (st:Type)
WHERE root:File AND NOT root:Type AND NOT root:Directory
  AND (replace(coalesce(root.absolute_path, root.fileName, ''), '\\\\', '/') ENDS WITH (replace(split(st.fqn, '$')[0], '.', '/') + '.java')
    OR replace(coalesce(root.absolute_path, root.fileName, ''), '\\\\', '/') ENDS WITH (replace(split(st.fqn, '$')[0], '.', '/') + '.kt'))
WITH root, collect(DISTINCT st) AS srcTypes
WITH [root] + srcTypes + [(root)-[:DECLARES]->(m) | m] + [(x)-[:WITH_SOURCE]->(root) | x]
     + reduce(acc = [], t IN srcTypes | acc + [(t)-[:DECLARES]->(mm) | mm]) AS scope
UNWIND scope AS n
WITH DISTINCT n
"""

_ELEMENT = "coalesce(n.fqn, n.signature, n.key, n.absolute_path, n.fileName, n.name)"


def _norm_path(value: str) -> str:
    return (value or "").strip().replace("\\", "/")


def get_audit_findings(
    client: GraphClient, entity_or_file: str, min_severity: str = "info", limit: int = 200
) -> Dict[str, Any]:
    """Violations and audit findings attached to a type / method / file (by id, fqn, signature, path or name)."""
    query = _norm_path(entity_or_file)
    if not query:
        return {"error": "entity_or_file must not be empty."}
    min_sev = normalize_severity(min_severity, "info")
    min_weight = severity_weight(min_sev)
    violations = client.execute_read_query(
        _SCOPE
        + f"""
        MATCH (n)-[v:VIOLATES]->(r:Audit:Rule)
        WHERE coalesce(v.weight, 0) >= $minWeight
        RETURN n.entity_id AS entityId, labels(n) AS labels, {_ELEMENT} AS element, r.id AS rule,
               v.severity AS severity, v.detail AS detail, v.count AS count,
               v.firstSeen AS firstSeen, v.lastSeen AS lastSeen, coalesce(v.active, true) AS active
        ORDER BY coalesce(v.weight, 0) DESC, element
        LIMIT $limit
        """,
        {"q": query, "minWeight": min_weight, "limit": int(limit)},
    )
    findings = client.execute_read_query(
        _SCOPE
        + f"""
        MATCH (f:Audit:Finding)-[l:LOCATED_IN]->(n)
        RETURN f.fid AS fid, f.severity AS severity, f.title AS title, f.tag AS tag, f.sf AS sf,
               l.startLine AS startLine, l.endLine AS endLine, {_ELEMENT} AS element
        ORDER BY f.fid
        LIMIT $limit
        """,
        {"q": query, "limit": int(limit)},
    )
    findings = [f for f in findings if not f.get("severity") or severity_weight(f["severity"]) >= min_weight]
    return {"query": query, "minSeverity": min_sev, "violations": violations, "findings": findings}


def get_rule_violations(client: GraphClient, rule_id: str, limit: int = 500) -> Dict[str, Any]:
    """Rule metadata (incl. last evaluation), what it covers and every violation (active first)."""
    rule = client.execute_read_query(
        """
        MATCH (r:Audit:Rule {id: $id})
        RETURN properties(r) AS rule, [(r)-[:COVERS]->(a) | coalesce(a.fid, a.id)] AS covers
        """,
        {"id": rule_id},
    )
    if not rule:
        return {"error": f"Rule '{rule_id}' not found in the audit overlay."}
    violations = client.execute_read_query(
        f"""
        MATCH (n)-[v:VIOLATES]->(r:Audit:Rule {{id: $id}})
        RETURN n.entity_id AS entityId, labels(n) AS labels, {_ELEMENT} AS element, v.severity AS severity,
               v.detail AS detail, v.count AS count, v.firstSeen AS firstSeen, v.lastSeen AS lastSeen,
               coalesce(v.active, true) AS active
        ORDER BY active DESC, coalesce(v.weight, 0) DESC, element
        LIMIT $limit
        """,
        {"id": rule_id, "limit": int(limit)},
    )
    return {
        "rule": rule[0]["rule"],
        "covers": rule[0]["covers"],
        "activeViolations": sum(1 for v in violations if v["active"]),
        "violations": violations,
    }


def get_audit_coverage(client: GraphClient) -> Dict[str, Any]:
    """Coverage statuses computed by the rule coverage linker (confirmed / resolved? / contradiction / ...)."""
    items = client.execute_read_query(
        """
        MATCH (a:Audit) WHERE a:Finding OR a:Requirement OR a:SystemicFinding OR a:Epic
        RETURN coalesce(a.fid, a.id) AS id,
               head([l IN labels(a) WHERE l <> 'Audit']) AS kind,
               coalesce(a.coverageStatus, 'unassessed') AS status,
               a.coverageNote AS note, a.novelty AS novelty
        ORDER BY kind, id
        """
    )
    by_status: Dict[str, int] = {}
    by_kind: Dict[str, Dict[str, int]] = {}
    for item in items:
        by_status[item["status"]] = by_status.get(item["status"], 0) + 1
        kind_counts = by_kind.setdefault(item["kind"], {})
        kind_counts[item["status"]] = kind_counts.get(item["status"], 0) + 1
    candidates = client.execute_read_query(
        "MATCH (r:Audit:Rule) WHERE coalesce(r.newCandidates, 0) > 0 "
        "RETURN r.id AS rule, r.newCandidates AS violations ORDER BY violations DESC"
    )
    totals = client.execute_read_query(
        "MATCH (r:Audit:Rule) RETURN count(r) AS rules, count(r.lastEvaluated) AS evaluated"
    )
    unresolved = client.execute_read_query("MATCH (u:Audit:UnresolvedLocation) RETURN count(u) AS n")
    summary = totals[0] if totals else {"rules": 0, "evaluated": 0}
    result: Dict[str, Any] = {
        "byStatus": by_status,
        "byKind": by_kind,
        "items": items,
        "newCandidates": candidates,
        "rules": {"total": summary["rules"], "evaluated": summary["evaluated"]},
        "unresolvedLocations": unresolved[0]["n"] if unresolved else 0,
    }
    if not items:
        result["note"] = "No audit items in the graph. Run the graph-rag audit overlay (--audit-dir / --jqa-report)."
    return result


def _find_on_disk(rel_path: str, project_root: Optional[str]) -> Optional[str]:
    """Locates a '/'-relative source path under the project root (raw jQA graphs have no absolute_path)."""
    if not rel_path or not project_root or not os.path.isdir(project_root):
        return None
    rel = rel_path.replace("\\", "/").lstrip("/")
    candidates = [rel]
    if rel.endswith(".java"):
        candidates.append(rel[: -len(".java")] + ".kt")
    for candidate in candidates:
        for hit in Path(project_root).rglob(candidate):
            if hit.is_file() and "target" not in hit.relative_to(project_root).parts[:1]:
                return str(hit)
    return None


def explain_finding(
    client: GraphClient,
    fid: str,
    read_slice: Callable[[str, int, int], str],
    context_lines: int = 3,
    max_lines: int = 200,
    project_root: Optional[str] = None,
) -> Dict[str, Any]:
    """Finding + source slice(s) + covering rules + current violation state."""
    head = client.execute_read_query(
        """
        MATCH (f:Audit:Finding {fid: $fid})
        RETURN properties(f) AS finding,
               [(f)-[:MEMBER_OF]->(s) | s.id] AS systemicFindings,
               [(f)-[:TRACKED_BY]->(e) | e.id] AS epics,
               [(f)-[:UNRESOLVED_AT]->(u) | u.raw] AS unresolvedLocations
        """,
        {"fid": fid},
    )
    if not head:
        return {"error": f"Finding '{fid}' not found in the audit overlay."}

    locations = client.execute_read_query(
        """
        MATCH (f:Audit:Finding {fid: $fid})-[l:LOCATED_IN]->(n)
        OPTIONAL MATCH (n)-[:WITH_SOURCE]->(sf:File)
        OPTIONAL MATCH (t:Type)-[:DECLARES]->(n)
        WITH l, n, sf, head(collect(t)) AS t
        RETURN labels(n) AS labels, coalesce(n.fqn, n.signature, n.absolute_path, n.fileName) AS element,
               l.startLine AS startLine, l.endLine AS endLine,
               n.firstLineNumber AS firstLine, n.lastLineNumber AS lastLine,
               coalesce(n.absolute_path, sf.absolute_path) AS file,
               CASE WHEN n:File THEN n.fileName
                    WHEN t IS NOT NULL THEN replace(split(t.fqn, '$')[0], '.', '/') + '.java' END AS relFile
        """,
        {"fid": fid},
    )
    located: List[Dict[str, Any]] = []
    for loc in locations:
        path = loc.get("file")
        if not (path and os.path.exists(path)):
            path = _find_on_disk(loc.get("relFile") or "", project_root) or path
            loc["file"] = path
        start, end = loc.get("startLine") or 0, loc.get("endLine") or 0
        if start:
            start, end = max(1, start - context_lines), max(end, start) + context_lines
        else:
            start, end = loc.get("firstLine") or 0, loc.get("lastLine") or 0
        loc["slice"] = None
        if path and start and end and os.path.exists(path):
            end = min(end, start + max_lines)
            loc["slice"] = read_slice(path, start, end)
            loc["sliceLines"] = [start, end]
        located.append(loc)

    rules = client.execute_read_query(
        """
        MATCH (r:Audit:Rule)-[:COVERS]->(:Audit:Finding {fid: $fid})
        OPTIONAL MATCH ()-[v:VIOLATES]->(r) WHERE coalesce(v.active, true)
        RETURN r.id AS rule, r.severity AS severity, r.lastEvaluated AS lastEvaluated,
               r.lastStatus AS lastStatus, count(v) AS activeViolations
        ORDER BY rule
        """,
        {"fid": fid},
    )
    at_location = client.execute_read_query(
        """
        MATCH (f:Audit:Finding {fid: $fid})-[:LOCATED_IN]->(loc)
        MATCH (r:Audit:Rule)-[:COVERS]->(f)
        MATCH (n)-[v:VIOLATES]->(r)
        WHERE coalesce(v.active, true)
          AND (n = loc OR EXISTS { (n)-[:DECLARES]->(loc) } OR EXISTS { (loc)-[:DECLARES]->(n) }
               OR EXISTS { (n)-[:WITH_SOURCE]->(loc) } OR EXISTS { (loc)-[:WITH_SOURCE]->(n) })
        RETURN r.id AS rule, count(DISTINCT n) AS violationsAtLocation, collect(DISTINCT v.detail)[..3] AS details
        """,
        {"fid": fid},
    )
    near = {row["rule"]: row for row in at_location}
    for rule in rules:
        rule["evaluated"] = rule["lastEvaluated"] is not None
        rule["violationsAtLocation"] = near.get(rule["rule"], {}).get("violationsAtLocation", 0)
        rule["details"] = near.get(rule["rule"], {}).get("details", [])

    finding = head[0]["finding"]
    return {
        "finding": finding,
        "coverageStatus": finding.get("coverageStatus", "unassessed"),
        "systemicFindings": head[0]["systemicFindings"],
        "epics": head[0]["epics"],
        "unresolvedLocations": head[0]["unresolvedLocations"],
        "locations": located,
        "coveringRules": rules,
    }
