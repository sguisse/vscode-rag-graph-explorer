from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.neo4j_client import Neo4jClient
from core.utils import info

@AnalyserRegistry.register
class NodeDependencyCruiserWorker(BaseAnalyser):
    @property
    def name(self) -> str: return "node_dependency_cruiser_worker"

    def run_analysis(self, manifest_data: dict, neo4j_client: Neo4jClient, config_matrix: dict) -> None:
        custom_rule_file = config_matrix.get("dependencyCruiser", {}).get("configFile", ".dependency-cruiser.json")
        ts_files = [f for f in manifest_data.get("files", []) if f.endswith((".ts", ".tsx", ".js"))]
        info(f"[Dependency Cruiser Worker] Running analysis pipelines matching context parameters: {custom_rule_file}", component=self.name)
