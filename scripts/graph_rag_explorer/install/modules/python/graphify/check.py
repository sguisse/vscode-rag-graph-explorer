import shutil
from install.check import GraphRagExplorerCheck
from core.installer.registry import InstallerRegistry
from install.modules.python.graphify.context import (
    PYTHON_GRAPHIFY_MODULE_NAME,
    PythonGraphifyContext,
)


@InstallerRegistry.register_checker
class PythonGraphifyChecker(GraphRagExplorerCheck):
    def __init__(self, context):
        super().__init__(context)
        self.ctx = PythonGraphifyContext(context)

    @property
    def name(self) -> str:
        return PYTHON_GRAPHIFY_MODULE_NAME

    def check_uvx_runtime_utility(self):
        self.steps_count += 1
        if shutil.which("uvx"):
            self.status["uvx"] = {"status": "✅"}
        else:
            self.status["uvx"] = {"status": "⚠️", "message": "Optimized compilation layer binaries absent."}

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_uvx_runtime_utility()
        return self.generate_summary()