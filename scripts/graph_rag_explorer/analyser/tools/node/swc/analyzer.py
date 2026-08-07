from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient

@AnalyserRegistry.register_analyser
class NodeSwcAstAnalyzer(BaseAnalyser):
    @property
    def name(self) -> str: return "node_swc_ast_analyzer"

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        pass
