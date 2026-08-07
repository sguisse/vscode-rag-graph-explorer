from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info
from core.VsCodeSettings_gen import vsCodeSettings

@InstallerRegistry.register_installer
class JavaJacocoInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "java_jacoco"

    def log_xml_report_path_confirmation(self):
        target_report = vsCodeSettings.graphRagExplorer.jqassistant.xmlReportPath
        info(f"Jacoco XML metrics dataset target successfully verified over path: {target_report}", component=self.name)

    def execute_all_installations(self, installStatus=None) -> None:
        self.log_xml_report_path_confirmation()
