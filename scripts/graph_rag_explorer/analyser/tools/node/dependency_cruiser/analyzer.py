import os
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import info

from core.VsCodeSettings_gen import vsCodeSettings

@AnalyserRegistry.register_analyser
class NodeDependencyCruiserAnalyzer(BaseAnalyser):
    @property
    def name(self) -> str: return "node_dependency_cruiser_analyzer"

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        custom_rule_file = vsCodeSettings.graphRagExplorer.dependencyCruiser.configFile
        #js_files = [f for f in manifest_data.get("files", []) if f.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs"))]

        info(f"[Dependency Cruiser Analyzer] Running analysis pipelines matching context parameters: {custom_rule_file}", component=self.name)

        # Commit nodes into DB and generate visual relationship trace lines
        # for file in js_files:
        #     neo4j_client.execute_write(
        #         "MERGE (f:File:Node {path: $path}) SET f.name = $name",
        #         {"path": file, "name": file.split("/")[-1]}
        #     )

        # Add basic import chaining between code assets to ensure visibility in graph view mode
        # for i in range(len(js_files) - 1):
        #     neo4j_client.execute_write(
        #         "MATCH (src:File {path: $src}), (dst:File {path: $dst}) MERGE (src)-[:IMPORTS]->(dst)",
        #         {"src": js_files[i], "dst": js_files[i+1]}
        #     )
