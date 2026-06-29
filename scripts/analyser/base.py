from analyser.neo4j_client import Neo4jClient

class BaseAnalyser:
    @property
    def name(self) -> str:
        pass

    def run_analysis(self, manifest_data: dict, neo4j_client: Neo4jClient, config_matrix: dict) -> None:
        pass
