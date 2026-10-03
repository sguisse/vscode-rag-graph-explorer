import os
from graph_rag_explorer.install.context import GraphRagExplorerContext


class NodeContext(GraphRagExplorerContext):
    def __init__(self, ctx: GraphRagExplorerContext):
        super().__init__(tool_name=ctx.tool_name)
        # We pass the global GraphRagExplorerContext to derive specific paths
        self.node_env_path = f"{self.tools_dir}/node"
