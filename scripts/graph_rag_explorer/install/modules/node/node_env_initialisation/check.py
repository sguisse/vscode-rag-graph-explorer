import shutil
import os
from install.check import GraphRagExplorerCheck
from core.installer.registry import InstallerRegistry

from install.modules.node.node_env_initialisation.context import (
    MODULE_NAME,
    NodeContext,
)

@InstallerRegistry.register_checker
class NodeEnvironmentChecker(GraphRagExplorerCheck):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def check_node_env_package_json(self):
        self.steps_count += 1
        package_json_path = f"{self.context.tools_dir}/node/package.json"
        if os.path.exists(package_json_path):
            self.status["package_json"] = {"status": "✅"}
        else:
            self.status["package_json"] = {"status": "❌", "message": "Node environment package.json unallocated."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_node_env_package_json()
        return self.generate_summary()
