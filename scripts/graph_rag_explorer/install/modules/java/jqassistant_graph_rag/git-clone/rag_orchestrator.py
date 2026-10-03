import logging
import os
import re
from collections import defaultdict
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Union
from pathlib import Path

from neo4j_manager import Neo4jManager
from method_analyzer import MethodAnalyzer
from method_summarizer import MethodSummarizer
from type_summarizer import TypeSummarizer
from source_file_summarizer import SourceFileSummarizer
from directory_summarizer import DirectorySummarizer
from package_summarizer import PackageSummarizer
from project_summarizer import ProjectSummarizer
from entity_embedder import EntityEmbedder
from llm_client import (
    get_llm_client,
    get_embedding_client,
    LlmClient,
    EmbeddingClient,
    FakeLlmClient,
    set_global_llm_total,
    set_pass_total,
    reset_global_llm_progress,
    reset_label_call_counts,
    reset_all_pass_progress,
)
from summary_cache_manager import SummaryCacheManager
from node_summary_processor import NodeSummaryProcessor
from prompt_manager import AuditAwarePromptManager

logger = logging.getLogger(__name__)


@dataclass
class _CounterPlan:
    global_total: int = 0
    per_label_totals: dict[str, int] = field(default_factory=dict)


class _PlanningLlmClient(LlmClient):
    def __init__(self):
        self._fake = FakeLlmClient()
        self.global_total = 0
        self.per_label_totals: dict[str, int] = defaultdict(int)
        self._label_call_counts: dict[str, int] = defaultdict(int)

    @staticmethod
    def _camel_to_upper_snake(name: str) -> str:
        s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
        s2 = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", s1)
        return s2.upper()

    def _get_label_max(self, label: str) -> int | None:
        snake = self._camel_to_upper_snake(label)
        raw = os.environ.get(f"{snake}_MAX_LLM_CALL") or os.environ.get("MAX_LLM_CALL")
        if raw:
            try:
                value = int(raw)
                return value if value > 0 else None
            except ValueError:
                return None
        return None

    def generate_summary(
        self, prompt: str, index: int = 1, total: int = 1, label: str = ""
    ) -> str:
        if label:
            max_calls = self._get_label_max(label)
            current = self._label_call_counts[label]
            if max_calls is not None and current >= max_calls:
                return ""
            self._label_call_counts[label] = current + 1
            self.per_label_totals[label] += 1

        self.global_total += 1
        return self._fake._call_llm(prompt, index, total)

    def _call_llm(self, prompt: str, index: int = 1, total: int = 1) -> str:
        return self._fake._call_llm(prompt, index, total)


