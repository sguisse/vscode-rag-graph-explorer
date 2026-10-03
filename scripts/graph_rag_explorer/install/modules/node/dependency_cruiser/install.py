import os
from typing import Optional
from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from core.utils import execute_tracked_command, info, success, error
from install.modules.node.dependency_cruiser.context import (
    MODULE_NAME,
    NodeContext,
)
from install.modules.node.dependency_cruiser.check import NodeDependencyCruiserChecker

@InstallerRegistry.register_installer
class NodeDependencyCruiserInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def provisioning_dependency_cruiser(self):
        target_env = self.node_ctx.node_env_path
        info(f"Installing dependency-cruiser@18.0.0 in {target_env}...", component=self.name)
        return_code = execute_tracked_command(["npm", "install", "dependency-cruiser@18.0.0"], "dc_install", cwd=target_env)
        if return_code == 0:
            success("dependency-cruiser@18.0.0 installed successfully.", component=self.name)
        else:
            error(f"npm install dependency-cruiser@18.0.0 failed with code {return_code}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeDependencyCruiserChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("dependency_cruiser", {}).get("status") != "✅":
            self.provisioning_dependency_cruiser()
