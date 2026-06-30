import os
import json
from analyser.neo4j_client import Neo4jClient
from core.utils import info, success, error, normalize_path

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
        info("Extracting live graph topology and relationships from active Neo4j instance...", component="UIExtractor")

        nodes_payload = []
        edges_payload = []
        resolved_nodes = {}

        if hasattr(self.db_client, 'driver') and self.db_client._connected:
            try:
                with self.db_client.driver.session() as session:
                    # Access unindexed keys using dynamic map brackets properties(n)['key'] to bypass database static schema warnings completely
                    nodes_query = """
                    MATCH (n)
                    RETURN elementId(n) as el_id, labels(n) as labels, n.name as name,
                           properties(n)['path'] as path, properties(n)['source_file'] as source_file
                    """
                    nodes_results = session.run(nodes_query)
                    for record in nodes_results:
                        el_id = record["el_id"]
                        labels = record["labels"] or []
                        path_val = record["path"]
                        name_val = record["name"]
                        src_file = record["source_file"]

                        if "Document" in labels:
                            group_type = "document"
                            label_name = name_val or (path_val.split("/")[-1] if path_val else "Document")
                        elif "Class" in labels or "Type" in labels:
                            group_type = "class"
                            label_name = name_val or "Class"
                        elif "Method" in labels:
                            group_type = "method"
                            label_name = name_val or "Method"
                            if not label_name.endswith("()"):
                                label_name += "()"
                        else:
                            group_type = "file"
                            label_name = name_val or (path_val.split("/")[-1] if path_val else f"Node_{el_id}")

                        node_id = path_val if (path_val and group_type in ["file", "document"]) else el_id

                        resolved_nodes[el_id] = {
                            "id": node_id,
                            "label": label_name,
                            "file_type": group_type,
                            "source_file": src_file or path_val or ""
                        }

                    for n_entry in resolved_nodes.values():
                        nodes_payload.append({
                            "data": {
                                "id": n_entry["id"],
                                "label": n_entry["label"],
                                "type": n_entry["file_type"].capitalize(),
                                "source_file": n_entry["source_file"]
                            }
                        })

                    relationships_query = """
                    MATCH (s)-[r]->(t)
                    RETURN elementId(s) as source_el_id, type(r) as relation_type, elementId(t) as target_el_id
                    """
                    rel_results = session.run(relationships_query)
                    for record in rel_results:
                        s_el = record["source_el_id"]
                        t_el = record["target_el_id"]

                        if s_el in resolved_nodes and t_el in resolved_nodes:
                            s_node = resolved_nodes[s_el]
                            t_node = resolved_nodes[t_el]

                            edges_payload.append({
                                "data": {
                                    "id": f"edge_{s_el}_{t_el}",
                                    "source": s_node["id"],
                                    "target": t_node["id"],
                                    "relation": record["relation_type"]
                                }
                            })
            except Exception as ex:
                error(f"Failed extracting live payload elements from Neo4j: {ex}", component="UIExtractor")

        if not nodes_payload:
            for file in manifest_files:
                nodes_payload.append({
                    "data": {
                        "id": file,
                        "label": os.path.basename(file),
                        "type": "File",
                        "source_file": file
                    }
                })

        cytoscape_elements = {
            "nodes": nodes_payload,
            "edges": edges_payload
        }

        tree_data = self.build_tree_view(manifest_files)
        final_payload = {
            "treeView": tree_data,
            "graph": cytoscape_elements
        }

        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        with open(self.output_file, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)

        success(f"UI presentation payload generated with {len(nodes_payload)} nodes and {len(edges_payload)} edges, stored under: {self.output_file}", component="UIExtractor")
