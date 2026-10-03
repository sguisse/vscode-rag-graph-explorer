from graph_rag_explorer.install.context import GraphRagExplorerContext

PYTHON_GRAPHIFY_MODULE_NAME = "python_graphify"


class PythonGraphifyContext(GraphRagExplorerContext):
    def __init__(self, context: GraphRagExplorerContext):
        super().__init__(tool_name=context.tool_name)
        self.module_name = PYTHON_GRAPHIFY_MODULE_NAME
        self.raw_outputs_dir = f"{self.raw_outputs_dir}/python/graphify"
        self.tools_dir = f"{self.tools_dir}/python/graphify"