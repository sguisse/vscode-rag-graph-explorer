import os
import re
import hashlib
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import config as config_module
from core.installer.context import BaseEnvironmentContext
from core.utils import info, success, warn, error


class BaseConfigModule(ABC):
    """
    Abstract Base Class for tool-specific configuration management.
    Handles externalized tool configuration under <workspace>/<backendWorkspacePath>/config/<tool-category>/<tool-name>/,
    dynamically rebuilding and interpolating tool environment and VS Code setting variables to detect changes
    and reactivate tool configuration prior to check execution.
    """

    def __init__(self, context: BaseEnvironmentContext, category: str):
        if not category or not str(category).strip():
            error("category parameter is missing in tool configuration initialization.", component="BaseConfigModule")
            raise ValueError("Missing configuration value: category parameter is required for BaseConfigModule.")

        self.context = context
        self.category = str(category).strip()
        self.workspace_root = config_module.config.vsCodeSettings.workspaceRoot or os.getcwd()

        self.backend_rel_path = getattr(config_module.config.vsCodeSettings, "backendWorkspacePath", None)
        if not self.backend_rel_path:
            error("backendWorkspacePath is missing in central configuration.", component="BaseConfigModule")
            raise ValueError("Missing configuration value: backendWorkspacePath is required in vsCodeSettings configuration.")

        # Externalized tool configuration path: <workspace>/<backendWorkspacePath>/config/<category>/<tool_name>/
        self.external_config_dir = os.path.normpath(
            os.path.join(self.workspace_root, self.backend_rel_path, "config", self.category, self.name)
        ).replace("\\", "/")

        # State tracking path: <workspace>/<backendWorkspacePath>/target/config_state/<tool_name>.hash
        self.state_dir = os.path.normpath(
            os.path.join(self.workspace_root, self.backend_rel_path, "target", "config_state")
        ).replace("\\", "/")
        self.hash_file_path = os.path.join(self.state_dir, f"{self.name}.hash").replace("\\", "/")

    @property
    @abstractmethod
    def name(self) -> str:
        """Returns the unique tool module name (must match checker and installer name)."""
        pass

    def ensure_config_directory(self) -> None:
        """Ensures external config directory and state directories exist."""
        os.makedirs(self.external_config_dir, exist_ok=True)
        os.makedirs(self.state_dir, exist_ok=True)

    def interpolate_config_content(self, content: str) -> str:
        """
        Interpolates variables from the tool environment, VS Code settings, and system environment
        into the raw configuration template/file text before hashing and application.
        Supported patterns:
          - ${env:VAR_NAME[:default]}
          - ${vsCodeSettings.property_path}
          - ${workspaceRoot}
          - ${backendWorkspacePath}
          - ${tool_name}
          - ${abs_path:relative_path}
        """
        if not content:
            return ""

        # Replace tool context shortcuts
        content = content.replace("${workspaceRoot}", str(self.workspace_root))
        content = content.replace("${backendWorkspacePath}", str(self.backend_rel_path))
        content = content.replace("${tool_name}", str(self.name))
        if hasattr(self.context, "target_dir"):
            content = content.replace("${target_dir}", str(getattr(self.context, "target_dir")))
        if hasattr(self.context, "tools_dir"):
            content = content.replace("${tools_dir}", str(getattr(self.context, "tools_dir")))

        # Replace env variables: ${env:VAR_NAME:default} or ${env:VAR_NAME}
        def replace_env(match: re.Match) -> str:
            var_name = match.group(1)
            default_val = match.group(3) if match.group(3) is not None else ""
            return os.environ.get(var_name, default_val)

        content = re.sub(r"\$\{env:([A-Za-z0-9_]+)(:(.*?))?\}", replace_env, content)

        # Replace vsCodeSettings properties: ${vsCodeSettings.prop1.prop2}
        def replace_settings(match: re.Match) -> str:
            prop_path = match.group(1).split(".")
            obj = getattr(config_module.config, "vsCodeSettings", None)
            for p in prop_path:
                if obj is None:
                    break
                obj = getattr(obj, p, None) if hasattr(obj, p) else (obj.get(p) if isinstance(obj, dict) else None)
            return str(obj) if obj is not None else match.group(0)

        content = re.sub(r"\$\{vsCodeSettings\.([A-Za-z0-9_\.]+)\}", replace_settings, content)

        # Replace abs_path helpers: ${abs_path:path}
        def replace_abs_path(match: re.Match) -> str:
            rel = match.group(1)
            return os.path.normpath(os.path.join(self.workspace_root, rel)).replace("\\", "/")

        content = re.sub(r"\$\{abs_path:(.*?)\}", replace_abs_path, content)

        return content

    def calculate_config_hash(self) -> str:
        """
        Calculates an MD5 hash of all configuration files in the externalized tool folder
        AFTER rebuilding each file with environment/settings interpolation.
        Returns empty string if no configuration files exist.
        """
        if not os.path.exists(self.external_config_dir):
            return ""

        hasher = hashlib.md5()
        file_found = False

        for root, _, files in sorted(os.walk(self.external_config_dir)):
            for f in sorted(files):
                file_path = os.path.join(root, f)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="replace") as fh:
                        raw_content = fh.read()
                    interpolated_content = self.interpolate_config_content(raw_content)
                    hasher.update(f.encode("utf-8"))
                    hasher.update(interpolated_content.encode("utf-8"))
                    file_found = True
                except Exception as e:
                    warn(f"Failed to read and interpolate config file '{file_path}' for hashing: {e}", component=self.name)

        return hasher.hexdigest() if file_found else ""

    def get_last_applied_hash(self) -> str:
        """Reads the previously saved configuration hash state from disk."""
        if os.path.exists(self.hash_file_path):
            try:
                with open(self.hash_file_path, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception as e:
                warn(f"Could not read configuration state hash file: {e}", component=self.name)
        return ""

    def save_applied_hash(self, config_hash: str) -> None:
        """Saves the current interpolated configuration hash to disk."""
        try:
            os.makedirs(os.path.dirname(self.hash_file_path), exist_ok=True)
            with open(self.hash_file_path, "w", encoding="utf-8") as f:
                f.write(config_hash)
        except Exception as e:
            warn(f"Could not save configuration hash state: {e}", component=self.name)

    def has_configuration_changed(self) -> bool:
        """Returns True if the interpolated configuration has changed since the last execution."""
        current_hash = self.calculate_config_hash()
        last_hash = self.get_last_applied_hash()
        return current_hash != last_hash

    @abstractmethod
    def execute_configuration(self) -> None:
        """
        Custom configuration application logic implemented by concrete tools.
        Invoked ONLY when configuration has changed or is forced.
        """
        pass

    def apply_config(self, force: bool = False) -> bool:
        """
        Rebuilds configuration content with tool environment interpolation, checks for changes,
        and applies the configuration if changed or forced.
        Returns True if configuration was reactivated, False if skipped.
        """
        self.ensure_config_directory()
        current_hash = self.calculate_config_hash()

        if force or self.has_configuration_changed():
            info(f"Reactivating configuration for tool module [{self.name}] from '{self.external_config_dir}'...", component="ConfigRunner")
            try:
                self.execute_configuration()
                self.save_applied_hash(current_hash)
                success(f"Configuration successfully updated for module [{self.name}].", component="ConfigRunner")
                return True
            except Exception as e:
                error(f"Configuration step failed for tool module [{self.name}]: {e}", component="ConfigRunner")
                raise
        else:
            info(f"Configuration unchanged for tool module [{self.name}]. Skipping reactivate.", component="ConfigRunner")
            return False