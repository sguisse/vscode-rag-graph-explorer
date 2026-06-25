import os
import json
import networkx as nx
from typing import Dict, Any
from utils import debug, info, warn, error, success

class GraphEngine:
    def __init__(self):
        info("Initialisation de la structure topologique NetworkX.", component="GraphEngine")
        self.graph = nx.DiGraph()

    def add_entity(self, entity_id: str, label: str, group: str, source_file: str, source_location: str = "L1"):
        debug(f"Insertion Nœud -> ID: [{entity_id}] | Label: '{label}' | Groupe: '{group}'", component="GraphEngine")
        self.graph.add_node(
            entity_id, label=label, group=group, source_file=source_file, source_location=source_location
        )

    def add_relation(self, source_id: str, target_id: str, relation_type: str):
        debug(f"Insertion Lien -> [{source_id}] --({relation_type})--> [{target_id}]", component="GraphEngine")
        self.graph.add_edge(source_id, target_id, relation=relation_type)

    def export_to_ui_format(self) -> Dict[str, Any]:
        info("Extraction structurelle vers le format d'échange JSON UI.", component="GraphEngine")
        nodes_payload = []
        for node_id, data in self.graph.nodes(data=True):
            nodes_payload.append({
                "id": node_id, "label": data.get("label", node_id), "file_type": data.get("group", "class"),
                "source_file": data.get("source_file", ""), "source_location": data.get("source_location", "L1")
            })
        links_payload = []
        for source, target, data in self.graph.edges(data=True):
            links_payload.append({"source": source, "target": target, "relation": data.get("relation", "relation")})
        return {"nodes": nodes_payload, "links": links_payload}

    def save_to_workspace(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        target_path = os.path.join(output_dir, "graph.json")
        payload = self.export_to_ui_format()
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        success(f"Fichier graph.json persisthé avec succès ({len(payload['nodes'])} nœuds).", component="GraphEngine")
