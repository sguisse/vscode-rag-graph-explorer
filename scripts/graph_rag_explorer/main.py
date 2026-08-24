#!/usr/bin/env python3
import sys
import os
import json

script_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(script_dir, "..")))
sys.path.insert(0, script_dir)

from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info, success, error, configure_logger, cleanup_orphan_pids
from core.neo4j_extractor import UIExtractor, run_ui_extractor_pipeline
from core.clean_target import clean_target_workspace
from install.runner import run_installation_pipeline
from initialization.runner import run_initialization_pipeline
from analyser.runner import run_analysis_pipeline


def main():
    load_vscode_settings()
    initialize_logger()

    info("⚡ Activating Master Workbench Ingestion Lifecycles...", component="Main")

    # Clean target workspace while keeping heavy installed tools and Python virtualenvs
    clean_target_workspace()

    # Clear lingering process tracking metrics
    cleanup_orphan_pids()

    try:
        # PHASE 1: Prerequisite compilation packages setup check
        run_installation_pipeline()

        # PHASE 2: Initialization Phase (Discovery Manifest + Early Database Ignite)
        run_initialization_pipeline()

        # PHASE 3: Parallelized ETL Ingestion to Neo4j
        run_analysis_pipeline()

        # PHASE 4: Compact UI Render Payload Packager
        run_ui_extractor_pipeline()

        success("🎉 Core analytics engine sequence completed. Layout files generated successfully.", component="Main")

    except Exception as e:
        error(f"Critical workbench crash encountered within main execution context: {e}", component="Main")
        sys.exit(1)

def initialize_logger():
    configure_logger(
        workspace_root=vsCodeSettings.workspaceRoot,
        enabled=vsCodeSettings.logFileEnabled,
        max_size=vsCodeSettings.logFileMaxSize,
        retention=vsCodeSettings.logFileMaxCountRetention
    )

def load_vscode_settings():
    vsCodePublishedSettings = {}
    if not sys.stdin.isatty():
        try: vsCodePublishedSettings = json.loads(sys.stdin.read())
        except Exception: vsCodePublishedSettings = {}

    # log configuration in info
    info(f"Received configuration: {json.dumps(vsCodePublishedSettings, indent='  ')}", component="Main")
    vsCodeSettings.inject_vscode_settings(vsCodePublishedSettings)

    # Quick validation of essential settings
    info(f"Workspace Root: {vsCodeSettings.workspaceRoot}", component="Main")
    info(f"Backend Scripts Path: {vsCodeSettings.backendWorkspacePath}", component="Main")
    info(f"Neo4J user: {vsCodeSettings.graphRagExplorer.neo4j.username}", component="Main")
    info(f"logFileEnabled: {vsCodeSettings.logFileEnabled}", component="Main")
    info(f"logFileMaxSize: {vsCodeSettings.logFileMaxSize}", component="Main")
    info(f"logFileMaxCountRetention: {vsCodeSettings.logFileMaxCountRetention}", component="Main")


if __name__ == "__main__":
    main()
