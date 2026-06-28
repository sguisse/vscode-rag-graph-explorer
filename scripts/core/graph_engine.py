import os
import json
import networkx as nx
from typing import Dict, Any

class GraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()

    def load_raw_outputs(self, raw_outputs_dir: str):
        """ Scans and merges isolated parser outputs into the topological network """
        if not os.path.exists(raw_outputs_dir):
            return

        for root, _, files in os.walk(raw_outputs_dir):
            for file in files:
                if file.endswith(".json"):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)

                        for ent in data.get("entities", []):
                            # CORRECTIF : On remplace les anti-slashs mais on PRÉSERVE la casse d'origine (pas de .lower())
                            norm_id = ent["id"].replace("\\", "/")
                            self.graph.add_node(norm_id, label=ent["label"], group=ent.get("group", "file"), source_file=norm_id)

                        for rel in data.get("relations", []):
                            # CORRECTIF : Préservation de la casse d'origine sur les liaisons également
                            src = rel["source"].replace("\\", "/")
                            tgt = rel["target"].replace("\\", "/")
                            self.graph.add_edge(src, tgt, relation=rel.get("type", "relation"))

                    except Exception:
                        pass

    def export_pure_visjs_format(self) -> Dict[str, Any]:
        nodes_payload = []
        for node_id, data in self.graph.nodes(data=True):
            current_group = data.get("group", "file")

            # Détection des fichiers orphelins / non référencés
            if self.graph.in_degree(node_id) == 0 and current_group == "file":
                current_group = "file_unreferenced"

            nodes_payload.append({
                "id": node_id,
                "label": data.get("label", node_id),
                "group": current_group,        # Ajout par sécurité pour le TreeView/UI
                "file_type": current_group,    # Rétrocompatibilité avec le style Cytoscape
                "source_file": data.get("source_file", "")
            })

        edges_payload = []
        for source, target, data in self.graph.edges(data=True):
            edges_payload.append({
                "from": source,
                "to": target,
                "source": source,              # Redondance sécuritaire pour les liaisons
                "target": target,
                "relation": data.get("relation", "relation")
            })

        return {"nodes": nodes_payload, "edges": edges_payload}

    def save_to_workspace(self, consolidated_dir: str):
        os.makedirs(consolidated_dir, exist_ok=True)
        vis_path = os.path.join(consolidated_dir, "graph-view.json")
        with open(vis_path, "w", encoding="utf-8") as f:
            json.dump(self.export_pure_visjs_format(), f, indent=2, ensure_ascii=False)

        graph_data_path = os.path.join(consolidated_dir, "graph-data.json")
        with open(graph_data_path, "w", encoding="utf-8") as f:
            json.dump(nx.node_link_data(self.graph), f, indent=2, ensure_ascii=False)
