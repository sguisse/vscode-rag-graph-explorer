from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from install.modules.python.graphify.context import (
    PYTHON_GRAPHIFY_MODULE_NAME,
    PythonGraphifyContext,
)
from core.utils import info
from core.VsCodeSettings_gen import vsCodeSettings


@InstallerRegistry.register_installer
class PythonGraphifyInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.ctx = PythonGraphifyContext(context)

    @property
    def name(self) -> str:
        return PYTHON_GRAPHIFY_MODULE_NAME

    def verify_graphify_arguments_setting(self):
        graphify_args = vsCodeSettings.graphRagExplorer.graphify.arguments
        info(f"Injecting background python graphify execution parameter matrices: {graphify_args}", component=self.name)

    def execute_all_installations(self, installStatus=None) -> None:
        self.verify_graphify_arguments_setting()