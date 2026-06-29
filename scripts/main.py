#!/usr/bin/env python3
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.utils import info, success, error, configure_logger, cleanup_orphan_pids
from core.ui_extractor import UIExtractor
from install.runner import run_installation_pipeline
from initialization.runner import run_initialization_pipeline
from analyser.runner import run_analysis_pipeline
from analyser.neo4j_client import Neo4jClient

def main():
    config = {}
    if not sys.stdin.isatty():
        try: config = json.loads(sys.stdin.read())
        except Exception: config = {}

    workspace_root = config.get("workspaceRoot", os.getcwd())

    configure_logger(
        workspace_root=workspace_root,
        enabled=config.get("logFileEnabled", True),
        max_size=config.get("logFileMaxSize", 5),
        retention=config.get("logFileMaxCountRetension", 5)
    )

    info("⚡ Activating Master Workbench Ingestion Lifecycles...", component="SuperOrchestrator")

    # Clear lingering process tracking metrics
    cleanup_orphan_pids()

    try:
        # PHASE 1: Prerequisite compilation packages setup check
        run_installation_pipeline(workspace_root, config)

        # PHASE 2: NEW BLOCK - Initialization Phase (Discovery Manifest + Early Database Ignite)
        manifest_path = run_initialization_pipeline(workspace_root, config)

        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)

        # PHASE 3: Parallelized ETL Ingestion to Neo4j
        neo4j_config = config.get("neo4j", {"uri": "bolt://localhost:7687", "username": "neo4j", "password": "password"})
        run_analysis_pipeline(manifest_path, neo4j_config, config)

        # PHASE 4: Compact UI Render Payload Packager
        db_client = Neo4jClient(uri=neo4j_config["uri"], auth=(neo4j_config["username"], neo4j_config["password"]))
        extractor = UIExtractor(workspace_root, db_client)
        extractor.extract_and_save(manifest_data["files"])
        db_client.close()

        success("🎉 Core analytics engine sequence completed. Layout files generated successfully.", component="SuperOrchestrator")

    except Exception as e:
        error(f"Critical workbench crash encountered within main execution context: {e}", component="SuperOrchestrator")
        sys.exit(1)

if __name__ == "__main__":
    main()
