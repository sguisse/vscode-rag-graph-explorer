import os
from abc import ABC, abstractmethod
from typing import Dict, Any

class EnvironmentContext:
    def __init__(self, workspace_root: str, configuration_matrix: Dict[str, Any]):
        self.workspace_root = os.path.abspath(workspace_root).replace("\\", "/")
        self.target_dir = f"{self.workspace_root}/.graph-rag-explorer/target"
        self.install_outputs_dir = f"{self.target_dir}/install_outputs"
        self.raw_outputs_dir = f"{self.target_dir}/raw_outputs"
        self.tools_dir = f"{self.target_dir}/tools"
        self.settings = configuration_matrix

    def get_tool_setting(self, tool_name: str, key: str, default: Any = None) -> Any:
        if tool_name in self.settings and isinstance(self.settings[tool_name], dict):
            return self.settings[tool_name].get(key, default)
        flat_key = f"graphRagExplorer.{tool_name}.{key}"
        return self.settings.get(flat_key, default)

class BaseCheckModule(ABC):
    def __init__(self, context: EnvironmentContext):
        self.context = context
        self.status = {}
        self.steps_count = 0
        self.ko_count = 0

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def execute_all_checks(self) -> Dict[str, Any]:
        pass

    def generate_summary(self) -> Dict[str, Any]:
        self.status["summary"] = {
            "globalStatus": "✅" if self.ko_count == 0 else "❌",
            "stepsCount": str(self.steps_count),
            "koCount": self.ko_count,
            "okCount": self.steps_count - self.ko_count
        }
        return self.status

class BaseInstallModule(ABC):
    def __init__(self, context: EnvironmentContext):
        self.context = context

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def execute_all_installations(self) -> None:
        pass
