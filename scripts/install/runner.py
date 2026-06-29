import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.utils import info, success, warn
from install.base import EnvironmentContext
from install.registry import ModuleRegistry
from install.report_handler import ReportHandler

def run_installation_pipeline(workspace_root: str, config_matrix: dict):
    info("Bootstrapping Phase 1: Prerequisite Environment Installation Pipeline...", component="InstallRunner")
    context = EnvironmentContext(workspace_root, config_matrix)
    report_handler = ReportHandler(context)

    install_dir = os.path.dirname(os.path.abspath(__file__))
    ModuleRegistry.discover_and_load_lifecycle_nodes(install_dir)

    checkers = {cls(context).name: cls(context) for cls in ModuleRegistry.get_checkers()}
    installers = {cls(context).name: cls(context) for cls in ModuleRegistry.get_installers()}

    for name in sorted(checkers.keys()):
        # Skip the Neo4j installer from the installation pipeline runner as it is moved into the initialization block
        if name == "system_neo4j":
            continue

        checker = checkers.get(name)
        installer = installers.get(name)

        before_status = checker.execute_all_checks()
        report_handler.save_snapshot(name, "before", before_status)

        if before_status.get("summary", {}).get("globalStatus") != "✅":
            if installer:
                warn(f"Validation anomaly caught on node [{name}]. Deploying fixes...", component="InstallRunner")
                installer.execute_all_installations()
                after_status = checker.execute_all_checks()
                report_handler.save_snapshot(name, "after", after_status)
            else:
                report_handler.save_snapshot(name, "after", before_status)
        else:
            success(f"Ecosystem verification check satisfied for: [{name}].", component="InstallRunner")
            report_handler.save_snapshot(name, "after", before_status)

    report_handler.compile_final_summary()
