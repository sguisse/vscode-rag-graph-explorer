#!/usr/bin/env bash
set -e

mkdir -p scripts/graph_rag_explorer/install/modules/java/jqassistant_graph_rag

cat << 'EOF' > scripts/graph_rag_explorer/install/modules/java/jqassistant_graph_rag/install.py
import os
import sys
import ssl
import json
import re
import shutil
import socket
import time
import subprocess
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
from graph_rag_explorer.install.utils.py_venv_install import venv_install, get_venv_python


def is_port_open(port: int, host: str = "127.0.0.1") -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


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

    def start_mcp_server(self) -> bool:
        grd = Path(self.jqa_gr.tools_git_clone)
        venv_path = grd / ".venv"
        py = get_venv_python(venv_path) or get_venv_python(grd) or Path(sys.executable)

        info(f"▶ Starting MCP server (port {self.jqa_gr.mcp_port}) …", component=self.name)
        info(f"   Graph RAG tool path: {grd}", component=self.name)
        info(f"   Using Python       : {py}", component=self.name)

        result = subprocess.run([str(py), "-c", "import fastmcp"], capture_output=True)
        if result.returncode != 0:
            error(f"❌ fastmcp not importable with {py}", component=self.name)
            if result.stderr:
                error(result.stderr.decode("utf-8", errors="replace")[:1000], component=self.name)
            return False

        env = os.environ.copy()
        env["MCP_PORT"] = str(self.jqa_gr.mcp_port)
        env["PROJECT_ROOT_PATH"] = str(self.context.workspace_root)

        model_path = Path(self.jqa_gr.tools_models_dir) / self.jqa_gr.llm_model_name
        if model_path.exists():
            env["SENTENCE_TRANSFORMER_MODEL"] = str(model_path)
            info(f"   Using local model  : {model_path}", component=self.name)

        mcp_py = grd / "mcp_server.py"
        if not mcp_py.exists():
            error(f"❌ MCP server script missing at {mcp_py}", component=self.name)
            return False

        log_dir = os.path.join(self.context.workspace_root, vsCodeSettings.backendWorkspacePath, "logs")
        pids_dir = os.path.join(self.context.workspace_root, vsCodeSettings.backendWorkspacePath, "target", "pids")
        os.makedirs(log_dir, exist_ok=True)
        os.makedirs(pids_dir, exist_ok=True)

        log_path = Path(log_dir) / "mcp_server.log"
        pid_path = Path(pids_dir) / "mcp_server.pid"

        neo4j_cfg = vsCodeSettings.graphRagExplorer.neo4j
        neo4j_uri = neo4j_cfg.uri
        if "${" in neo4j_uri:
            neo4j_uri = f"bolt://{neo4j_cfg.host}:{neo4j_cfg.port.bolt}"

        info("⏳ MCP server start in progress …", component=self.name)
        try:
            log_fh = open(log_path, "a", encoding="utf-8")
            args = [
                str(py),
                str(mcp_py),
                "--port",
                str(self.jqa_gr.mcp_port),
                "--uri",
                neo4j_uri,
                "--user",
                neo4j_cfg.username,
                "--password",
                neo4j_cfg.password,
            ]
            kwargs = {
                "cwd": str(grd),
                "stdout": log_fh,
                "stderr": log_fh,
                "env": env,
            }
            if os.name == 'nt':
                kwargs["creationflags"] = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 512)
            else:
                kwargs["start_new_session"] = True

            proc = subprocess.Popen(args, **kwargs)
            pid_path.write_text(str(proc.pid), encoding="utf-8")
        except Exception as e:
            error(f"❌ Failed to spawn MCP server process: {e}", component=self.name)
            return False

        for _ in range(30):
            if proc.poll() is not None:
                tail = "(no log available)"
                try:
                    if log_path.exists():
                        with open(log_path, "r", encoding="utf-8", errors="replace") as lf:
                            lines = lf.readlines()
                            tail = "".join(lines[-200:])
                except Exception:
                    tail = "(failed to read log)"
                error(f"❌ MCP process exited unexpectedly (PID {proc.pid}). See logs:\n{tail}", component=self.name)
                if pid_path.exists():
                    try:
                        pid_path.unlink()
                    except Exception:
                        pass
                return False

            if is_port_open(self.jqa_gr.mcp_port, self.jqa_gr.mcp_host):
                success(f"✅ MCP server ready on port {self.jqa_gr.mcp_port} (PID {proc.pid})", component=self.name)
                info(f"Logs: {log_path}", component=self.name)
                return True
            time.sleep(1)

        tail = "(no log available)"
        try:
            if log_path.exists():
                with open(log_path, "r", encoding="utf-8", errors="replace") as lf:
                    lines = lf.readlines()
                    tail = "".join(lines[-200:])
        except Exception:
            tail = "(failed to read log)"

        error(f"❌ MCP port {self.jqa_gr.mcp_port} did not open in 30 s — check {log_path}\nLast log lines:\n{tail}", component=self.name)
        return False

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

        if installStatus.get("mcp_server_up", {}).get("status") != "✅":
            self.start_mcp_server()
EOF

echo "✅ fix: Resolved virtualenv Python resolution by targeting the '.venv' directory inside the tool git-clone root."
