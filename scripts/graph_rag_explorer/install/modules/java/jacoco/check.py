from install.check import GraphRagExplorerCheck
from core.installer.registry import InstallerRegistry
from install.modules.java.jacoco.context import JACOCO_MODULE_NAME, JacocoContext

@InstallerRegistry.register_checker
class JavaJacocoChecker(GraphRagExplorerCheck):
    def __init__(self, context):
        super().__init__(context)
        self.jacoco_ctx = JacocoContext()

    @property
    def name(self) -> str: return JACOCO_MODULE_NAME

    def check_xml_report_path_wiring(self):
        self.steps_count += 1
        target_report = self.jacoco_ctx.xml_report_path
        self.status["jacoco_wired"] = {"status": "✅", "path": target_report}

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_xml_report_path_wiring()
        return self.generate_summary()
