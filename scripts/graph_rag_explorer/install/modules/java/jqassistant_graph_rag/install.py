import os
import sys
import ssl
import json
import re
import shutil
import urllib.request
import urllib.error
from typing import Optional
from pathlib import Path
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info, success, error, warn
from core.sources_discovery import discover_workspace_sources
from graph_rag_explorer.install.modules.java.jqassistant_graph_rag.check import JQAssistantGraphRagChecker
from graph_rag_explorer.install.modules.java.jqassistant_graph_rag.tools.graph_rag_llm_model_dwn import download_graph_rag_llm_model
from graph_rag_explorer.install.modules.java.jqassistant_graph_rag.context import JQAssistantGraphRagContext
from core.VsCodeSettings_gen import vsCodeSettings
from graph_rag_explorer.install.utils.py_venv_install import venv_install


@InstallerRegistry.register_installer
class JQAssistantGraphRagInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.jqa_gr = JQAssistantGraphRagContext(context)

        self._last_reported_percent = -5

    @property
    def name(self) -> str: return "java_jqassistant_graph_rag"

    def install_jqassistant_graph_rag_tool(self):
        source_path = Path(self.jqa_gr.git_clone_dir)
        target_path = Path(self.jqa_gr.tools_git_clone)

        if not os.path.exists(source_path):
            error(f"Source tool directory missing at {source_path}", component=self.name)
            return

        info(f"Installing jqassistant-graph-rag tool from {source_path} to {target_path}...", component=self.name)
        os.makedirs(target_path, exist_ok=True)
        shutil.copytree(source_path, target_path, dirs_exist_ok=True)

        info(f"Installing jqassistant-graph-rag tool dedicated python environment...", component=self.name)
        venv_install(target_path)

        success(f"jqassistant_graph_rag tool installed successfully into {target_path}", component=self.name)


    def fetch_and_install_jqassistant_graph_rag_llm_model(self):
        targetPath = f"{self.jqa_gr.tools_models_dir}/{self.jqa_gr.llm_model_name}"
        if not os.path.exists(targetPath):
            os.makedirs(targetPath, exist_ok=True)

        download_url = f"{self.jqa_gr.llm_download_url}/{self.jqa_gr.llm_model_name}"
        info(f"Downloading GraphRag LLM model from {download_url} to {targetPath} …", component=self.name)

        download_graph_rag_llm_model(download_url=download_url, downloadTargetPath=Path(targetPath))
        success(f"GraphRag LLM model installed successfully into {targetPath}", component=self.name)

    def inject_mcp_server_config(self):
        mcp_dir = os.path.join(self.context.workspace_root, ".vscode")
        os.makedirs(mcp_dir, exist_ok=True)
        mcp_path = os.path.join(mcp_dir, "mcp.json")

        if not os.path.exists(self.jqa_gr.mcp_server_template_path):
            error("MCP Server template missing from installer resources.", component=self.name)
            return

        with open(self.jqa_gr.mcp_server_template_path, "r", encoding="utf-8") as f:
            template_content = f.read()

        template_content = template_content.replace("{{JQA_MCP_HOST}}", str(self.jqa_gr.mcp_host)).replace("{{JQA_MCP_PORT}}", str(self.jqa_gr.mcp_port))

        try:
            template_data = json.loads(template_content)
        except json.JSONDecodeError as e:
            error(f"Malformed MCP template JSON: {e}", component=self.name)
            return

        mcp_data = {}
        if os.path.exists(mcp_path):
            try:
                with open(mcp_path, "r", encoding="utf-8") as f:
                    mcp_data = json.load(f)
            except json.JSONDecodeError:
                warn("Existing .vscode/mcp.json is malformed. Overwriting.", component=self.name)

        if "servers" not in mcp_data:
            mcp_data["servers"] = {}

        if self.jqa_gr.mcp_server_key in template_data:
            mcp_data["servers"][self.jqa_gr.mcp_server_key] = template_data[self.jqa_gr.mcp_server_key]
        elif "servers" in template_data and self.jqa_gr.mcp_server_key in template_data["servers"]:
            mcp_data["servers"][self.jqa_gr.mcp_server_key] = template_data["servers"][self.jqa_gr.mcp_server_key]

        with open(mcp_path, "w", encoding="utf-8") as f:
            json.dump(mcp_data, f, indent=4)
        success(f"MCP server config injected successfully into {mcp_path}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations. """
        checker = JQAssistantGraphRagChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("jqassistant_graph_rag_tool", {}).get("status") != "✅":
            self.install_jqassistant_graph_rag_tool()

        if installStatus.get("jqassistant_graph_rag_llm_model", {}).get("status") != "✅":
            self.fetch_and_install_jqassistant_graph_rag_llm_model()

        if installStatus.get("mcp_server_config", {}).get("status") != "✅":
            self.inject_mcp_server_config()
