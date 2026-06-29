import os
import re
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.neo4j_client import Neo4jClient
from core.utils import info, normalize_path

@AnalyserRegistry.register
class DocumentationLinkerWorker(BaseAnalyser):
    @property
    def name(self) -> str: return "documentation_cross_linker"

    def run_analysis(self, manifest_data: dict, neo4j_client: Neo4jClient, config_matrix: dict) -> None:
        md_files = [f for f in manifest_data.get("files", []) if f.endswith(".md")]
        info(f"Cross-referencing documentation tokens across {len(md_files)} markdown notes.", component=self.name)

        for file_path in md_files:
            norm_path = normalize_path(file_path)
            if not os.path.exists(norm_path): continue
            with open(norm_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            filename = os.path.basename(norm_path)
            neo4j_client.execute_write(
                "MERGE (d:Document {path: $path}) SET d.name = $name, d.type = 'markdown'",
                {"path": norm_path, "name": filename}
            )

            matches = re.findall(r'`([a-zA-Z0-9_\-\/]+\.(?:ts|js|java|py))`', content)
            for matched_file in set(matches):
                neo4j_client.execute_write(
                    "MATCH (d:Document {path: $doc_path}) "
                    "MATCH (f:File) WHERE f.name = $target_name "
                    "MERGE (d)-[:REFERENCES]->(f)",
                    {"doc_path": norm_path, "target_name": matched_file}
                )
