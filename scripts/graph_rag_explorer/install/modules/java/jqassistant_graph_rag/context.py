import os
from core.VsCodeSettings_gen import vsCodeSettings
from graph_rag_explorer.install.context import GraphRagExplorerContext

JAVA_JQASSISTANT_GRAPH_RAG_MODULE_NAME = "java_jqassistant_graph_rag"


class JQAssistantGraphRagContext(GraphRagExplorerContext):
    def __init__(self, ctx: GraphRagExplorerContext):
        super().__init__(tool_name=ctx.tool_name)
        # We pass the global GraphRagExplorerContext to derive specific paths
        self.version = vsCodeSettings.graphRagExplorer.jqassistant.version
        self.raw_outputs_dir = f"{self.raw_outputs_dir}/java"
        self.tools_dir = f"{self.tools_dir}/java/jqassistant-graph-rag"
        self.tools_git_clone = f"{self.tools_dir}/git-clone"
        self.tools_models_dir = f"{self.tools_git_clone}/models"

        self.install_dir = f"{self.beScriptsPath}/scripts/graph_rag_explorer/install/modules/java/jqassistant_graph_rag"
        self.templates_dir = f"{self.install_dir}/config/templates"
        self.mcp_server_template_path = f"{self.templates_dir}/mcp-server-template.json"
        self.git_clone_dir = f"{self.install_dir}/git-clone"

        self.llm_download_url = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.downloadUrl
        self.llm_model_name = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.model

        self.mcp_server_key = "jqassistant-graph-rag"
        self.mcp_host = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.mcp.host
        self.mcp_port = vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.mcp.port