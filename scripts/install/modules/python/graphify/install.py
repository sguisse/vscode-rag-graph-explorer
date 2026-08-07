from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info
from core.vscode_settings_4_backend import vsCodeSettings

@InstallerRegistry.register_installer
class PythonGraphifyInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "python_graphify"

    def verify_graphify_arguments_setting(self):
        graphify_args = vsCodeSettings.graphRagExplorer.graphify.arguments
        info(f"Injecting background python graphify execution parameter matrices: {graphify_args}", component=self.name)

    def execute_all_installations(self, installStatus=None) -> None:
        self.verify_graphify_arguments_setting()
