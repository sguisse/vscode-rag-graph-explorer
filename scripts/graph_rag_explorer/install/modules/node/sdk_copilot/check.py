import shutil
import os
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.node.sdk_copilot.constants import (
    MODULE_NAME,
    get_platform_target
)
from install.modules.node.context import NodeContext

@InstallerRegistry.register_checker
class LlmSdkCopilotChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME


    def check_sdk_copilot_modules(self):
        self.steps_count += 1
        dc_path = f"{self.node_ctx.node_env_path}/node_modules/@github/copilot-sdk"
        if os.path.exists(dc_path): self.status["sdk_copilot"] = {"status": "✅"}
        else:
            self.status["sdk_copilot"] = {"status": "❌"}
            self.ko_count += 1

    def check_sdk_copilot_platform_modules(self):
        self.steps_count += 1
        dc_path = f"{self.node_ctx.node_env_path}/node_modules/@github/copilot-sdk-{get_platform_target()}"
        if os.path.exists(dc_path): self.status["sdk_copilot_platform"] = {"status": "✅"}
        else:
            self.status["sdk_copilot_platform"] = {"status": "❌"}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_sdk_copilot_modules()
        self.check_sdk_copilot_platform_modules()
        return self.generate_summary()
