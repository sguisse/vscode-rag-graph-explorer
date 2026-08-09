import logging
import os
from typing import Optional, Dict, Any
from base_summarizer import BaseSummarizer
from node_summary_processor import NodeSummaryProcessor
from neo4j_manager import Neo4jManager

logger = logging.getLogger(__name__)


class MethodAnalyzer(BaseSummarizer):
    """
    Analyzes code snippets for Method nodes by delegating to the NodeSummaryProcessor.
    """

    def __init__(
        self, neo4j_manager: Neo4jManager, node_summary_processor: NodeSummaryProcessor
    ):
        # min_cyclomatic controls the minimum McCabe complexity required for a
        # method to be considered for analysis. A value <= 0 disables the
        # filter (all methods are candidates).
        min_cyclomatic = int(os.environ.get("JQA_METHOD_MIN_CYCLOMATIC", "0"))
        # Allow callers to override by passing attribute after construction if
        # desired; BaseSummarizer ctor sets up common behaviour.
        super().__init__(neo4j_manager, node_summary_processor)
        self.min_cyclomatic = min_cyclomatic

    def run(self) -> int:
        logger.info(f"--- Starting Pass: {self.__class__.__name__} ---")
        items_to_process = self.neo4j_manager.execute_read_query(
            self._get_items_query(),
            params={
                "analysisProperty": "code_analysis",
                "hashProperty": "code_hash",
                "minCyclomatic": self.min_cyclomatic,
                # Use dynamic property keys to avoid DB unknown-property warnings
                "cyclo1": "cyclomaticComplexity",
                "cyclo2": "cyclomatic_complexity",
                "cyclo3": "mcc",
            },
        )

        # If a positive cyclomatic threshold is configured, log how many
        # otherwise-eligible methods were excluded by that filter. We count
        # only methods that would normally be eligible for analysis (have
        # source line info and no existing code_analysis) to avoid counting
        # already-analysed methods.
        try:
            excluded_count = 0
            if getattr(self, "min_cyclomatic", 0) and int(self.min_cyclomatic) > 0:
                total_res = self.neo4j_manager.execute_read_query(
                    """
                    MATCH (m:Method)-[:WITH_SOURCE]->(:SourceFile)
                    WHERE m.entity_id IS NOT NULL
                      AND m.firstLineNumber IS NOT NULL
                      AND m.lastLineNumber IS NOT NULL
                      AND m.code_analysis IS NULL
                    RETURN count(m) AS n
                    """
                )
                total = int(total_res[0]["n"]) if total_res else 0

                included_res = self.neo4j_manager.execute_read_query(
                    """
                    MATCH (m:Method)-[:WITH_SOURCE]->(:SourceFile)
                    WHERE m.entity_id IS NOT NULL
                      AND m.firstLineNumber IS NOT NULL
                      AND m.lastLineNumber IS NOT NULL
                      AND m.code_analysis IS NULL
                      AND coalesce(m[$cyclo1], m[$cyclo2], m[$cyclo3], 0) > $minCyclomatic
                    RETURN count(m) AS n
                    """,
                    params={
                        "minCyclomatic": self.min_cyclomatic,
                        "cyclo1": "cyclomaticComplexity",
                        "cyclo2": "cyclomatic_complexity",
                        "cyclo3": "mcc",
                    },
                )
                included = int(included_res[0]["n"]) if included_res else 0
                excluded_count = max(0, total - included)
                logger.info(
                    f"🧊  {excluded_count} methods excluded by cyclomatic threshold (<= {self.min_cyclomatic}) on total of {total} existing methods."
                )
        except Exception:
            logger.debug("Failed to compute excluded method count", exc_info=True)

        if not items_to_process:
            logger.warning(
                f"No items found for {self.__class__.__name__}. Skipping pass."
            )
            return 0

        updated_count = self.process_batch(items_to_process)
        logger.info(
            f"--- Pass {self.__class__.__name__} complete. Updated {updated_count} properties. ---"
        )
        return updated_count

    def _get_items_query(self) -> str:
                # The query includes an optional cyclomatic complexity filter. The
                # parameter $minCyclomatic can be 0 or NULL to disable the filter.
                return """
                MATCH (m:Method)-[:WITH_SOURCE]->(sf:SourceFile)
                 WHERE m.entity_id IS NOT NULL
                     AND m.firstLineNumber IS NOT NULL
                     AND m.lastLineNumber IS NOT NULL
                     AND (
                                $minCyclomatic IS NULL OR $minCyclomatic <= 0 OR
                                coalesce(m[$cyclo1], m[$cyclo2], m[$cyclo3], 0) > $minCyclomatic
                     )
                RETURN m.entity_id AS id,
                             sf.absolute_path AS sourceFilePath,
                             m.signature AS signature,
                             m.firstLineNumber AS firstLine,
                             m.lastLineNumber AS lastLine,
                         m[$analysisProperty] AS db_analysis,
                         m[$hashProperty] AS db_hash
                """

    def _get_update_query(self) -> str:
        return """
        UNWIND $updates AS item
        MATCH (m:Method {entity_id: item.id})
        SET m.code_analysis = item.code_analysis, m.code_hash = item.code_hash
        """

    def _prepare_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Hook to extract the method's source code before processing.
        """
        item["source_code"] = self._extract_method_code_snippet(
            item["sourceFilePath"],
            item["signature"],
            item["firstLine"],
            item["lastLine"],
        )
        return item

    def _get_processor_result(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Calls the appropriate method on the NodeSummaryProcessor.
        """
        return self.node_summary_processor.get_method_code_analysis(item)

    def _extract_method_code_snippet(
        self, file_path: str, signature: str, first_line: int, last_line: int
    ) -> Optional[str]:
        """
        Reads a source file and extracts the code snippet for a method.
        """
        try:
            if not os.path.isabs(file_path) or not os.path.exists(file_path):
                logger.error(
                    f"Source file not found or path is not absolute: {file_path}"
                )
                return None

            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            start_index = first_line - 1
            end_index = last_line

            if not (0 <= start_index < end_index <= len(lines)):
                logger.warning(
                    f"Invalid line numbers for method {signature} in {file_path}: {first_line}-{last_line}. File has {len(lines)} lines."
                )
                return "".join(lines)

            return "".join(lines[start_index:end_index])
        except Exception as e:
            logger.error(
                f"Error extracting code snippet for method {signature} from {file_path}: {e}"
            )
            return None
