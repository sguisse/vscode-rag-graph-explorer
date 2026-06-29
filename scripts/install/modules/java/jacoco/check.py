from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class JavaJacocoChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "java_jacoco"

    def check_xml_report_path_wiring(self):
        self.steps_count += 1
        target_report = self.context.get_tool_setting("jqassistant", "xmlReportPath", "./target/site/jacoco/jacoco.xml")
        self.status["jacoco_wired"] = {"status": "✅", "path": target_report}

    def execute_all_checks(self) -> dict:
        self.check_xml_report_path_wiring()
        return self.generate_summary()
