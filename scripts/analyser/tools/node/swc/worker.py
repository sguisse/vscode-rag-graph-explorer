from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.neo4j_client import Neo4jClient

@AnalyserRegistry.register
class NodeSwcAstWorker(BaseAnalyser):
    @property
    def name(self) -> str: return "node_swc_ast_worker"

    def run_analysis(self, manifest_data: dict, neo4j_client: Neo4jClient, config_matrix: dict) -> None:
        pass
