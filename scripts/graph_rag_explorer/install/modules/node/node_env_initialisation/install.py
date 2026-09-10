import os
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import execute_tracked_command

from install.modules.node.node_env_initialisation.constants import (
    MODULE_NAME
)
from install.modules.node.context import NodeContext
from install.modules.node.node_env_initialisation.check import NodeEnvironmentChecker

@InstallerRegistry.register_installer
class NodeEnvironmentInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def init_package_json(self):
        if not os.path.exists(f"{self.node_ctx.node_env_path}/package.json"):
            execute_tracked_command(["npm", "init", "-y"], "node_init", cwd=self.node_ctx.node_env_path)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeEnvironmentChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("package_json", {}).get("status") != "✅":
            os.makedirs(self.node_ctx.node_env_path, exist_ok=True)
            self.init_package_json()
