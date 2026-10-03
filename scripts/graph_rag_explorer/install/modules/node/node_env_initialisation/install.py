import os
from typing import Optional
from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from core.utils import execute_tracked_command, info, success, error

from install.modules.node.node_env_initialisation.context import (
    MODULE_NAME,
    NodeContext,
)
from install.modules.node.node_env_initialisation.check import NodeEnvironmentChecker

@InstallerRegistry.register_installer
class NodeEnvironmentInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def init_package_json(self):
        if not os.path.exists(f"{self.node_ctx.node_env_path}/package.json"):
            info(f"Initializing node environment (npm init) in {self.node_ctx.node_env_path}...", component=self.name)
            return_code = execute_tracked_command(["npm", "init", "-y"], "node_init", cwd=self.node_ctx.node_env_path)
            if return_code == 0:
                success("Node environment initialized.", component=self.name)
            else:
                error(f"npm init failed with code {return_code}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeEnvironmentChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("package_json", {}).get("status") != "✅":
            os.makedirs(self.node_ctx.node_env_path, exist_ok=True)
            self.init_package_json()
