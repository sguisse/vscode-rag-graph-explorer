
from abc import abstractmethod

from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.context import EnvironmentContext

class BaseAnalyser:

    def __init__(self, context: EnvironmentContext):
        self.context = context

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        pass
