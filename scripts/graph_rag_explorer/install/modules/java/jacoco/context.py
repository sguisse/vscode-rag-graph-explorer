from graph_rag_explorer.install.context import GraphRagExplorerContext
from core.VsCodeSettings_gen import vsCodeSettings

JACOCO_MODULE_NAME = "java_jacoco"


class JacocoContext(GraphRagExplorerContext):
    def __init__(self):
        super().__init__()
        self.xml_report_path = vsCodeSettings.graphRagExplorer.jqassistant.xmlReportPath
