import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class SystemCoreChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "system_core"

    def check_gitignore_rule(self):
        self.steps_count += 1
        gi_path = f"{self.context.workspace_root}/.gitignore"
        has_rule = False
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                if ".graph-rag-explorer" in f.read():
                    has_rule = True

        if has_rule:
            self.status["gitignore_rule_mapped"] = {"status": "✅"}
        else:
            self.status["gitignore_rule_mapped"] = {"status": "❌", "message": ".graph-rag-explorer exclusion pattern unlisted."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.check_gitignore_rule()
        return self.generate_summary()
