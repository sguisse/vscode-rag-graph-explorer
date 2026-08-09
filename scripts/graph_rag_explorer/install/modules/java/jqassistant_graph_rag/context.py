import os
from typing import Any
from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info
from core.context import EnvironmentContext


class JQAssistantGraphRagContext:
    def __init__(self, ctx: EnvironmentContext):
        # We pass the global EnvironmentContext to derive specific paths
        self.version = vsCodeSettings.graphRagExplorer.jqassistant.version
        self.raw_outputs_dir = f"{ctx.raw_outputs_dir}/java"
        self.tools_dir = f"{ctx.tools_dir}/java/jqassistant-graph-rag"
        self.config_dir = f"{self.tools_dir}/config"

        self.templates_dir = f"{ctx.beScriptsPath}/scripts/graph_rag_explorer/install/modules/java/jqassistant_graph_rag/config/templates"
        self.mcp_server_template_path = os.path.join(self.templates_dir, "mcp-server-template.json")

        self.llm_download_url = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.downloadUrl
        self.llm_model_name = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.model

        self.mcp_server_key = "jqassistant-graph-rag"
        self.mcp_host = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.mcp.host
        self.mcp_port = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.mcp.port
