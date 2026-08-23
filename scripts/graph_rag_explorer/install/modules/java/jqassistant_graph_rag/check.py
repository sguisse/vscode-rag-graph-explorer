from typing import cast
import shutil
import os
import subprocess
import socket
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.java.jqassistant_graph_rag.context import JQAssistantGraphRagContext
from install.modules.system.neo4j.check import SystemNeo4jChecker
from core.VsCodeSettings_gen import vsCodeSettings

@InstallerRegistry.register_checker
class JQAssistantGraphRagChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.jqa_gr = JQAssistantGraphRagContext(context)

    @property
    def name(self) -> str: return "java_jqassistant_graph_rag"

    def check_git_lfs_availability(self):
        self.steps_count += 1
        lfs_path = shutil.which("git-lfs")

        if not lfs_path:
            for candidate in ["/opt/homebrew/bin/git-lfs", "/usr/local/bin/git-lfs"]:
                if os.path.exists(candidate):
                    lfs_path = candidate
                    break

        is_functional = False
        if lfs_path:
            try:
                res = subprocess.run([lfs_path, "help"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
                if res.returncode == 0:
                    is_functional = True
            except Exception:
                is_functional = False

        if is_functional:
            self.status["git_lfs_availability"] = {"status": "✅", "path": lfs_path}
        else:
            self.status["git_lfs_availability"] = {
                "status": "❌",
                "message": "git-lfs is missing or not functional/accessible in non-interactive process PATH."
            }
            self.ko_count += 1

    def check_jqassistant_graph_rag_tool_availability(self):
        self.steps_count += 1
        tool_path = self.jqa_gr.tools_git_clone
        if os.path.exists(tool_path) and os.path.isdir(tool_path) and os.listdir(tool_path):
            self.status["jqassistant_graph_rag_tool"] = {"status": "✅"}
        else:
            self.status["jqassistant_graph_rag_tool"] = {
                "status": "❌",
                "message": f"The jqassistant-graph-rag tool directory is missing or empty in target tools directory: '{tool_path}'."
            }
            self.ko_count += 1

    def check_jqassistant_graph_rag_llm_model_availability(self):
        self.steps_count += 1
        model_path = os.path.join(self.jqa_gr.tools_models_dir, self.jqa_gr.llm_model_name)
        if os.path.exists(model_path):
            if os.path.isdir(model_path) and os.listdir(model_path):
                self.status["jqassistant_graph_rag_llm_model"] = {"status": "✅"}
            else:
                self.status["jqassistant_graph_rag_llm_model"] = {
                    "status": "❌",
                    "message": "The GraphRag LLM model directory is empty."
                }
                self.ko_count += 1
        else:
            self.status["jqassistant_graph_rag_llm_model"] = {
                "status": "❌",
                "message": f"The GraphRag LLM model is missing in config directory: '{model_path}'."
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
            except Exception: pass

        if has_server:
            self.status["mcp_server_config"] = {"status": "✅"}
        else:
            self.status["mcp_server_config"] = {
                "status": "❌",
                "message": "MCP server 'jqassistant-graph-rag' is missing from .vscode/mcp.json."
            }
            self.ko_count += 1

    def check_mcp_server_up(self):
        self.steps_count += 1
        host = self.jqa_gr.mcp_host
        port = self.jqa_gr.mcp_port
        is_open = False
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                is_open = (s.connect_ex((host, port)) == 0)
        except Exception:
            is_open = False

        if is_open:
            self.status["mcp_server_up"] = {"status": "✅"}
        else:
            self.status["mcp_server_up"] = {
                "status": "❌",
                "message": f"MCP server is not responding on {host}:{port}."
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_git_lfs_availability()
        self.check_jqassistant_graph_rag_tool_availability()
        self.check_jqassistant_graph_rag_llm_model_availability()
        self.check_workspace_mcp_config()
        self.check_mcp_server_up()
        return self.generate_summary()
