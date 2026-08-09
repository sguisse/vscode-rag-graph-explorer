import os
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import info, error, debug, execute_tracked_command, success, warn
from core.sources_discovery import discover_workspace_sources
from core.context import EnvironmentContext
from install.modules.java.jqassistant_graph_rag.context import JQAssistantGraphRagContext

@AnalyserRegistry.register_analyser
class JQAssistantGraphRagAnalyzer(BaseAnalyser):

    def __init__(self, context: EnvironmentContext):
        # 1.Call the parent class (BaseAnalyser) to store the global context
        super().__init__(context)
        # 2. Compose the specific jQAssistant Graph RAG context
        self.jqa_gr = JQAssistantGraphRagContext(context)

    @property
    def name(self) -> str: return "02-java_jqassistant_graph_rag_analyzer"


    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        """Main orchestrator for the jQAssistant Graph RAG analysis pipeline."""
        os.makedirs(self.jqa_gr.raw_outputs_dir, exist_ok=True)
        info("Starting jQAssistant Graph RAG analysis...", component=self.name)
