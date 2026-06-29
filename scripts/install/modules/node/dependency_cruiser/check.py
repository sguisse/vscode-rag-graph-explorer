import shutil
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class NodeDependencyCruiserChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "node_dependency_cruiser"

    def check_node_executable(self):
        self.steps_count += 1
        if shutil.which("node"): self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {"status": "❌"}
            self.ko_count += 1

    def check_dependency_cruiser_modules(self):
        self.steps_count += 1
        dc_path = f"{self.context.workspace_root}/scripts/analyser/node_modules/dependency-cruiser"
        if os.path.exists(dc_path): self.status["dependency_cruiser"] = {"status": "✅"}
        else:
            self.status["dependency_cruiser"] = {"status": "❌"}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.check_node_executable()
        self.check_dependency_cruiser_modules()
        return self.generate_summary()
