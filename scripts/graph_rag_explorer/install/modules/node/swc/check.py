import shutil
import os
from install.check import GraphRagExplorerCheck
from core.installer.registry import InstallerRegistry
from install.modules.node.swc.context import (
    MODULE_NAME,
    NodeContext,
)

@InstallerRegistry.register_checker
class NodeSwcChecker(GraphRagExplorerCheck):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def check_swc_core_package(self):
        self.steps_count += 1
        swc_path = f"{self.node_ctx.node_env_path}/node_modules/@swc/core"
        if os.path.exists(swc_path):
            self.status["swc"] = {"status": "✅"}
        else:
            self.status["swc"] = {"status": "❌", "message": "@swc/core modules unallocated."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_swc_core_package()
        return self.generate_summary()
