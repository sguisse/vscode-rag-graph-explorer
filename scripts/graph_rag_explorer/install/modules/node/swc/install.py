import os
from typing import Optional
from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from core.utils import execute_tracked_command, info, success, error
from install.modules.node.swc.context import (
    MODULE_NAME,
    NodeContext,
)
from install.modules.node.swc.check import NodeSwcChecker

@InstallerRegistry.register_installer
class NodeSwcInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def install_swc_core(self):
        target_env = self.node_ctx.node_env_path
        info(f"Installing @swc/core@1.15.43 in {target_env}...", component=self.name)
        return_code = execute_tracked_command(["npm", "install", "@swc/core@1.15.43"], "swc_install", cwd=target_env)
        if return_code == 0:
            success("@swc/core@1.15.43 installed successfully.", component=self.name)
        else:
            error(f"npm install @swc/core@1.15.43 failed with code {return_code}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeSwcChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("swc", {}).get("status") != "✅":
            self.install_swc_core()
