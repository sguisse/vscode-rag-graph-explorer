import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from analyser.neo4j_client import Neo4jClient
from analyser.registry import AnalyserRegistry

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.utils import info, success, error

def run_analysis_pipeline(manifest_path: str, neo4j_config: dict, global_config_matrix: dict):
    info("Launching background data parsing threads targeting embedded storage context...", component="AnalyserRunner")

    if not os.path.exists(manifest_path):
        error(f"Execution terminated: Manifest file target unmapped at {manifest_path}", component="AnalyserRunner")
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)

    db_client = Neo4jClient(
        uri=neo4j_config.get("uri", "bolt://localhost:7687"),
        auth=(neo4j_config.get("username", "neo4j"), neo4j_config.get("password", "password"))
    )

    analyser_root = os.path.dirname(os.path.abspath(__file__))
    AnalyserRegistry.discover_and_load_workers(analyser_root)
    worker_classes = AnalyserRegistry.get_all_analysers()

    info(f"Spawning {len(worker_classes)} background workers to feed the knowledge graph container context.", component="AnalyserRunner")

    with ThreadPoolExecutor(max_workers=len(worker_classes)) as executor:
        futures = []
        for cls in worker_classes:
            worker = cls()
            info(f"Allocating execution thread targeting analytics worker node: [{worker.name}]", component="AnalyserRunner")
            futures.append(executor.submit(worker.run_analysis, manifest_data, db_client, global_config_matrix))

        for future in futures:
            try:
                future.result()
            except Exception as e:
                error(f"Background thread ingestion crash details: {e}", component="AnalyserRunner")

    db_client.close()
