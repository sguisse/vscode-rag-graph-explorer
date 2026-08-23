import logging
from pathlib import Path
from neo4j_manager import Neo4jManager
from graph_basic_normalizer import GraphBasicNormalizer
from source_file_linker import SourceFileLinker
from graph_tree_builder import GraphTreeBuilder
from graph_entity_setter import GraphEntitySetter
from artifact_data_normalizer import ArtifactDataNormalizer
from jacoco_manager import JacocoManager
from jacoco_importer import import_jacoco

logger = logging.getLogger(__name__)


class GraphOrchestrator:
    """
    Manages and executes the sequence of graph normalization and enrichment passes.
    """

    def __init__(self, neo4j_manager: Neo4jManager, repo_root: str = ""):
        self.neo4j_manager = neo4j_manager
        self.project_path = Path(repo_root).resolve() if repo_root else Path.cwd().resolve()
        self.repo_root = repo_root or ""
        logger.info(f"Initialized GraphOrchestrator with initial project_path: {self.project_path}")

    def run_enrichment_passes(self):
        """
        Executes the full sequence of graph enrichment passes with safe execution boundaries.
        """
        logger.info("--- Starting All Graph Enrichment and Normalization Passes ---")

        type_check = self.neo4j_manager.execute_read_query("MATCH (t:Java:Type) RETURN count(t) AS n LIMIT 1")
        type_count = type_check[0]["n"] if type_check else 0
        if type_count == 0:
            logger.warning(
                "PRE-FLIGHT CHECK WARNING: No Java type nodes (:Java:Type) found in the graph. "
                "Checking for raw :Type nodes..."
            )
            raw_check = self.neo4j_manager.execute_read_query("MATCH (t:Type) RETURN count(t) AS n LIMIT 1")
            raw_count = raw_check[0]["n"] if raw_check else 0
            logger.info(f"Raw :Type count: {raw_count}")

        basic_normalizer = GraphBasicNormalizer(self.neo4j_manager)
        source_linker = SourceFileLinker(self.neo4j_manager)
        tree_builder = GraphTreeBuilder(self.neo4j_manager)
        artifact_normalizer = ArtifactDataNormalizer(self.neo4j_manager)
        entity_setter = GraphEntitySetter(self.neo4j_manager)

        def safe_pass(pass_name, fn):
            logger.info(f"▶ [Phase] Executing {pass_name}...")
            try:
                fn()
                logger.info(f"✅ [Phase] Completed {pass_name}.")
            except Exception as e:
                logger.error(f"❌ [Phase] Error in {pass_name}: {e}", exc_info=True)

        safe_pass("Phase 1a: Add Absolute Paths", basic_normalizer.add_absolute_paths)
        safe_pass("Phase 1b: Label Source Files", basic_normalizer.label_source_files)

        safe_pass("Phase 2a: Link Types to Source Files", source_linker.link_types_to_source_files)
        safe_pass("Phase 2b: Link Members to Source Files", source_linker.link_members_to_source_files)
        safe_pass("Phase 2c: Link Source File Dependencies", source_linker.link_source_file_dependencies)

        logger.info("▶ [Phase 3a] Creating Project Node...")
        try:
            detected_path = tree_builder.create_project_node(repo_root=self.repo_root)
            if detected_path:
                self.project_path = Path(detected_path).resolve()
            logger.info(f"✅ [Phase 3a] Project Node created. Path: {self.project_path}")
        except Exception as e:
            logger.error(f"❌ [Phase 3a] Error creating project node: {e}", exc_info=True)

        safe_pass("Phase 3b: Build Maven Project Structure", tree_builder.build_maven_project_structure)
        safe_pass("Phase 3c: Establish Source Hierarchy", tree_builder.establish_source_hierarchy)

        safe_pass("Phase 4a: Merge Duplicate Types", artifact_normalizer.merge_duplicate_types)
        safe_pass("Phase 4b: Relocate Directory Artifacts", artifact_normalizer.relocate_directory_artifacts)
        safe_pass("Phase 4c: Rewrite Containment Relationships", artifact_normalizer.rewrite_containment_relationships)
        safe_pass("Phase 4d: Rewrite Requirement Relationships", artifact_normalizer.rewrite_requirement_relationships)
        safe_pass("Phase 4e: Establish Class Hierarchy", artifact_normalizer.establish_class_hierarchy)
        safe_pass("Phase 4f: Cleanup Package Semantics", artifact_normalizer.cleanup_package_semantics)
        safe_pass("Phase 4g: Link Project to Artifacts", artifact_normalizer.link_project_to_artifacts)

        safe_pass("Phase 5: Create Entities and Stable IDs", entity_setter.create_entities_and_stable_ids)

        logger.info("--- All Graph Enrichment and Normalization Passes Finished ---")
