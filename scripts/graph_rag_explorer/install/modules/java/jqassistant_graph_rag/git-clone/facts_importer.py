"""
Facts importer (plan §8.5) - what jQAssistant cannot parse.

Scans the project working tree for small, high-signal facts and writes them like jQA rule results:
``(:Audit:Fact)-[:VIOLATES]->(:Audit:Rule)`` with the shared severity scale and the same non-blocking behaviour.

  Flyway SQL   tech-postgres-flyway:DestructiveMigration   TRUNCATE / DROP ...
               tech-postgres-flyway:TrigramIndex           CREATE INDEX ... gin_trgm_ops
               tech-postgres-flyway:SaTableDefinition      CREATE TABLE sa_* (schema ownership facts)
  Thymeleaf    tech-thymeleaf:UnescapedOutput              th:utext
  Dockerfile   tech-docker:FloatingBaseImage               FROM without tag / :latest
               tech-docker:JvmMemoryFlagsMissing           java entrypoint without -Xmx / MaxRAMPercentage

Scanning is pure (``scan_*`` functions return :class:`Fact` objects, no DB) so it can be tested in isolation.
"""

import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterator, List, Tuple

from audit_model import AuditGraph, RunContext

logger = logging.getLogger(__name__)

SKIP_DIRS = {".git", "node_modules", "target", "build", ".token-razor", ".venv", "venv", "__pycache__", ".idea", ".gradle"}
MAX_FILE_BYTES = 2 * 1024 * 1024

# rule id -> (default severity, description)
FACT_RULES: Dict[str, Tuple[str, str]] = {
    "tech-postgres-flyway:DestructiveMigration": ("critical", "Flyway migration drops or truncates data."),
    "tech-postgres-flyway:TrigramIndex": ("minor", "Trigram (gin_trgm_ops) index: check write amplification and size."),
    "tech-postgres-flyway:SaTableDefinition": ("info", "Table in an sa_* schema/namespace (schema ownership fact)."),
    "tech-thymeleaf:UnescapedOutput": ("major", "th:utext renders unescaped HTML (XSS risk)."),
    "tech-docker:FloatingBaseImage": ("major", "Docker base image without a pinned tag (or :latest)."),
    "tech-docker:JvmMemoryFlagsMissing": ("minor", "JVM started without explicit memory flags (-Xmx / MaxRAMPercentage)."),
}


@dataclass(frozen=True)
class Fact:
    rule_id: str
    severity: str
    path: str  # relative to the project root, '/'-separated
    line: int
    snippet: str


_SQL_COMMENTS = re.compile(r"--[^\n]*|/\*.*?\*/", re.DOTALL)
_DROP_HARD = re.compile(r"\bDROP\s+(?:TABLE|SCHEMA|DATABASE|COLUMN)\b", re.IGNORECASE)
_DROP_SOFT = re.compile(r"\bDROP\s+(?:INDEX|CONSTRAINT|VIEW|TRIGGER|FUNCTION|SEQUENCE|TYPE)\b", re.IGNORECASE)
_TRUNCATE = re.compile(r"\bTRUNCATE\b", re.IGNORECASE)
_TRGM = re.compile(r"\bCREATE\s+(?:UNIQUE\s+)?INDEX\b[^;]*?gin_trgm_ops", re.IGNORECASE | re.DOTALL)
_CREATE_TABLE = re.compile(r"\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>[\w\".]+)", re.IGNORECASE)
_FROM = re.compile(r"^\s*FROM\s+(?:--platform=\S+\s+)?(?P<image>\S+)(?:\s+AS\s+(?P<alias>\S+))?", re.IGNORECASE)
_JAVA_CMD = re.compile(r"^\s*(?:ENTRYPOINT|CMD)\b.*\bjava\b", re.IGNORECASE)
_JVM_FLAGS = re.compile(r"-Xmx|MaxRAMPercentage|JAVA_TOOL_OPTIONS|JAVA_OPTS", re.IGNORECASE)


def _blank_comments(sql: str) -> str:
    """Replaces comments by spaces/newlines so offsets and line numbers are preserved."""
    return _SQL_COMMENTS.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), sql)


def _line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _fact(rule_id: str, rel: str, line: int, snippet: str, severity: str = "") -> Fact:
    return Fact(rule_id, severity or FACT_RULES[rule_id][0], rel, line, " ".join(snippet.split())[:200])


