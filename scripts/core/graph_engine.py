import os
import json
import networkx as nx
from typing import Dict, Any
from utils import debug, info, warn, error, success

class GraphEngine:
    def __init__(self):
        info("Initialisation de la structure topologique NetworkX.", component="GraphEngine")
        self.graph = nx.DiGraph()

    def normalize_id(self, entity_id: str) -> str:
        """
        Enforces Strict Normalization across all nodes: UNIX slashes and lowercasing
        to ensure perfect matching regardless of the OS case-sensitivity setup.
        """
        parts = entity_id.replace("\\", "/").split("::")
        parts[0] = parts[0].lower() # Normalize the file path component
        return "::".join(parts)

    def add_entity(self, entity_id: str, label: str, group: str, source_file: str, source_location: str = "L1"):
        norm_id = self.normalize_id(entity_id)
        norm_src = source_file.replace("\\", "/").lower()
        debug(f"Insertion Nœud Normalisé -> ID: [{norm_id}] | Groupe: '{group}'", component="GraphEngine")
        self.graph.add_node(
            norm_id, label=label, group=group, source_file=norm_src, source_location=source_location
        )

    def add_relation(self, source_id: str, target_id: str, relation_type: str):
        norm_src = self.normalize_id(source_id)
        norm_tgt = self.normalize_id(target_id)
        debug(f"Insertion Lien Normalisé -> [{norm_src}] --({relation_type})--> [{norm_tgt}]", component="GraphEngine")
        self.graph.add_edge(norm_src, norm_tgt, relation=relation_type)

    def export_pure_visjs_format(self) -> Dict[str, Any]:
        """
        Option A: Reconciled format compiled strictly for Vis.js interaction parity.
        Eliminates frontend processing loops entirely!
        """
        nodes_payload = []
        for node_id, data in self.graph.nodes(data=True):
            nodes_payload.append({
                "id": node_id,
                "label": data.get("label", node_id),
                "file_type": data.get("group", "class"),
                "source_file": data.get("source_file", ""),
                "source_location": data.get("source_location", "L1")
            })

        edges_payload = []
        for source, target, data in self.graph.edges(data=True):
            # Vis.js strictly expects 'from' and 'to' keys
            edges_payload.append({
                "from": source,
                "to": target,
                "relation": data.get("relation", "relation")
            })
        return {"nodes": nodes_payload, "edges": edges_payload}

    def export_jqassistant_format(self) -> Dict[str, Any]:
        """
        Structured property graph format mapping closely to Neo4j/jQAssistant models.
        """
        jq_nodes = []
        for node_id, data in self.graph.nodes(data=True):
            jq_nodes.append({
                "elementId": node_id,
                "labels": [data.get("group", "Unknown").upper()],
                "properties": {
                    "name": data.get("label", ""),
                    "path": data.get("source_file", ""),
                    "location": data.get("source_location", "L1")
                }
            })
        jq_relationships = []
        for u, v, data in self.graph.edges(data=True):
            jq_relationships.append({
                "startNodeId": u,
                "endNodeId": v,
                "type": data.get("relation", "DEPENDS_ON").upper()
            })
        return {"jqAssistantNodes": jq_nodes, "jqAssistantRelationships": jq_relationships}

    def save_to_workspace(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)

        # 1. Target Vis.json direct payload delivery
        vis_path = os.path.join(output_dir, "graph-view.json")
        with open(vis_path, "w", encoding="utf-8") as f:
            json.dump(self.export_pure_visjs_format(), f, indent=2, ensure_ascii=False)

        # 2. Target Graphify NetworkX native data dump (Fixed variable syntax name)
        graphify_path = os.path.join(output_dir, "graphify-data.json")
        with open(graphify_path, "w", encoding="utf-8") as f:
            json.dump(nx.node_link_data(self.graph), f, indent=2, ensure_ascii=False)

        # 3. Target jQAssistant mock property graph payload
        jq_path = os.path.join(output_dir, "jqassistant-data.json")
        with open(jq_path, "w", encoding="utf-8") as f:
            json.dump(self.export_jqassistant_format(), f, indent=2, ensure_ascii=False)

        success(f"Indexation multi-format achevée. Fichiers générés dans {output_dir}", component="GraphEngine")
