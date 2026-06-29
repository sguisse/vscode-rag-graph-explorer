import shutil
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class JavaJQAssistantChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "java_jqassistant"

    def _find_sandboxed_binary(self, base_dir: str, target_name: str) -> str:
        if not os.path.exists(base_dir): return None
        for root, _, files in os.walk(base_dir):
            if target_name in files:
                return os.path.join(root, target_name).replace("\\", "/")
        return None

    def check_java_runtime(self):
        self.steps_count += 1
        java_executable = shutil.which("java")
        if java_executable:
            self.status["java"] = {"status": "✅"}
        else:
            self.status["java"] = {"status": "❌", "message": "Java JRE/JDK runtime environment is missing."}
            self.ko_count += 1

    def check_jqassistant_executable_availability(self):
        self.steps_count += 1
        version = self.context.get_tool_setting("jqassistant", "version", "2.9.1")
        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant.sh"

        global_bin = shutil.which(base_cmd) or shutil.which("jqassistant")

        # REALIGNED PATH: Scans targeted mirror structure inside tools repository tree
        sandbox_root = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/jqassistant-{version}"
        local_bin = self._find_sandboxed_binary(sandbox_root, base_cmd)

        if global_bin:
            self.status["jqassistant_binary"] = {"status": "✅", "type": "global", "path": global_bin}
        elif local_bin:
            self.status["jqassistant_binary"] = {"status": "✅", "type": "sandbox", "path": local_bin}
        else:
            self.status["jqassistant_binary"] = {
                "status": "❌",
                "message": f"jQAssistant command line binary '{base_cmd}' was unmapped globally and inside target/tools/java/jqassistant/ structures."
            }
            self.ko_count += 1

    def check_workspace_raw_outputs_dir(self):
        self.steps_count += 1
        java_raw_output_dir = f"{self.context.workspace_root}/.graph-rag-explorer/target/raw_outputs/java"
        if os.path.exists(java_raw_output_dir):
            self.status["raw_outputs_java"] = {"status": "✅"}
        else:
            self.status["raw_outputs_java"] = {"status": "❌"}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.check_java_runtime()
        self.check_jqassistant_executable_availability()
        self.check_workspace_raw_outputs_dir()
        return self.generate_summary()
