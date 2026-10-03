"""
Audit overlay orchestration (plan §8, Phase 6 of the graph pipeline).

Runs every overlay importer that has an input, each isolated by its own try/except so one failing importer never
stops the others (and ``GraphOrchestrator`` additionally wraps the whole overlay in ``safe_pass``).
No input -> no-op (info log).
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from audit_markdown_importer import AuditMarkdownImporter
from audit_model import AuditGraph, GraphClient, make_run_context
from facts_importer import FactsImporter
from jqa_report_importer import JqaReportImporter
from rule_coverage_linker import RuleCoverageLinker, load_rule_map
from surefire_importer import SurefireImporter

logger = logging.getLogger(__name__)

DEFAULT_DASHBOARD_NAME = "audit-compliance-dashboard.md"


def _exists(path: Optional[str], label: str) -> bool:
    """True when the optional input was given AND exists; a given-but-missing path is reported."""
    if not path:
        return False
    if os.path.exists(path):
        return True
    logger.warning("Audit overlay input '%s' not found, ignoring it: %s", label, path)
    return False


class AuditOverlay:
    def __init__(
        self,
        client: GraphClient,
        project_path: Optional[Path],
        audit_dir: Optional[str] = None,
        jqa_report: Optional[str] = None,
        audit_rule_map: Optional[str] = None,
        jacoco_xml: Optional[str] = None,
        surefire_dir: Optional[str] = None,
        dashboard_path: Optional[str] = None,
    ):
        self.client = client
        self.project_path = Path(project_path) if project_path else None
        self.audit_dir = audit_dir if _exists(audit_dir, "--audit-dir") else None
        self.jqa_report = jqa_report if _exists(jqa_report, "--jqa-report") else None
        self.audit_rule_map = audit_rule_map if _exists(audit_rule_map, "--audit-rule-map") else None
        self.jacoco_xml = jacoco_xml if _exists(jacoco_xml, "--jacoco-xml") else None
        self.surefire_dir = surefire_dir if _exists(surefire_dir, "--surefire-dir") else None
        self.dashboard_path = dashboard_path or os.environ.get("AUDIT_DASHBOARD_PATH") or None

    def has_inputs(self) -> bool:
        return any([self.audit_dir, self.jqa_report, self.audit_rule_map, self.jacoco_xml, self.surefire_dir])

    def _has_audit_inputs(self) -> bool:
        return any([self.audit_dir, self.jqa_report, self.audit_rule_map])

    def _dashboard(self) -> Optional[Path]:
        if self.dashboard_path:
            return Path(self.dashboard_path)
        if self.project_path:
            return self.project_path / "target" / DEFAULT_DASHBOARD_NAME
        return None

    def run(self) -> Dict[str, Any]:
        summary: Dict[str, Any] = {}
        if not self.has_inputs():
            logger.info("Audit overlay: no audit inputs available (audit dir, jQA report, rule map, JaCoCo, surefire) - nothing to do.")
            return summary

        run = make_run_context(self.project_path)
        graph = AuditGraph(self.client)
        rule_map = load_rule_map(self.audit_rule_map)

        def step(name: str, fn) -> None:
            try:
                summary[name] = fn()
            except Exception as exc:
                summary[name] = {"error": str(exc)}
                logger.error("Audit overlay step '%s' failed: %s", name, exc, exc_info=True)

        if self._has_audit_inputs():
            graph.init_schema()
            graph.start_run(run)
            if self.jqa_report:
                step("jqa_report", lambda: JqaReportImporter(graph).import_report(self.jqa_report, run))
            if self.audit_dir:
                step(
                    "audit_markdown",
                    lambda: AuditMarkdownImporter(graph, prefixes=rule_map.location_prefixes).import_dir(self.audit_dir),
                )
            if self.project_path:
                step("facts", lambda: FactsImporter(graph).import_facts(self.project_path, run))
            if self.surefire_dir:
                step("surefire", lambda: SurefireImporter(self.client).import_dir(self.surefire_dir, run))
            step("coverage", lambda: RuleCoverageLinker(graph).run(rule_map, run, self._dashboard()).links)
        elif self.surefire_dir:
            graph.init_schema()
            step("surefire", lambda: SurefireImporter(self.client).import_dir(self.surefire_dir, run))

        if self.jacoco_xml:
            step("jacoco", self._run_jacoco)
        return summary

    def _run_jacoco(self) -> Dict[str, Any]:
        """Calls the existing jacoco_importer + JacocoManager (previously imported but never invoked)."""
        from jacoco_importer import import_jacoco
        from jacoco_manager import JacocoManager

        try:
            import_jacoco(
                self.jacoco_xml,
                getattr(self.client, "uri", ""),
                getattr(self.client, "user", ""),
                getattr(self.client, "password", ""),
            )
        except SystemExit as exc:  # import_jacoco exits on a missing file
            raise RuntimeError(f"JaCoCo import aborted (exit {exc.code})") from exc
        return JacocoManager(self.client).enrich_methods_with_jacoco()
