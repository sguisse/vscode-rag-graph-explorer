#!/bin/bash

# ==============================================================================
# 1. MISE À JOUR DE LA CONSOLIDATION BACKEND (scripts/core/graph_engine.py)
# Garantit l'envoi des métadonnées de style Vis.js conformes
# ==============================================================================
cat << 'EOF' > scripts/core/graph_engine.py
import os
import json
import networkx as nx
from typing import Dict, Any
from utils import info, success

class GraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()

    def load_raw_outputs(self, raw_outputs_dir: str):
        """ Parcourt tous les dossiers d'analyseurs et fusionne les données """
        info(f"Consolidation des données depuis {raw_outputs_dir}...", component="GraphEngine")

        for root, _, files in os.walk(raw_outputs_dir):
            for file in files:
                if file.endswith(".json"):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)

                        for ent in data.get("entities", []):
                            norm_id = ent["id"].replace("\\", "/").lower()
                            self.graph.add_node(norm_id, label=ent["label"], group=ent.get("group", "file"), source_file=norm_id)

                        for rel in data.get("relations", []):
                            src = rel["source"].replace("\\", "/").lower()
                            tgt = rel["target"].replace("\\", "/").lower()
                            self.graph.add_edge(src, tgt, relation=rel.get("type", "relation"))

                    except Exception:
                        pass
        info(f"Graphe consolidé : {self.graph.number_of_nodes()} nœuds, {self.graph.number_of_edges()} liaisons.", component="GraphEngine")

    def export_pure_visjs_format(self) -> Dict[str, Any]:
        nodes_payload = []
        for node_id, data in self.graph.nodes(data=True):
            node_properties = {
                "id": node_id,
                "label": data.get("label", node_id),
                "file_type": data.get("group", "file"),
                "source_file": data.get("source_file", "")
            }

            # Détection des points d'entrée morts (Nœuds sans référence entrante)
            if self.graph.in_degree(node_id) == 0:
                node_properties["borderWidth"] = 2
                node_properties["color"] = {
                    "border": "#000000"
                }
                # Double sécurité : indicateur textuel si l'IHM n'utilise pas le style d'objet
                node_properties["label"] = f"🎯 {data.get('label', node_id)}"

            nodes_payload.append(node_properties)

        edges_payload = []
        for source, target, data in self.graph.edges(data=True):
            edges_payload.append({"from": source, "to": target, "relation": data.get("relation", "relation")})

        return {"nodes": nodes_payload, "edges": edges_payload}

    def save_to_workspace(self, consolidated_dir: str):
        os.makedirs(consolidated_dir, exist_ok=True)
        vis_path = os.path.join(consolidated_dir, "graph-view.json")
        with open(vis_path, "w", encoding="utf-8") as f:
            json.dump(self.export_pure_visjs_format(), f, indent=2, ensure_ascii=False)

        graphify_path = os.path.join(consolidated_dir, "graphify-data.json")
        with open(graphify_path, "w", encoding="utf-8") as f:
            json.dump(nx.node_link_data(self.graph), f, indent=2, ensure_ascii=False)

        success(f"Artefacts consolidés générés dans {consolidated_dir}", component="GraphEngine")
EOF

# ==============================================================================
# 2. RAPPEL D'ALIGNEMENT JAVASCRIPT POUR TON IHM (A METTRE DANS TA WEBVIEW)
# ==============================================================================
# Pour que ton IHM accepte les propriétés, assure-bas que le récepteur ressemble à ça :
#
# window.addEventListener('message', event => {
#     const message = event.data;
#     if (message.command === 'updateGraphData') {
#         const rawNodes = message.payload.nodes;
#
#         // Utiliser le rest/spread operator pour ne perdre aucune propriété de style du backend !
#         const visNodes = rawNodes.map(node => ({
#             ...node,               // Spreads id, label, borderWidth, color, etc.
#             group: node.file_type  // Maintient la compatibilité avec ton système de groupe actuel
#         }));
#
#         const data = { nodes: new vis.DataSet(vis_points), edges: ... };
#         network.setData(data);
#     }
# });

# ==============================================================================
# 3. MISE À JOUR DU BUILD ET RE-PACKAGING
# ==============================================================================
sed -i.bak 's/"version": "[0-9]*\.[0-9]*\.[0-9]*"/"version": "1.4.1"/' package.json
rm -f package.json.bak

npm run package

echo "🚀 Clé de style consolidée et script mis à jour avec succès !"
