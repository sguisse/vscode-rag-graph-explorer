import os
import sys
from typing import Dict, Any, Optional, Type

import config as config_module
from core.utils import info, success, warn, error
from core.installer.context import BaseEnvironmentContext
from core.installer.config import BaseConfigModule
from core.installer.check import BaseCheckModule
from core.installer.install import BaseInstallModule
from core.installer.dependency_validator import ToolDependencyValidator
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

    # Strict verification of required backendWorkspacePath configuration
    backend_rel_path = getattr(config_module.config.vsCodeSettings, "backendWorkspacePath", None)
    if not backend_rel_path:
        error("backendWorkspacePath is missing in central configuration.", component="InstallRunner")
        raise ValueError("Missing configuration value: backendWorkspacePath is required in vsCodeSettings configuration.")

    # Validate global configuration and category dependencies
    validator = ToolDependencyValidator(
        workspace_root=context.workspace_root,
        backend_rel_path=backend_rel_path
    )
    global_status = validator.load_global_tool_config()
    dependency_map = validator.load_category_dependencies(install_dir)

    configurators: Dict[str, BaseConfigModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_configurators()}
    checkers: Dict[str, BaseCheckModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_checkers()}
    installers: Dict[str, BaseInstallModule] = {cls(context).name: cls(context) for cls in InstallerRegistry.get_installers()}

    # All discovered module names
    all_discovered_names = sorted(set(configurators.keys()) | set(checkers.keys()) | set(installers.keys()))

    # Filter enabled tools
    enabled_modules = [name for name in all_discovered_names if validator.is_tool_enabled(name, global_status)]
    disabled_modules = set(all_discovered_names) - set(enabled_modules)

    if disabled_modules:
        info(f"Disabled tool modules by global configuration (will be skipped): {', '.join(sorted(disabled_modules))}", component="InstallRunner")

    # Validate dependencies for enabled tools
    validator.validate_tool_dependencies(enabled_modules, dependency_map)

    info(f"Active enabled modules to execute ({len(enabled_modules)}):", component="InstallRunner")
    for name in enabled_modules:
        info(f"   - {name}", component="InstallRunner")

    total_modules = len(enabled_modules)
    for index, name in enumerate(enabled_modules, start=1):
        configurator: Optional[BaseConfigModule] = configurators.get(name)
        checker: Optional[BaseCheckModule] = checkers.get(name)
        installer: Optional[BaseInstallModule] = installers.get(name)

        info(f"[{index}/{total_modules}] Processing module [{name}]...", component="InstallRunner")

        # STEP 1: CONFIGURATION (Runs BEFORE Check)
        if configurator:
            info(f"[{name}] Step 1/3: Executing module configuration...", component="InstallRunner")
            try:
                configurator.apply_config()
            except Exception as e:
                error(f"Configuration failed for module [{name}]: {e}", component="InstallRunner")
                raise
        else:
            info(f"[{name}] Step 1/3: No configurator registered. Skipping config phase.", component="InstallRunner")

        # STEP 2: CHECK
        if not checker:
            warn(f"[{name}] No checker registered. Skipping verification.", component="InstallRunner")
            continue

        info(f"[{name}] Step 2/3: Executing module checks...", component="InstallRunner")
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

        # STEP 3: INSTALL (If check failed)
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