import os
from install.base import BaseInstallModule
from install.registry import InstallerRegistry

from core.vscode_settings_4_backend import vsCodeSettings

CORE_MODULE_NAME = "01_system_core"

@InstallerRegistry.register_installer
class SystemCoreInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return CORE_MODULE_NAME

    def append_gitignore_exclusion(self):
        gi_path = f"{self.context.workspace_root}/.gitignore"
        content = ""
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                content = f.read()
        beScriptsPath = vsCodeSettings.get("beScriptsPath")
        if beScriptsPath not in content:
            with open(gi_path, "a", encoding="utf-8") as f:
                f.write(f"\n# [Graph RAG Explorer]\n{beScriptsPath}/\n")

    def execute_all_installations(self, installStatus=None) -> None:
        self.append_gitignore_exclusion()
