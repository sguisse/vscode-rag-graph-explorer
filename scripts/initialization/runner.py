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

    # 2. Boot up the sandboxed local Neo4j server immediately before Analyzers trigger
    ctx = EnvironmentContext(workspace_root, config)
    checker = SystemNeo4jChecker(ctx)
    installer = SystemNeo4jInstaller(ctx)

    info("Validating sandboxed database state in initialization block...", component="InitializationRunner")
    before_status = checker.execute_all_checks()

    if before_status.get("summary", {}).get("globalStatus") != "✅":
        info("Neo4j database sandbox instance offline. Triggering boot sequence...", component="InitializationRunner")
        installer.execute_all_installations()
    else:
        success("Neo4j sandboxed instance is already verified online and responsive.", component="InitializationRunner")

    return manifest_path
