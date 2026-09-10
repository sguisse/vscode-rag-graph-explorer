import os
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import execute_tracked_command
from install.modules.node.swc.constants import (
    MODULE_NAME,
)
from install.modules.node.context import NodeContext
from install.modules.node.swc.check import NodeSwcChecker

@InstallerRegistry.register_installer
class NodeSwcInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def install_swc_core(self):
        target_env = self.node_ctx.node_env_path
        execute_tracked_command(["npm", "install", "@swc/core@1.15.43"], "swc_install", cwd=target_env)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeSwcChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("swc", {}).get("status") != "✅":
            self.install_swc_core()
