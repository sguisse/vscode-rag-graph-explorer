import os
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.system.core.install import CORE_MODULE_NAME

from core.vscode_settings_4_backend import vsCodeSettings

@InstallerRegistry.register_checker
class SystemCoreChecker(BaseCheckModule):
    @property
    def name(self) -> str: return CORE_MODULE_NAME

    def check_gitignore_rule(self):
        self.steps_count += 1
        gi_path = f"{self.context.workspace_root}/.gitignore"
        has_rule = False
        beScriptsPath = vsCodeSettings.get("beScriptsPath")
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                if beScriptsPath in f.read():
                    has_rule = True

        if has_rule:
            self.status["gitignore_rule_mapped"] = {"status": "✅"}
        else:
            self.status["gitignore_rule_mapped"] = {"status": "❌", "message": f"{beScriptsPath} exclusion pattern unlisted."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_gitignore_rule()
        return self.generate_summary()
