import shutil
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class NodeSwcChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "node_swc"

    def check_node_binary(self):
        self.steps_count += 1
        node_bin = shutil.which("node")
        if node_bin:
            self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {"status": "❌", "message": "Node environment runtime omitted."}
            self.ko_count += 1

    def check_npm_binary(self):
        self.steps_count += 1
        npm_bin = shutil.which("npm")
        if npm_bin:
            self.status["npm"] = {"status": "✅"}
        else:
            self.status["npm"] = {"status": "❌", "message": "Npm utility wrapper unmapped."}
            self.ko_count += 1

    def check_swc_core_package(self):
        self.steps_count += 1
        swc_path = f"{self.context.tools_dir}/node/node_modules/@swc/core"
        if os.path.exists(swc_path):
            self.status["swc"] = {"status": "✅"}
        else:
            self.status["swc"] = {"status": "❌", "message": "@swc/core modules unallocated."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.check_node_binary()
        self.check_npm_binary()
        self.check_swc_core_package()
        return self.generate_summary()
