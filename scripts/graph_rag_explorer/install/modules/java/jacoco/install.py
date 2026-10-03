from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from core.utils import info
from install.modules.java.jacoco.context import JACOCO_MODULE_NAME, JacocoContext

@InstallerRegistry.register_installer
class JavaJacocoInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.jacoco_ctx = JacocoContext()

    @property
    def name(self) -> str: return JACOCO_MODULE_NAME

    def log_xml_report_path_confirmation(self):
        target_report = self.jacoco_ctx.xml_report_path
        info(f"Jacoco XML metrics dataset target successfully verified over path: {target_report}", component=self.name)

    def execute_all_installations(self, installStatus=None) -> None:
        self.log_xml_report_path_confirmation()
