import os
from install.base import BaseInstallModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_installer
class SystemCoreInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "system_core"

    def append_gitignore_exclusion(self):
        gi_path = f"{self.context.workspace_root}/.gitignore"
        content = ""
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                content = f.read()
        if ".graph-rag-explorer" not in content:
            with open(gi_path, "a", encoding="utf-8") as f:
                f.write("\n# [Graph RAG Explorer]\n.graph-rag-explorer/\n")

    def execute_all_installations(self) -> None:
        self.append_gitignore_exclusion()
