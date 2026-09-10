import shutil
import os
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.node.dependency_cruiser.constants import (
    MODULE_NAME,
)
from install.modules.node.context import NodeContext

@InstallerRegistry.register_checker
class NodeDependencyCruiserChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def check_dependency_cruiser_modules(self):
        self.steps_count += 1
        dc_path = f"{self.node_ctx.node_env_path}/node_modules/dependency-cruiser"
        if os.path.exists(dc_path): self.status["dependency_cruiser"] = {"status": "✅"}
        else:
            self.status["dependency_cruiser"] = {"status": "❌"}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_dependency_cruiser_modules()
        return self.generate_summary()
