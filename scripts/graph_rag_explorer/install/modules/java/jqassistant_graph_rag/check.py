from typing import cast
import shutil
import os
import subprocess
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
            # check folder model is not empty
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

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_jqassistant_graph_rag_tool_availability()
        self.check_jqassistant_graph_rag_llm_model_availability()
        self.check_workspace_mcp_config()
        return self.generate_summary()
