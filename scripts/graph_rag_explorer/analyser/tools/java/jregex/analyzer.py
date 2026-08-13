import os
import re
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import debug, info, error
from install.modules.java.jqassistant.context import JQAssistantContext
from graph_rag_explorer.core.sources_discovery import discover_workspace_sources

# TODO: Consider refactoring this into a more modular design, potentially splitting the regex analysis into separate classes for maintainability.
# TODO:    Do the same thing for typescript, javascript, ... analyzers in the future.
@AnalyserRegistry.register_analyser
class JavaRegexAnalyzer(BaseAnalyser):

    def __init__(self, context):
        super().__init__(context)
        self.jqa = JQAssistantContext(context)

        # Pre-compiling regular expressions for optimal performance
        self.lombok_regexes = {
            "Data": re.compile(r'@Data\b'),
            "Builder": re.compile(r'@Builder\b'),
            "NoArgsConstructor": re.compile(r'@NoArgsConstructor\b'),
            "Slf4j": re.compile(r'@Slf4j\b')
        }

        # Regex for capturing TODO or FIXME comments
        self.todo_regex = re.compile(r'(?://|/\*|\*)\s*(TODO|FIXME)\b', re.IGNORECASE)

    @property
    def name(self) -> str:
        return "03-java_regex_analyzer"

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        discovered = discover_workspace_sources(
            workspace_root=self.jqa.workspace_root,
            exclude_paths_regex=self.jqa.exclude_paths_regex
        )
        java_src_paths = list(discovered.get("java_src", []))

        if not java_src_paths:
            info("No Java source paths found in jQAssistant config. Skipping.", component=self.name)
            return

        info(f"Starting Regex analysis (Lombok, Comments...) on {len(java_src_paths)} directories...", component=self.name)

        # Single pass through files on disk
        for src_dir in java_src_paths:
            if not os.path.exists(src_dir):
                continue

            for root, _, files in os.walk(src_dir):
                for file in files:
                    if file.endswith(".java"):
                        filepath = os.path.join(root, file)
                        class_name = file[:-5] # Remove the ".java" extension

                        try:
                            # Read the file content into memory once
                            with open(filepath, "r", encoding="utf-8") as f:
                                content = f.read()

                            # Dispatch the content to the analysis sub-modules
                            self._analyzeLombok(neo4j_client, class_name, content)
                            self._analyzeComment(neo4j_client, class_name, content)

                        except Exception as e:
                            error(f"Failed to parse Regex on {filepath}: {e}", component=self.name)

        info("Textual analysis via Regex completed successfully.", component=self.name)


    def _analyzeLombok(self, neo4j_client: Neo4jClient, class_name: str, content: str) -> None:
        """Detects and injects Lombok structural relationships into the graph."""
        lombok_fqns = {
            "Data": "lombok.Data",
            "Builder": "lombok.Builder",
            "NoArgsConstructor": "lombok.NoArgsConstructor",
            "Slf4j": "lombok.extern.slf4j.Slf4j"
        }

        cypher_query = """
        MATCH (c:Class {name: $className})
        MERGE (t:Type {fqn: $fqn})
        ON CREATE SET t.name = $annotationName, t:Annotation
        MERGE (c)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t)
        """

        for ann_name, regex in self.lombok_regexes.items():
            if regex.search(content):
                debug(f"Detected Lombok annotation @{ann_name} in class {class_name}", component=self.name)
                neo4j_client.execute_write(
                    cypher_query,
                    {
                        "className": class_name,
                        "fqn": lombok_fqns[ann_name],
                        "annotationName": ann_name
                    }
                )

    def _analyzeComment(self, neo4j_client: Neo4jClient, class_name: str, content: str) -> None:
        """Example of comment analysis: TODO/FIXME detection."""
        if self.todo_regex.search(content):
            debug(f"Detected TODO/FIXME in class {class_name}", component=self.name)
            cypher_query = """
            MATCH (c:Class {name: $className})
            SET c:HasTodoSmell
            """
            neo4j_client.execute_write(cypher_query, {"className": class_name})
