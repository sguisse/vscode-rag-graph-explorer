import os
import re
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import info, normalize_path

@AnalyserRegistry.register_analyser
class MarkdownLinkerAnalyzer(BaseAnalyser):
    @property
    def name(self) -> str: return "markdown_cross_link_analyzer"

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        info(f"Cross-referencing documentation across markdown files.", component=self.name)
