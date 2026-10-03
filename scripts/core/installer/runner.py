import os
import sys
from typing import Dict, Any, Optional, Type

from core.utils import info, success, warn, error
from core.installer.context import BaseEnvironmentContext
from core.installer.check import BaseCheckModule
from core.installer.install import BaseInstallModule
from core.installer.registry import InstallerRegistry
from core.installer.report_handler import ReportHandler


def _failing_steps(status: Dict[str, Any]) -> str:
    """Lists the check steps that are not OK (everything except the 'summary' entry) to ease debugging."""
    failing = [
        f"{key}={value.get('status')}"
        for key, value in status.items()
        if key != "summary" and isinstance(value, dict) and value.get("status") != "✅"
    ]
    return ", ".join(failing) if failing else "none"


def run_installation_pipeline(
    tool_name: Optional[str] = None,
    install_dir: Optional[str] = None,
    context: Optional[BaseEnvironmentContext] = None,
    context_class: Optional[Type[BaseEnvironmentContext]] = None,
):
    if context is None:
        if context_class is not None:
            if tool_name:
                context = context_class(tool_name=tool_name)
            else:
                context = context_class()
        else:
            raise ValueError("An explicit context or context_class must be provided to run_installation_pipeline.")

    resolved_tool_name = context.tool_name
    info(f"Bootstrapping Phase 1: Environment Installation Pipeline for [{resolved_tool_name}]...", component="InstallRunner")

    report_handler = ReportHandler(context)

    if not install_dir:
        install_dir = os.getcwd()

    info(f"Discovering install modules from '{install_dir}'...", component="InstallRunner")
    InstallerRegistry.discover_and_load_checkers_and_installers(install_dir)

    checkers: Dict[str, BaseCheckModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_checkers()}
    installers: Dict[str, BaseInstallModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_installers()}

    info(f"Discovered these {len(checkers)} modules to check/install in this order:", component="InstallRunner")
    for name in sorted(checkers):
        info(f"   - {name}", component="InstallRunner")
    missing_installers = sorted(set(checkers) - set(installers))
    if missing_installers:
        info(f"Modules without installer (check only): {', '.join(missing_installers)}", component="InstallRunner")

    total_modules = len(checkers)
    for index, name in enumerate(sorted(checkers), start=1):
        checker: Optional[BaseCheckModule] = checkers.get(name)
        installer: Optional[BaseInstallModule] = installers.get(name)

        info(f"[{index}/{total_modules}] Checking module [{name}]...", component="InstallRunner")
        try:
            tool_install_status: Dict[str, Any] = checker.execute_all_checks()
        except Exception as e:
            error(f"Check failed for module [{name}]: {e}", component="InstallRunner")
            raise
        report_handler.save_snapshot(name, "before", tool_install_status)
        before_summary = tool_install_status.get("summary", {})
        info(
            f"[{name}] check result: {before_summary.get('globalStatus')} "
            f"(steps={before_summary.get('stepsCount')}, ko={before_summary.get('koCount')}, "
            f"failing: {_failing_steps(tool_install_status)})",
            component="InstallRunner",
        )

        if tool_install_status.get("summary", {}).get("globalStatus") != "✅" and installer:
            warn(f"Validation anomaly caught on node [{name}]. Deploying fixes...", component="InstallRunner")
            try:
                installer.execute_all_installations(tool_install_status)
            except Exception as e:
                error(f"Installation failed for module [{name}]: {e}", component="InstallRunner")
                raise

            info(f"[{name}] installation done, re-checking...", component="InstallRunner")
            tool_install_status = checker.execute_all_checks()
            report_handler.save_snapshot(name, "after", tool_install_status)
        elif tool_install_status.get("summary", {}).get("globalStatus") != "✅":
            warn(f"Validation anomaly on node [{name}] but no installer is registered.", component="InstallRunner")

        after_summary = tool_install_status.get("summary", {})
        if after_summary.get("globalStatus") == "✅":
            success(f"Ecosystem verification check satisfied for: [{name}].", component="InstallRunner")
        else:
            warn(
                f"Module [{name}] still reports {after_summary.get('globalStatus')} after verification "
                f"(failing: {_failing_steps(tool_install_status)}).",
                component="InstallRunner",
            )
        report_handler.save_snapshot(name, "after", tool_install_status)

    report_handler.compile_final_summary()
    success(f"Installation pipeline finished for [{resolved_tool_name}].", component="InstallRunner")
