#!/usr/bin/env python3
import sys
import os
import json
import traceback

script_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(script_dir, "..")))
sys.path.insert(0, script_dir)

from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info, success, warn, error, configure_logger, cleanup_orphan_pids
from graph_rag_explorer.services.neo4j_extractor import UIExtractor, run_ui_extractor_pipeline
from core.clean_target import clean_target_workspace
from install.runner import run_installation_pipeline
from initialization.runner import run_initialization_pipeline
from analyser.runner import run_analysis_pipeline
import config as config_module


def main():
    load_vscode_settings()
    initialize_logger()

    info("⚡ Activating Master Workbench Ingestion Lifecycles...", component="Main")
    info(f"Python {sys.version.split()[0]} ({sys.executable}), cwd='{os.getcwd()}'", component="Main")

    # Clean target workspace while keeping heavy installed tools and Python virtualenvs
    info("Cleaning target workspace...", component="Main")
    clean_target_workspace()

    # Clear lingering process tracking metrics
    info("Cleaning orphan processes...", component="Main")
    cleanup_orphan_pids()

    try:
        # PHASE 1: Prerequisite compilation packages setup check
        info("▶ PHASE 1/4: Installation pipeline", component="Main")
        run_installation_pipeline()
        success("✔ PHASE 1/4 completed", component="Main")

        # PHASE 2: Initialization Phase (Discovery Manifest + Early Database Ignite)
        info("▶ PHASE 2/4: Initialization pipeline", component="Main")
        run_initialization_pipeline()
        success("✔ PHASE 2/4 completed", component="Main")

        # PHASE 3: Parallelized ETL Ingestion to Neo4j
        info("▶ PHASE 3/4: Analysis pipeline", component="Main")
        run_analysis_pipeline()
        success("✔ PHASE 3/4 completed", component="Main")

        # PHASE 4: Compact UI Render Payload Packager
        info("▶ PHASE 4/4: UI payload extraction", component="Main")
        run_ui_extractor_pipeline()
        success("✔ PHASE 4/4 completed", component="Main")

        success("🎉 Core analytics engine sequence completed. Layout files generated successfully.", component="Main")

    except Exception as e:
        error(f"Critical workbench crash encountered within main execution context: {e}", component="Main")
        error(f"Traceback:\n{traceback.format_exc()}", component="Main")
        sys.exit(1)

def initialize_logger():
    configure_logger(
        workspace_root=config_module.config.vsCodeSettings.workspaceRoot,
        enabled=config_module.config.vsCodeSettings.logFileEnabled,
        max_size=config_module.config.vsCodeSettings.logFileMaxSize,
        retention=config_module.config.vsCodeSettings.logFileMaxCountRetention
    )

def load_vscode_settings():
    vsCodePublishedSettings = {}
    if not sys.stdin.isatty():
        try: vsCodePublishedSettings = json.loads(sys.stdin.read())
        except Exception: vsCodePublishedSettings = {}

    if not vsCodePublishedSettings:
        warn("No VS Code settings received on stdin: falling back to defaults (workspaceRoot will be the current directory).", component="Main")

    # log configuration in info
    info(f"Received configuration: {json.dumps(vsCodePublishedSettings, indent='  ')}", component="Main")
    vsCodeSettings.inject_vscode_settings(vsCodePublishedSettings)
    config_module.reload_config()
    info("Central configuration reloaded with the VS Code settings.", component="Main")

    # Quick validation of essential settings
    info(f"Workspace Root: {config_module.config.vsCodeSettings.workspaceRoot}", component="Main")
    info(f"Backend Scripts Path: {config_module.config.vsCodeSettings.backendWorkspacePath}", component="Main")
    info(f"Neo4J user: {config_module.config.vsCodeSettings.graphRagExplorer.neo4j.username}", component="Main")
    info(f"logFileEnabled: {config_module.config.vsCodeSettings.logFileEnabled}", component="Main")
    info(f"logFileMaxSize: {config_module.config.vsCodeSettings.logFileMaxSize}", component="Main")
    info(f"logFileMaxCountRetention: {config_module.config.vsCodeSettings.logFileMaxCountRetention}", component="Main")


if __name__ == "__main__":
    main()