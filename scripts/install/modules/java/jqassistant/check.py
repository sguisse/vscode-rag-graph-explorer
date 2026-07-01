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

    def check_sandboxed_config(self):
        self.steps_count += 1
        # Realigned path to tools/java/jqassistant/config
        config_path = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/config/.jqassistant.yml"
        if os.path.exists(config_path):
            self.status["jqassistant_custom_config"] = {"status": "✅", "path": config_path}
        else:
            self.status["jqassistant_custom_config"] = {
                "status": "❌",
                "message": "Isolated jQAssistant configuration (.jqassistant.yml) is missing in config directory."
            }
            self.ko_count += 1

    def check_sandboxed_rules(self):
        self.steps_count += 1
        rules_dir = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/config/rules"
        if os.path.exists(rules_dir) and any(f.endswith(".xml") for f in os.listdir(rules_dir)):
            self.status["jqassistant_custom_rules"] = {"status": "✅", "path": rules_dir}
        else:
            self.status["jqassistant_custom_rules"] = {
                "status": "❌",
                "message": f"No custom XML rules found in sandboxed directory: {rules_dir}"
            }
            self.ko_count += 1

    def check_workspace_mcp_config(self):
        self.steps_count += 1
        mcp_path = os.path.join(self.context.workspace_root, ".vscode", "mcp.json")
        has_server = False

        if os.path.exists(mcp_path):
            try:
                import json
                with open(mcp_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "servers" in data and "jqassistant-graph-rag" in data["servers"]:
                        has_server = True
            except Exception:
                pass

        if has_server:
            self.status["mcp_server_config"] = {"status": "✅", "path": mcp_path}
        else:
            self.status["mcp_server_config"] = {
                "status": "❌",
                "message": "MCP server 'jqassistant-graph-rag' is missing from .vscode/mcp.json."
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        # CRITICAL FIX: Reset step counters and clean state before running diagnostics
        # This completely stops metrics accumulation when called sequentially across before/after phases
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}

        self.check_java_runtime()
        self.check_jqassistant_executable_availability()
        self.check_workspace_raw_outputs_dir()
        self.check_sandboxed_config()
        self.check_sandboxed_rules()
        self.check_workspace_mcp_config()
        return self.generate_summary()
