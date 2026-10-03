from core.installer.install import BaseInstallModule
from graph_rag_explorer.install.context import GraphRagExplorerContext


class GraphRagExplorerInstall(BaseInstallModule):
    def __init__(self, context: GraphRagExplorerContext):
        super().__init__(context)