def scan_sql(text: str, rel: str) -> List[Fact]:
    sql = _blank_comments(text)
    facts: List[Fact] = []
    destructive = "tech-postgres-flyway:DestructiveMigration"
    for pattern, severity in ((_TRUNCATE, "critical"), (_DROP_HARD, "critical"), (_DROP_SOFT, "major")):
        for m in pattern.finditer(sql):
            facts.append(_fact(destructive, rel, _line_of(sql, m.start()), sql[m.start():m.start() + 120].split(";")[0], severity))
    for m in _TRGM.finditer(sql):
        facts.append(_fact("tech-postgres-flyway:TrigramIndex", rel, _line_of(sql, m.start()), m.group(0)))
    for m in _CREATE_TABLE.finditer(sql):
        if re.search(r'(^|\.)"?sa_', m.group("name"), re.IGNORECASE):
            facts.append(_fact("tech-postgres-flyway:SaTableDefinition", rel, _line_of(sql, m.start()), m.group(0)))
    return facts


def scan_thymeleaf(text: str, rel: str) -> List[Fact]:
    return [
        _fact("tech-thymeleaf:UnescapedOutput", rel, i, line)
        for i, line in enumerate(text.splitlines(), start=1)
        if "th:utext" in line
    ]


def scan_dockerfile(text: str, rel: str) -> List[Fact]:
    facts: List[Fact] = []
    stages: set = set()
    java_line = 0
    for i, line in enumerate(text.splitlines(), start=1):
        m = _FROM.match(line)
        if m:
            image = m.group("image")
            if m.group("alias"):
                stages.add(m.group("alias").lower())
            pinned = "@sha256:" in image or ":" in image.rsplit("/", 1)[-1]
            floating = (not pinned) or image.lower().endswith(":latest")
            if floating and image.lower() != "scratch" and image.lower() not in stages and "$" not in image:
                facts.append(_fact("tech-docker:FloatingBaseImage", rel, i, line))
        elif not java_line and _JAVA_CMD.match(line):
            java_line = i
    if java_line and not _JVM_FLAGS.search(text):
        facts.append(_fact("tech-docker:JvmMemoryFlagsMissing", rel, java_line, text.splitlines()[java_line - 1]))
    return facts


def _iter_files(root: Path) -> Iterator[Path]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            yield Path(dirpath) / name


def scan_project(root: Path) -> List[Fact]:
    """Walks the working tree (skipping build/vendor dirs) and returns all facts."""
    facts: List[Fact] = []
    for path in _iter_files(root):
        rel = path.relative_to(root).as_posix()
        lower = rel.lower()
        name = path.name.lower()
        if lower.endswith(".sql") and ("db/migration" in lower or "/flyway/" in lower):
            scanner = scan_sql
        elif lower.endswith(".html") and "/templates/" in f"/{lower}":
            scanner = scan_thymeleaf
        elif name == "dockerfile" or name.startswith("dockerfile.") or name.endswith(".dockerfile"):
            scanner = scan_dockerfile
        else:
            continue
        try:
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
            facts.extend(scanner(path.read_text(encoding="utf-8", errors="replace"), rel))
        except OSError as exc:
            logger.debug("Skipping unreadable file %s: %s", path, exc)
    return facts


class FactsImporter:
    def __init__(self, graph: AuditGraph):
        self.graph = graph

    def import_facts(self, project_root: Path, run: RunContext) -> Dict[str, int]:
        """Writes all facts as VIOLATES and reconciles every fact rule. Returns violations per rule id."""
        counts: Dict[str, int] = {rule_id: 0 for rule_id in FACT_RULES}
        if not project_root or not Path(project_root).is_dir():
            logger.warning("Project root not found, skipping facts import: %s", project_root)
            return counts

        facts = scan_project(Path(project_root))
        by_rule: Dict[str, List[Fact]] = {rule_id: [] for rule_id in FACT_RULES}
        for fact in facts:
            by_rule[fact.rule_id].append(fact)

        for rule_id, (severity, description) in FACT_RULES.items():
            self.graph.merge_rule(rule_id, severity, description)
            rows = []
            for fact in by_rule[rule_id]:
                key = f"fact:{rule_id}:{fact.path}:{fact.line}"
                nid = self.graph.merge_fact(
                    key, {"kind": "fact", "rule": rule_id, "path": fact.path, "line": fact.line, "snippet": fact.snippet}
                )
                if nid:
                    rows.append({"nid": nid, "key": "", "detail": f"{fact.path}:{fact.line} {fact.snippet}", "severity": fact.severity})
            counts[rule_id] = self.graph.write_violations(rule_id, severity, rows, run)
            self.graph.record_rule_evaluation(rule_id, "warning" if rows else "success", len(rows), run)
            self.graph.reconcile_rule(rule_id, run)
        logger.info("Facts import: %s", ", ".join(f"{k}={v}" for k, v in counts.items() if v) or "no facts found")
        return counts
