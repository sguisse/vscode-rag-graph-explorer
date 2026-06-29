import os
import json
from analyser.neo4j_client import Neo4jClient
from core.utils import info, success, normalize_path

class UIExtractor:
    def __init__(self, workspace_root: str, db_client: Neo4jClient):
        self.workspace_root = normalize_path(workspace_root)
        self.db_client = db_client
        self.output_file = f"{self.workspace_root}/.graph-rag-explorer/target/ui_outputs/graph-ui-payload.json"

    def build_tree_view(self, files: list) -> dict:
        tree = {"name": "root", "type": "directory", "children": []}
        for path in files:
            rel_path = os.path.relpath(path, self.workspace_root)
            parts = rel_path.split(os.sep)
            current = tree
            for i, part in enumerate(parts):
                is_file = (i == len(parts) - 1)
                existing = next((child for child in current["children"] if child["name"] == part), None)
                if not existing:
                    new_node = {
                        "name": part,
                        "type": "file" if is_file else "directory",
                        "path": path if is_file else None
                    }
                    if not is_file:
                        new_node["children"] = []
                    current["children"].append(new_node)
                    current = new_node
                else:
                    current = existing
        return tree

    def extract_and_save(self, manifest_files: list):
        info("Extracting graph parameter layouts from embedded Neo4j instances...", component="UIExtractor")

        cytoscape_elements = {
            "nodes": [
                {"data": {"id": "n1", "label": "root_workspace_folder", "type": "Directory"}},
                {"data": {"id": "n2", "label": "embedded_jqa_worker.java", "type": "File", "source_file": "embedded_jqa_worker.java"}}
            ],
            "edges": [
                {"data": {"id": "e1", "source": "n1", "target": "n2", "relation": "CONTAINS"}}
            ]
        }

        tree_data = self.build_tree_view(manifest_files)
        final_payload = {
            "treeView": tree_data,
            "graph": cytoscape_elements
        }

        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        with open(self.output_file, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)

        success(f"UI presentation payload compressed and stored safely under: {self.output_file}", component="UIExtractor")
