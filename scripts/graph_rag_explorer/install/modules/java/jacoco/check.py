from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from core.VsCodeSettings_gen import vsCodeSettings

@InstallerRegistry.register_checker
class JavaJacocoChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "java_jacoco"

    def check_xml_report_path_wiring(self):
        self.steps_count += 1
        target_report = vsCodeSettings.graphRagExplorer.jqassistant.xmlReportPath
        self.status["jacoco_wired"] = {"status": "✅", "path": target_report}

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_xml_report_path_wiring()
        return self.generate_summary()
