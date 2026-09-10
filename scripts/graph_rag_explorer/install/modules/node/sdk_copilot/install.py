import os
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import execute_tracked_command
from install.modules.node.sdk_copilot.constants import (
    MODULE_NAME,
    get_platform_target
)
from install.modules.node.context import NodeContext
from install.modules.node.sdk_copilot.check import LlmSdkCopilotChecker

@InstallerRegistry.register_installer
class LlmSdkCopilotInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def provisioning_sdk_copilot(self):
        target_env = self.node_ctx.node_env_path
        execute_tracked_command(["npm", "install", "@github/copilot-sdk@1.0.13"], "sdk_copilot_install", cwd=target_env)


    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = LlmSdkCopilotChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("sdk_copilot", {}).get("status") != "✅":
            self.provisioning_sdk_copilot()
