"""
Surefire / Failsafe XML importer (plan §8.6).

Reads ``TEST-*.xml`` from a ``surefire-reports`` / ``failsafe-reports`` directory and writes
``(:TestResult {key, className, name, status, timeSeconds, message, kind, suite, lastSeen})``, linked to the
test :Type (``-[:RESULT_OF]->``) when the class is in the graph. Failed integration tests feed the red-IT
audit items (R-02, 5-11, 9-15) through the rule map / MCP queries.
Missing or empty directories only produce a warning.
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterator, List, Optional
from xml.etree import ElementTree as ET

from audit_model import GraphClient, RunContext

logger = logging.getLogger(__name__)

STATUS_PASSED, STATUS_FAILED, STATUS_ERROR, STATUS_SKIPPED = "passed", "failed", "error", "skipped"


@dataclass
class TestCaseResult:
    __test__ = False  # not a pytest class

    class_name: str
    name: str
    status: str
    time: float
    message: str
    kind: str
    suite: str

    @property
    def key(self) -> str:
        return f"{self.class_name}#{self.name}"


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _kind_for(path: Path, class_name: str) -> str:
    if "failsafe" in path.parent.name.lower() or "failsafe" in str(path.parent).lower():
        return "failsafe"
    simple = class_name.rsplit(".", 1)[-1]
    return "failsafe" if simple.endswith(("IT", "ITCase", "IntegrationTest")) else "surefire"


def _to_float(raw: Optional[str]) -> float:
    try:
        return float((raw or "0").replace(",", ""))
    except ValueError:
        return 0.0


def parse_report_file(path: Path) -> List[TestCaseResult]:
    """One TEST-*.xml file; malformed files yield the test cases read so far (warning)."""
    results: List[TestCaseResult] = []
    suites: List[str] = []
    try:
        for _event, elem in ET.iterparse(str(path), events=("start", "end")):
            tag = _local(elem.tag)
            if _event == "start" and tag == "testsuite":
                suites.append(elem.get("name") or "")
            elif _event == "end" and tag == "testcase":
                status, message = STATUS_PASSED, ""
                for child in elem:
                    child_tag = _local(child.tag)
                    if child_tag in ("failure", "error", "skipped", "flakyFailure", "rerunFailure"):
                        status = {"failure": STATUS_FAILED, "error": STATUS_ERROR, "skipped": STATUS_SKIPPED}.get(
                            child_tag, STATUS_FAILED
                        )
                        message = " ".join((child.get("message") or child.text or "").split())[:500]
                        break
                class_name = elem.get("classname") or (suites[-1] if suites else "")
                results.append(
                    TestCaseResult(
                        class_name=class_name,
                        name=elem.get("name") or "",
                        status=status,
                        time=_to_float(elem.get("time")),
                        message=message,
                        kind=_kind_for(path, class_name),
                        suite=suites[-1] if suites else "",
                    )
                )
                elem.clear()
    except ET.ParseError as exc:
        logger.warning("Test report %s is malformed (%s); kept %d test case(s).", path.name, exc, len(results))
    return results


def _report_files(directory: Path) -> Iterator[Path]:
    yield from sorted(directory.glob("TEST-*.xml"))
    # failsafe reports live next to surefire ones; a sibling directory is picked up automatically
    sibling = directory.parent / "failsafe-reports"
    if directory.name == "surefire-reports" and sibling.is_dir():
        yield from sorted(sibling.glob("TEST-*.xml"))


class SurefireImporter:
    def __init__(self, client: GraphClient):
        self.client = client

    def import_dir(self, surefire_dir: str, run: RunContext) -> Dict[str, int]:
        counts = {STATUS_PASSED: 0, STATUS_FAILED: 0, STATUS_ERROR: 0, STATUS_SKIPPED: 0}
        directory = Path(surefire_dir) if surefire_dir else None
        if not directory or not directory.is_dir():
            logger.warning("Surefire reports directory not found, skipping: %s", surefire_dir)
            return counts

        results: List[TestCaseResult] = []
        for report in _report_files(directory):
            results.extend(parse_report_file(report))
        if not results:
            logger.warning("No surefire/failsafe TEST-*.xml results found under: %s", directory)
            return counts

        rows = [
            {
                "key": r.key,
                "className": r.class_name,
                "name": r.name,
                "status": r.status,
                "timeSeconds": r.time,
                "message": r.message,
                "kind": r.kind,
                "suite": r.suite,
            }
            for r in results
        ]
        for r in results:
            counts[r.status] = counts.get(r.status, 0) + 1
        for start in range(0, len(rows), 500):
            self.client.execute_write_query(
                """
                UNWIND $rows AS row
                MERGE (t:TestResult {key: row.key})
                SET t.className = row.className, t.name = row.name, t.status = row.status,
                    t.timeSeconds = row.timeSeconds, t.message = row.message, t.kind = row.kind,
                    t.suite = row.suite, t.lastSeen = $now, t.commit = $commit
                WITH t, row
                OPTIONAL MATCH (ty:Type {fqn: row.className})
                FOREACH (_ IN CASE WHEN ty IS NULL THEN [] ELSE [1] END | MERGE (t)-[:RESULT_OF]->(ty))
                """,
                {"rows": rows[start : start + 500], "now": run.now, "commit": run.commit},
            )
        logger.info(
            "Surefire/failsafe import: %d test(s) (%d failed, %d error, %d skipped).",
            len(results), counts[STATUS_FAILED], counts[STATUS_ERROR], counts[STATUS_SKIPPED],
        )
        return counts
