import shutil
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class PythonGraphifyChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "python_graphify"

    def check_uvx_runtime_utility(self):
        self.steps_count += 1
        if shutil.which("uvx"): self.status["uvx"] = {"status": "✅"}
        else: self.status["uvx"] = {"status": "⚠️", "message": "Optimized compilation layer binaries absent."}

    def execute_all_checks(self) -> dict:
        self.check_uvx_runtime_utility()
        return self.generate_summary()
