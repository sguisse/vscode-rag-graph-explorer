import os
from abc import ABC
import config as config_module
from core.utils import info, error

# Sub-contexts (one per install module) are built many times per run; resolved paths are only logged once per tool.
_LOGGED_TOOLS = set()


class BaseEnvironmentContext(ABC):
    """Abstract Base Class providing common workspace paths, target directories, and report structures."""

    def __init__(self, tool_name: str = None):
        if not tool_name:
            error("BaseEnvironmentContext built without a tool_name.", component="EnvironmentContext")
            raise ValueError("tool_name must be explicitly defined by a concrete subclass or constructor argument.")

        be_scripts_path = getattr(config_module.config.vsCodeSettings, "backendWorkspacePath", None)
        if not be_scripts_path:
            error("backendWorkspacePath is missing in the central configuration.", component="EnvironmentContext")
            raise ValueError("backendWorkspacePath is missing or undefined in vsCodeSettings configuration.")

        self.tool_name = tool_name
        self.workspace_root = config_module.config.vsCodeSettings.workspaceRoot or os.getcwd()
        if os.path.abspath(self.workspace_root) == os.path.abspath(os.sep):
            error(f"workspaceRoot resolves to the filesystem root ('{self.workspace_root}'); aborting.", component="EnvironmentContext")
            raise ValueError("workspaceRoot resolves to the filesystem root; refusing to create installer directories there.")
        self.beScriptsPath = be_scripts_path

        self.global_target_dir = f"{self.workspace_root}/{self.beScriptsPath}/target"
        self.global_install_reports_dir = f"{self.global_target_dir}/install_reports"

        self.target_dir = f"{self.global_target_dir}/{self.tool_name}"
        # Per-tool reports live inside the tool target dir (consumed by the extension host: <tool>/install_reports/final-status.json)
        self.install_reports_dir = f"{self.target_dir}/install_reports"
        self.tools_dir = f"{self.target_dir}/tools"
        self.raw_outputs_dir = f"{self.target_dir}/raw_outputs"

        self.ensure_directories()

        if tool_name not in _LOGGED_TOOLS:
            _LOGGED_TOOLS.add(tool_name)
            info(
                f"Environment context ready for [{tool_name}] "
                f"(workspace_root='{self.workspace_root}', backend='{self.beScriptsPath}', target_dir='{self.target_dir}').",
                component="EnvironmentContext",
            )

    def ensure_directories(self) -> None:
        """Ensures all baseline context output directories exist on disk."""
        os.makedirs(self.tools_dir, exist_ok=True)
        os.makedirs(self.global_install_reports_dir, exist_ok=True)
        os.makedirs(self.install_reports_dir, exist_ok=True)
        os.makedirs(self.raw_outputs_dir, exist_ok=True)
