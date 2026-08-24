import os
import sys
from install.modules.system.core.constants import KEY_GITIGNORE_RULE_MAPPED
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import error, info

from core.VsCodeSettings_gen import vsCodeSettings
from install.modules.system.core.constants import (
    CORE_MODULE_NAME,
    STATUS_OK,
    PREREQUISITES_VERIFY_LIST,
)


@InstallerRegistry.register_installer
class SystemCoreInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)

    @property
    def name(self) -> str:
        return CORE_MODULE_NAME

    def stop_installation(self) -> None:
        error("Installation process stopped due to missing prerequisites.", component=self.name)
        sys.exit(-1)

    def append_gitignore_exclusion(self):
        gi_path = f"{self.context.workspace_root}/.gitignore"
        content = ""
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                content = f.read()
        beScriptsPath = vsCodeSettings.backendWorkspacePath
        if beScriptsPath not in content:
            with open(gi_path, "a", encoding="utf-8") as f:
                f.write(f"\n# [Graph RAG Explorer]\n{beScriptsPath}/\n")

    def execute_all_installations(self, installStatus=None) -> None:
        if installStatus is None:
            raise ValueError("installStatus cannot be None. Please provide the installation status dictionary.")

        info("Start verifying prerequisites...", component=self.name)
        missing_tools = []
        for key, tool_name in PREREQUISITES_VERIFY_LIST:
            if installStatus.get(key, {}).get("status") != STATUS_OK:
                missing_tools.append(tool_name)

        if missing_tools:
            error(
                f"Missing required tools: {', '.join(missing_tools)}. "
                "At least all these tools should be installed before using « Token Razor ».",
                component=self.name
            )
            self.stop_installation()

        info("Start append gitignore exclusion...", component=self.name)
        if installStatus.get(KEY_GITIGNORE_RULE_MAPPED, {}).get("status") != STATUS_OK:
          self.append_gitignore_exclusion()

        info("System core installation completed successfully.", component=self.name)
