import os
import ast
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.neo4j_client import Neo4jClient
from core.utils import info, normalize_path

@AnalyserRegistry.register
class PythonAstWorker(BaseAnalyser):
    @property
    def name(self) -> str: return "python_ast_extractor"

    def run_analysis(self, manifest_data: dict, neo4j_client: Neo4jClient, config_matrix: dict) -> None:
        active_args = config_matrix.get("graphify", {}).get("arguments", "--deep-scan")
        py_files = [f for f in manifest_data.get("files", []) if f.endswith(".py")]

        info(f"[Graphify Worker Instance] Injecting AST mappings using external options: {active_args}", component=self.name)
        for file_path in py_files:
            norm_path = normalize_path(file_path)
            if not os.path.exists(norm_path): continue
            with open(norm_path, "r", encoding="utf-8", errors="replace") as f:
                try: root_node = ast.parse(f.read(), filename=norm_path)
                except SyntaxError: continue

            filename = os.path.basename(norm_path)
            neo4j_client.execute_write(
                "MERGE (f:File:Python {path: $path}) SET f.name = $name",
                {"path": norm_path, "name": filename}
            )
