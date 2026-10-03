import os
from core.installer.context import BaseEnvironmentContext
from core.VsCodeSettings_gen import vsCodeSettings

GRAPH_RAG_EXPLORER_TOOL_NAME = "graph_rag_explorer"


class GraphRagExplorerContext(BaseEnvironmentContext):
    """Dedicated environment context implementation for graph_rag_explorer."""

    def __init__(self, tool_name: str = GRAPH_RAG_EXPLORER_TOOL_NAME):
        super().__init__(tool_name=tool_name)

        # System State
        self.is_windows = (os.name == 'nt')

        self.beScriptsPath = vsCodeSettings.backendWorkspacePath
        self.workspace_root = os.path.abspath(vsCodeSettings.workspaceRoot).replace("\\", "/")
        self.target_dir = f"{self.workspace_root}/{self.beScriptsPath}/target/graph_rag_explorer"
        self.tools_dir = f"{self.target_dir}/tools"
        self.install_reports_dir = f"{self.target_dir}/install_reports"
        self.raw_outputs_dir = f"{self.target_dir}/raw_outputs"
        self.ui_outputs_dir = f"{self.target_dir}/ui_outputs"

        self.pids_dir = f"{self.target_dir}/pids"
