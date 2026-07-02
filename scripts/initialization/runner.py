import os
from core.utils import info, success
from initialization.discovery_engine import DiscoveryEngine
from install.base import EnvironmentContext
from install.modules.system.neo4j.check import SystemNeo4jChecker
from install.modules.system.neo4j.install import SystemNeo4jInstaller

def run_initialization_pipeline(workspace_root: str, config: dict) -> str:
    """Executes Phase 2: Sequential Initialization Block (Discovery + Sandbox Database Ignition)."""
    info("Entering Phase 2: Initialization Block...", component="InitializationRunner")

    # 1. Run codebase discovery mapper metrics
    discovery = DiscoveryEngine(workspace_root, config)
    manifest_path = discovery.generate_manifest()

    return manifest_path
