import os
import sys
from typing import Dict, Any, Optional

current_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..")))

from core.utils import info, success, warn
from install.base import EnvironmentContext, BaseCheckModule, BaseInstallModule
from install.registry import InstallerRegistry
from install.report_handler import ReportHandler

def run_installation_pipeline():
    info("Bootstrapping Phase 1: Prerequisite Environment Installation Pipeline...", component="InstallRunner")
    context = EnvironmentContext()
    report_handler = ReportHandler(context)

    install_dir = os.path.dirname(os.path.abspath(__file__))
    InstallerRegistry.discover_and_load_checkers_and_installers(install_dir)

    checkers: Dict[str, BaseCheckModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_checkers()}
    installers: Dict[str, BaseInstallModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_installers()}


    info(f"Discovered these {len(checkers)} modules to check/install in this order:", component="InstallRunner")
    for name in sorted(checkers):
        info(f"   - {name}", component="InstallRunner")

    for name in sorted(checkers):
        checker: Optional[BaseCheckModule] = checkers.get(name)
        installer: Optional[BaseInstallModule] = installers.get(name)

        tool_install_status: Dict[str, Any] = checker.execute_all_checks()
        report_handler.save_snapshot(name, "before", tool_install_status)

        if tool_install_status.get("summary", {}).get("globalStatus") != "✅":
            warn(f"Validation anomaly caught on node [{name}]. Deploying fixes...", component="InstallRunner")
            installer.execute_all_installations(tool_install_status)

            tool_install_status = checker.execute_all_checks()
            report_handler.save_snapshot(name, "after", tool_install_status)

        success(f"Ecosystem verification check satisfied for: [{name}].", component="InstallRunner")
        report_handler.save_snapshot(name, "after", tool_install_status)

    report_handler.compile_final_summary()
