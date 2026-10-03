from core.installer.config import BaseConfigModule
from graph_rag_explorer.install.context import GraphRagExplorerContext


class GraphRagExplorerConfig(BaseConfigModule):
    """Subclass of BaseConfigModule specifically tailored for graph_rag_explorer tools."""

    def __init__(self, context: GraphRagExplorerContext, category: str):
        if not category or not str(category).strip():
            raise ValueError("Missing configuration value: category parameter is required for GraphRagExplorerConfig.")
        super().__init__(context=context, category=category)