class RagOrchestrator:
    """
    Manages and executes the sequence of RAG (summary and embedding) generation passes.
    """

    def __init__(
        self,
        neo4j_manager: Neo4jManager,
        project_path: Union[Path, str, None],
        llm_api: str,
        min_cyclomatic: int = 0,
    ):
        self.neo4j_manager = neo4j_manager
        if project_path is None:
            self.project_path = Path.cwd().resolve()
        elif isinstance(project_path, str):
            self.project_path = Path(project_path).resolve()
        else:
            self.project_path = project_path.resolve()

        self.project_name = self.project_path.name
        self.llm_api = llm_api
        self.min_cyclomatic = int(min_cyclomatic or 0)

        logger.info(
            f"Initialized RagOrchestrator for project: '{self.project_name}' (path: {self.project_path}) with LLM API: '{self.llm_api}'"
        )

        self.llm_client: LlmClient = get_llm_client(self.llm_api)
        self.embedding_client: EmbeddingClient = get_embedding_client(
            "sentence-transformer"
        )
        self.cache_manager = SummaryCacheManager(str(self.project_path))
        self.node_summary_processor = NodeSummaryProcessor(
            self.llm_client, self.cache_manager
        )

        self.method_analyzer = MethodAnalyzer(
            neo4j_manager, self.node_summary_processor
        )
        try:
            self.method_analyzer.min_cyclomatic = int(self.min_cyclomatic)
        except Exception:
            pass
        self.method_summarizer = MethodSummarizer(
            neo4j_manager, self.node_summary_processor
        )
        self.type_summarizer = TypeSummarizer(
            neo4j_manager, self.node_summary_processor
        )
        self.source_file_summarizer = SourceFileSummarizer(
            neo4j_manager, self.node_summary_processor
        )
        self.directory_summarizer = DirectorySummarizer(
            neo4j_manager, self.node_summary_processor
        )
        self.package_summarizer = PackageSummarizer(
            neo4j_manager, self.node_summary_processor
        )
        self.project_summarizer = ProjectSummarizer(
            neo4j_manager, self.node_summary_processor
        )
        self.entity_embedder = EntityEmbedder(neo4j_manager, self.embedding_client)

    def run_rag_passes(self):
        """
        Executes the full sequence of RAG generation passes with caching.
        """
        logger.info("🔍 [RAG Pre-flight] Running pre-flight checks on Neo4j schema...")
        type_check_java = self.neo4j_manager.execute_read_query(
            "MATCH (t:Java:Type) RETURN count(t) AS n LIMIT 1"
        )
        type_count_java = type_check_java[0]["n"] if type_check_java else 0

        type_check_any = self.neo4j_manager.execute_read_query(
            "MATCH (t:Type) RETURN count(t) AS n LIMIT 1"
        )
        type_count_any = type_check_any[0]["n"] if type_check_any else 0

        logger.info(
            f"🔍 [RAG Pre-flight] Count of :Java:Type nodes = {type_count_java} | Count of :Type nodes = {type_count_any}"
        )

        if type_count_any == 0:
            logger.warning(
                "RAG SKIPPED: No :Type nodes found in the graph. "
                "Summarization passes require a prior jqassistant scan to produce results."
            )
            return

        if type_count_java == 0 and type_count_any > 0:
            logger.info(
                "ℹ️ [RAG Pre-flight] Notice: :Type nodes exist without the explicit :Java label. Proceeding with :Type matching."
            )

        self._run_audit_pre_pass()

        self.cache_manager.load()
        progress_plan: Optional[_CounterPlan] = None
        try:
            reset_global_llm_progress()
            reset_label_call_counts()
            reset_all_pass_progress()
            progress_plan = self._build_exact_progress_plan()
            if progress_plan.global_total > 0:
                set_global_llm_total(progress_plan.global_total)
                logger.info(
                    "Exact LLM progress plan built: %d calls across %d passes.",
                    progress_plan.global_total,
                    len(progress_plan.per_label_totals),
                )
        except Exception:
            logger.exception(
                "Failed to build exact progress plan; continuing without a global denominator."
            )

        try:
            logger.info(
                f"--- Starting All RAG Generation Passes for project: {self.project_name} ---"
            )

            self._initialize_pass_progress(progress_plan, "MethodAnalyzer")
            logger.info("▶ Running pass: MethodAnalyzer")
            self.method_analyzer.run()

            self._initialize_pass_progress(progress_plan, "MethodSummarizer")
            logger.info("▶ Running pass: MethodSummarizer")
            self.method_summarizer.run()

            self._initialize_pass_progress(progress_plan, "TypeSummarizer")
            logger.info("▶ Running pass: TypeSummarizer")
            self.type_summarizer.run()

            self._initialize_pass_progress(progress_plan, "SourceFileSummarizer")
            logger.info("▶ Running pass: SourceFileSummarizer")
            self.source_file_summarizer.run()

            self._initialize_pass_progress(progress_plan, "DirectorySummarizer")
            logger.info("▶ Running pass: DirectorySummarizer")
            self.directory_summarizer.run()

            self._initialize_pass_progress(progress_plan, "PackageSummarizer")
            logger.info("▶ Running pass: PackageSummarizer")
            self.package_summarizer.run()

            self._initialize_pass_progress(progress_plan, "ProjectSummarizer")
            logger.info("▶ Running pass: ProjectSummarizer")
            self.project_summarizer.run()

            logger.info("▶ Running pass: EntityEmbedder")
            self.entity_embedder.add_entity_labels_and_embeddings()

            logger.info(
                f"--- All RAG Generation Passes for project: {self.project_name} Complete ---"
            )
        finally:
            self.cache_manager.save()

    # ------------------------------------------------------------------
    # Audit overlay (additive): risk scores + findings as summary context
    # ------------------------------------------------------------------
    _RISK_LABELS = ("Type", "Package", "Module")

    def _run_audit_pre_pass(self) -> None:
        """Runs before the existing passes, only when overlay data (VIOLATES) exists. Never raises."""
        try:
            from audit_model import AuditGraph

            if not AuditGraph(self.neo4j_manager).has_overlay_data():
                logger.info("ℹ️ [RAG Audit] No audit overlay data found; skipping risk scores.")
                return
            self.compute_risk_scores()
            self._install_audit_prompt_context()
        except Exception:
            logger.exception("Audit pre-pass failed; continuing with the regular RAG passes.")

    def compute_risk_scores(self) -> None:
        """
        riskScore = max severity weight + number of active violations, on Type (own + declared members),
        Package (all contained types) and Module (types under its base package), derived from VIOLATES.
        Properties: riskScore, riskMaxWeight, riskCount. Stale scores are reset first.
        """
        for label in self._RISK_LABELS:
            self.neo4j_manager.execute_write_query(
                f"MATCH (n:{label}) WHERE n.riskScore IS NOT NULL "
                "REMOVE n.riskScore, n.riskMaxWeight, n.riskCount"
            )
        self.neo4j_manager.execute_write_query(
            """
            MATCH (t:Type)-[:DECLARES*0..1]->(n)-[v:VIOLATES]->(:Audit:Rule)
            WHERE coalesce(v.active, true)
            WITH t, max(coalesce(v.weight, 0)) AS mx, count(v) AS cnt
            SET t.riskMaxWeight = mx, t.riskCount = cnt, t.riskScore = mx + cnt
            """
        )
        self.neo4j_manager.execute_write_query(
            """
            MATCH (p:Package)-[:CONTAINS_CLASS|CONTAINS*1..15]->(t:Type) WHERE t.riskScore IS NOT NULL
            WITH DISTINCT p, t
            WITH p, max(t.riskMaxWeight) AS mx, sum(t.riskCount) AS cnt
            SET p.riskMaxWeight = mx, p.riskCount = cnt, p.riskScore = mx + cnt
            """
        )
        # Module: best effort - :Module nodes (spring-modulith concept) exposing fqn or basePackage.
        self.neo4j_manager.execute_write_query(
            """
            MATCH (m:Module) WHERE coalesce(m.fqn, m.basePackage) IS NOT NULL
            MATCH (t:Type) WHERE t.riskScore IS NOT NULL
              AND t.fqn STARTS WITH (coalesce(m.fqn, m.basePackage) + '.')
            WITH m, max(t.riskMaxWeight) AS mx, sum(t.riskCount) AS cnt
            SET m.riskMaxWeight = mx, m.riskCount = cnt, m.riskScore = mx + cnt
            """
        )
        logger.info("✅ [RAG Audit] riskScore computed on Type, Package and Module nodes.")

    def _install_audit_prompt_context(self) -> None:
        """
        Attaches active findings to type/method summary prompts via AuditAwarePromptManager.
        Note: analyzer.py hard-codes llm_api="fake", so this only becomes useful once a real LLM is configured.
        Names shared by several nodes are skipped (prompts only carry the simple name); cached summaries are
        reused as-is, so already cached nodes do not get the extra context until their cache entry is regenerated.
        """
        rows = self.neo4j_manager.execute_read_query(
            """
            MATCH (n)-[v:VIOLATES]->(r:Audit:Rule)
            WHERE coalesce(v.active, true) AND (n:Type OR n:Method) AND n.name IS NOT NULL
            RETURN n.name AS name, n:Type AS isType, r.id AS rule, v.severity AS severity,
                   CASE WHEN n:Type THEN COUNT { MATCH (x:Type {name: n.name}) }
                        ELSE COUNT { MATCH (x:Method {name: n.name}) } END AS same
            """
        ) or []
        type_findings: dict[str, list[str]] = defaultdict(list)
        method_findings: dict[str, list[str]] = defaultdict(list)
        for row in rows:
            if row.get("same", 0) != 1:
                continue
            target = type_findings if row.get("isType") else method_findings
            entry = f"{row['rule']} ({row.get('severity') or 'n/a'})"
            if entry not in target[row["name"]]:
                target[row["name"]].append(entry)
        if type_findings or method_findings:
            self.node_summary_processor.prompt_manager = AuditAwarePromptManager(
                dict(type_findings), dict(method_findings)
            )
            logger.info(
                "✅ [RAG Audit] Findings attached to %d type(s) and %d method(s) as summary context.",
                len(type_findings), len(method_findings),
            )

    @staticmethod
    def _initialize_pass_progress(
        progress_plan: Optional[_CounterPlan], label: str
    ) -> None:
        if not progress_plan:
            return
        total = progress_plan.per_label_totals.get(label)
        if total is None:
            return
        set_pass_total(label, total)

    @staticmethod
    def _apply_simulated_result(
        planning_cache: SummaryCacheManager, result: Optional[dict[str, Any]]
    ) -> None:
        if not result:
            return

        node_id = result.get("id")
        if not node_id:
            return

        cache_data = {}
        if "summary" in result:
            cache_data["summary"] = result["summary"]
        if "code_analysis" in result:
            cache_data["code_analysis"] = result["code_analysis"]
        if "code_hash" in result:
            cache_data["code_hash"] = result["code_hash"]

        if cache_data:
            planning_cache.update_node_cache(node_id, cache_data)

        if result.get("status") == "regenerated":
            planning_cache.set_runtime_status(node_id, "regenerated")

    def _simulate_batch(
        self,
        items: list[dict[str, Any]],
        processor_fn: Callable[[dict[str, Any]], Optional[dict[str, Any]]],
        planning_cache: SummaryCacheManager,
        prepare_fn: Optional[Callable[[dict[str, Any]], dict[str, Any]]] = None,
    ) -> None:
        raw_results: list[Optional[dict[str, Any]]] = []
        for item in items:
            prepared = dict(item)
            if prepare_fn:
                prepared = prepare_fn(prepared)
            raw_results.append(processor_fn(prepared))

        for raw_result in raw_results:
            self._apply_simulated_result(planning_cache, raw_result)

    def _build_exact_progress_plan(self) -> _CounterPlan:
        planning_cache = SummaryCacheManager(str(self.project_path))
        planning_cache.cache = deepcopy(self.cache_manager.cache)
        planning_cache.runtime_status = deepcopy(self.cache_manager.runtime_status)

        planning_llm = _PlanningLlmClient()
        planning_processor = NodeSummaryProcessor(planning_llm, planning_cache)

        analyzer_items = self.neo4j_manager.execute_read_query(
            self.method_analyzer._get_items_query(),
            params={
                "analysisProperty": "code_analysis",
                "hashProperty": "code_hash",
                "minCyclomatic": self.min_cyclomatic,
                "cyclo1": "cyclomaticComplexity",
                "cyclo2": "cyclomatic_complexity",
                "cyclo3": "mcc",
            },
        )
        self._simulate_batch(
            analyzer_items,
            planning_processor.get_method_code_analysis,
            planning_cache,
            prepare_fn=self.method_analyzer._prepare_item,
        )

        method_items = self.neo4j_manager.execute_read_query(
            """
            MATCH (m:Method)
            WHERE m.entity_id IS NOT NULL
            OPTIONAL MATCH (caller:Method)-[:INVOKES]->(m)
            OPTIONAL MATCH (m)-[:INVOKES]->(callee:Method)
            RETURN m.entity_id AS id,
                   m.name AS name,
                   m.summary AS db_summary,
                   collect(DISTINCT caller.entity_id) AS callers,
                   collect(DISTINCT callee.entity_id) AS callees
            """
        )
        self._simulate_batch(
            method_items,
            planning_processor.get_method_summary,
            planning_cache,
        )

        types_by_level = self.type_summarizer._get_types_by_inheritance_level()
        for level in sorted(types_by_level.keys()):
            items_to_process = self.type_summarizer._get_context_for_ids(
                types_by_level[level]
            )
            self._simulate_batch(
                items_to_process,
                planning_processor.get_type_summary,
                planning_cache,
                prepare_fn=self.type_summarizer._prepare_item,
            )

        source_file_items = self.neo4j_manager.execute_read_query(
            """
            MATCH (sf:SourceFile)
            OPTIONAL MATCH (sf)<-[:WITH_SOURCE]-(t:Type)
            RETURN sf.entity_id AS id,
                   sf.absolute_path AS path,
                   sf.summary AS db_summary,
                   collect(DISTINCT t.entity_id) AS dependency_ids
            """
        )
        self._simulate_batch(
            source_file_items,
            lambda item: planning_processor.get_hierarchical_summary(
                item, "SourceFile"
            ),
            planning_cache,
        )

        directories_by_depth: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for item in self.directory_summarizer._get_directories_ordered_by_depth():
            directories_by_depth[item["depth"]].append(item)
        for depth in sorted(directories_by_depth.keys(), reverse=True):
            self._simulate_batch(
                directories_by_depth[depth],
                lambda item: planning_processor.get_hierarchical_summary(
                    item, "Directory"
                ),
                planning_cache,
            )

        package_items = self.neo4j_manager.execute_read_query(
            """
            MATCH (a:Artifact)-[:CONTAINS_CLASS*]->(p:Package)
            WHERE p.fqn IS NOT NULL AND p.summary IS NULL
            WITH p, size(split(p.fqn, '.')) AS depth
            OPTIONAL MATCH (p)-[:CONTAINS_CLASS]->(child)
            WHERE child:Package OR child:Type
            RETURN
                p.entity_id AS id,
                p.fqn AS fqn,
                p.summary AS db_summary,
                collect(DISTINCT child.entity_id) AS dependency_ids,
                depth
            ORDER BY depth DESC
            """
        )
        packages_by_depth: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for item in package_items:
            packages_by_depth[item["depth"]].append(item)
        for depth in sorted(packages_by_depth.keys(), reverse=True):
            self._simulate_batch(
                packages_by_depth[depth],
                lambda item: planning_processor.get_hierarchical_summary(
                    item, "Package"
                ),
                planning_cache,
            )

        artifact_items = self.neo4j_manager.execute_read_query(
            """
            MATCH (a:Artifact)
            WHERE a.summary IS NULL
            OPTIONAL MATCH (a)-[:CONTAINS_CLASS]->(child)
            WHERE child:Package OR child:Type
            RETURN
                a.entity_id AS id,
                a.fileName AS path,
                a.summary AS db_summary,
                collect(DISTINCT child.entity_id) AS dependency_ids
            """
        )
        self._simulate_batch(
            artifact_items,
            lambda item: planning_processor.get_hierarchical_summary(item, "Package"),
            planning_cache,
        )

        self._simulate_batch(
            self.project_summarizer._get_project_with_context(),
            planning_processor.get_project_summary,
            planning_cache,
        )

        return _CounterPlan(
            global_total=planning_llm.global_total,
            per_label_totals=dict(planning_llm.per_label_totals),
        )
