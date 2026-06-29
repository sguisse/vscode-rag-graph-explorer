import argparse
import json
import os
import sys
import networkx as nx
from utils import debug, info, warn, error, success, configure_logger

class GitDeltaAnalyzer:
    def __init__(self, workspace_root: str, graph_cache_dir: str):
        self.workspace_root = os.path.abspath(workspace_root)
        self.graph_cache_dir = os.path.abspath(graph_cache_dir)
        self.graph_json_path = os.path.join(self.graph_cache_dir, "graph-view.json")
        info(f"Initialisation de l'analyseur incrémental sur : {self.workspace_root}", component="GitDelta")

    def calculate_blast_radius(self, target_file: str):
        norm_target = target_file.replace("\\", "/").lower()
        info(f"Analyse chirurgicale de Blast Radius pour : {norm_target}", component="GitDelta")

        if not os.path.exists(self.graph_json_path):
            error("Cache global graph-view.json introuvable. Effectuez un Deep Scan au préalable.", component="GitDelta")
            return

        with open(self.graph_json_path, "r", encoding="utf-8") as f:
            graph_data = json.load(f)

        G = nx.DiGraph()
        node_file_map = {}
        for node in graph_data.get("nodes", []):
            nid = node["id"]
            G.add_node(nid, **node)
            node_file_map[nid] = node.get("source_file", "").replace("\\", "/").lower()

        for edge in graph_data.get("edges", []):
            G.add_edge(edge["from"], edge["to"], relation=edge.get("relation", "relation"))

        impacted_seeds = []
        for nid, src_file in node_file_map.items():
            if norm_target in src_file or src_file in norm_target:
                impacted_seeds.append(nid)
                debug(f"Nœud graine localisé : [{nid}]", component="GitDelta")

        upstream_impacts = set()
        for seed in impacted_seeds:
            if G.has_node(seed):
                upstream_impacts.add(seed)
                ancestors = nx.ancestors(G, seed)
                upstream_impacts.update(ancestors)

        impacted_files, impacted_methods = set(), []
        for node_id in upstream_impacts:
            node_data = G.nodes[node_id]
            src_file = node_data.get("source_file", "")
            if src_file: impacted_files.add(src_file)
            if node_data.get("file_type") == "method":
                impacted_methods.append(f"{src_file} -> {node_data.get('label')}")

        report_payload = {
            "target_file": target_file, "impacted_nodes_count": len(upstream_impacts),
            "impacted_files": list(impacted_files), "impacted_methods": impacted_methods
        }

        json_out = os.path.join(self.graph_cache_dir, "blast_radius.json")
        md_out = os.path.join(self.graph_cache_dir, "blast_radius.md")

        with open(json_out, "w", encoding="utf-8") as f: json.dump(report_payload, f, indent=2, ensure_ascii=False)
        with open(md_out, "w", encoding="utf-8") as f:
            f.write("# GRAPH RAG EXPLORER - COGNITIVE IMPACT REPORT\n\n")
            f.write(f"### Cible modifiée : `{target_file}`\n\n")
            f.write("## 📂 Fichiers impactés par propagation\n")
            for f_path in sorted(list(impacted_files)): f.write(f"- [ ] `{f_path}`\n")
            f.write("\n## ⚡ Méthodes à tester en priorité\n")
            for m_sig in sorted(impacted_methods): f.write(f"- [ ] `{m_sig}`\n")

        success(f"Blast Radius calculé. Fichiers impactés : {len(impacted_files)}", component="GitDelta")

def main():
    parser = argparse.ArgumentParser(description="Deterministic Blast Radius Evaluation")
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--file", required=True)
    parser.add_argument("--output", default=".graph-rag-explorer/code-graph")
    args = parser.parse_args()

    try:
        config = json.loads(sys.stdin.read())
    except Exception:
        config = {}

    configure_logger(
        workspace_root=args.workspace,
        enabled=config.get("logFileEnabled", True),
        max_size=config.get("logFileMaxSize", 5),
        retention=config.get("logFileMaxCountRetension", 5)
    )

    analyzer = GitDeltaAnalyzer(args.workspace, args.output)
    analyzer.calculate_blast_radius(args.file)

if __name__ == "__main__":
    main()
