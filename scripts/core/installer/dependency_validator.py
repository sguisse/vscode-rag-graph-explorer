import os
import yaml
from typing import Dict, List, Set, Any
from core.utils import info, warn, error, success


class ToolDependencyValidator:
    """
    Validates global tool enablement and cross-tool category dependencies.
    Reads global configuration from <workspace>/<backendWorkspacePath>/config/global-tools-config.yaml
    or defaults from <workspace>/<backendWorkspacePath>/scripts/config/default/global-tools-config.yaml.
    """

    def __init__(self, workspace_root: str, backend_rel_path: str):
        if not backend_rel_path:
            error("backendWorkspacePath is missing in central configuration.", component="DependencyValidator")
            raise ValueError("Missing configuration value: backendWorkspacePath is required.")

        self.workspace_root = workspace_root
        self.backend_rel_path = backend_rel_path

        # User override path: <workspace>/<backendWorkspacePath>/config/global-tools-config.yaml
        self.global_config_path = os.path.normpath(
            os.path.join(self.workspace_root, self.backend_rel_path, "config", "global-tools-config.yaml")
        ).replace("\\", "/")

        # Shipped default path: <workspace>/<backendWorkspacePath>/scripts/config/default/global-tools-config.yaml
        self.default_global_config_path = os.path.normpath(
            os.path.join(self.workspace_root, self.backend_rel_path, "scripts", "config", "default", "global-tools-config.yaml")
        ).replace("\\", "/")

    def load_global_tool_config(self) -> Dict[str, bool]:
        """
        Loads tool enable/disable flags from global-tools-config.yaml.
        Checks user workspace config first, then falls back to scripts/config/default/global-tools-config.yaml.
        Returns dict mapping tool_name -> enabled boolean.
        """
        tool_status: Dict[str, bool] = {}
        target_path = None

        if os.path.exists(self.global_config_path):
            target_path = self.global_config_path
        elif os.path.exists(self.default_global_config_path):
            target_path = self.default_global_config_path

        if target_path:
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f) or {}
                    tools = data.get("tools", {})
                    if isinstance(tools, dict):
                        for tool, enabled in tools.items():
                            tool_status[str(tool)] = bool(enabled)
                info(f"Loaded global tools status from '{target_path}'.", component="DependencyValidator")
            except Exception as e:
                warn(f"Failed to parse global tool config at '{target_path}': {e}", component="DependencyValidator")
        else:
            info(f"Global configuration file not found at '{self.global_config_path}' or '{self.default_global_config_path}'. Defaulting all tools to enabled.", component="DependencyValidator")

        return tool_status

    def is_tool_enabled(self, tool_name: str, global_status: Dict[str, bool]) -> bool:
        """Returns True if the tool is enabled in global_status (defaults to True if unlisted)."""
        return global_status.get(tool_name, True)

    def load_category_dependencies(self, install_root_dir: str) -> Dict[str, List[str]]:
        """
        Discovers tools-dependencies.yaml files in category modules or workspace config folders.
        Example tools-dependencies.yaml:
          dependencies:
            java_jqassistant_graph_rag:
              - java_jqassistant
              - 01_system_neo4j
        Returns mapping: tool_name -> list of required tool_names.
        """
        dependency_map: Dict[str, List[str]] = {}

        # Search in installer module paths
        for root, _, files in os.walk(install_root_dir):
            if "tools-dependencies.yaml" in files or "tools-dependencies.yml" in files:
                dep_filename = "tools-dependencies.yaml" if "tools-dependencies.yaml" in files else "tools-dependencies.yml"
                file_path = os.path.join(root, dep_filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = yaml.safe_load(f) or {}
                        deps = data.get("dependencies", {})
                        if isinstance(deps, dict):
                            for tool_name, reqs in deps.items():
                                if isinstance(reqs, list):
                                    dependency_map[str(tool_name)] = [str(r) for r in reqs]
                except Exception as e:
                    warn(f"Failed to read category dependencies file '{file_path}': {e}", component="DependencyValidator")

        # Search in <workspace>/<backendWorkspacePath>/config/<category>/tools-dependencies.yaml
        external_config_dir = os.path.normpath(
            os.path.join(self.workspace_root, self.backend_rel_path, "config")
        ).replace("\\", "/")
        if os.path.exists(external_config_dir):
            for root, _, files in os.walk(external_config_dir):
                if "tools-dependencies.yaml" in files or "tools-dependencies.yml" in files:
                    dep_filename = "tools-dependencies.yaml" if "tools-dependencies.yaml" in files else "tools-dependencies.yml"
                    file_path = os.path.join(root, dep_filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = yaml.safe_load(f) or {}
                            deps = data.get("dependencies", {})
                            if isinstance(deps, dict):
                                for tool_name, reqs in deps.items():
                                    if isinstance(reqs, list):
                                        dependency_map[str(tool_name)] = [str(r) for r in reqs]
                    except Exception as e:
                        warn(f"Failed to read external category dependencies file '{file_path}': {e}", component="DependencyValidator")

        return dependency_map

    def validate_tool_dependencies(self, enabled_tools: List[str], dependency_map: Dict[str, List[str]]) -> None:
        """
        Validates that for all enabled tools, their required dependencies are also enabled.
        Raises ValueError if a required dependency is disabled or missing.
        """
        enabled_set: Set[str] = set(enabled_tools)
        errors: List[str] = []

        for tool_name in enabled_tools:
            prerequisites = dependency_map.get(tool_name, [])
            for prereq in prerequisites:
                if prereq not in enabled_set:
                    errors.append(f"Tool [{tool_name}] requires [{prereq}] to be enabled and installed, but [{prereq}] is disabled or missing.")

        if errors:
            error_msg = "Global Tool Dependency Validation Failed:\n" + "\n".join(f"  - {err}" for err in errors)
            error(error_msg, component="DependencyValidator")
            raise ValueError(error_msg)

        success(f"Tool dependencies successfully validated for {len(enabled_tools)} enabled tool(s).", component="DependencyValidator")
