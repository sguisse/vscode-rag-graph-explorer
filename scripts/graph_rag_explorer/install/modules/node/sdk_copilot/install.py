import os
from typing import Optional
from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from core.utils import execute_tracked_command, info, success, error
from install.modules.node.sdk_copilot.context import (
    MODULE_NAME,
    NodeContext,
)
from install.modules.node.sdk_copilot.constants import get_platform_target
from install.modules.node.sdk_copilot.check import LlmSdkCopilotChecker

@InstallerRegistry.register_installer
class LlmSdkCopilotInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def provisioning_sdk_copilot(self):
        target_env = self.node_ctx.node_env_path
        info(f"Installing @github/copilot-sdk@1.0.13 in {target_env}...", component=self.name)
        return_code = execute_tracked_command(["npm", "install", "@github/copilot-sdk@1.0.13"], "sdk_copilot_install", cwd=target_env)
        if return_code == 0:
            success("@github/copilot-sdk@1.0.13 installed successfully.", component=self.name)
        else:
            error(f"npm install @github/copilot-sdk@1.0.13 failed with code {return_code}", component=self.name)


    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = LlmSdkCopilotChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("sdk_copilot", {}).get("status") != "✅":
            self.provisioning_sdk_copilot()
