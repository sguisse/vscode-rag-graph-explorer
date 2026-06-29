from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import info

@ModuleRegistry.register_installer
class PythonGraphifyInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "python_graphify"

    def verify_graphify_arguments_setting(self):
        graphify_args = self.context.get_tool_setting("graphify", "arguments", "--deep-scan")
        info(f"Injecting background python graphify execution parameter matrices: {graphify_args}", component=self.name)

    def execute_all_installations(self) -> None:
        self.verify_graphify_arguments_setting()
