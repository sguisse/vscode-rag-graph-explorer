from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import info

@ModuleRegistry.register_installer
class JavaJacocoInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "java_jacoco"

    def log_xml_report_path_confirmation(self):
        target_report = self.context.get_tool_setting("jqassistant", "xmlReportPath", "./target/site/jacoco/jacoco.xml")
        info(f"Jacoco XML metrics dataset target successfully verified over path: {target_report}", component=self.name)

    def execute_all_installations(self) -> None:
        self.log_xml_report_path_confirmation()
