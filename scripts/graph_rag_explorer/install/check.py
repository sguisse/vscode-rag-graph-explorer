from core.installer.check import BaseCheckModule
from graph_rag_explorer.install.context import GraphRagExplorerContext


class GraphRagExplorerCheck(BaseCheckModule):
    def __init__(self, context: GraphRagExplorerContext):
        super().__init__(context)
