import os
from core.vscode_settings_4_backend import vsCodeSettings
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class EnvironmentContext:
    def __init__(self):
        self.workspace_root = os.path.abspath(vsCodeSettings.get("workspaceRoot")).replace("\\", "/")
        self.target_dir = f"{self.workspace_root}/{vsCodeSettings.get('beScriptsPath')}/target"
        self.install_reports_dir = f"{self.target_dir}/install_reports"
        self.raw_outputs_dir = f"{self.target_dir}/raw_outputs"
        self.tools_dir = f"{self.target_dir}/tools"
        self.pids_dir = f"{self.target_dir}/pids"

    def get_vscode_setting(self, key_part_1: str, key_part_2: str = "", default: Any = None) -> Any:
        flat_key = f"{key_part_1}.{key_part_2}" if key_part_2 else key_part_1
        value = vsCodeSettings.get(flat_key)
        if value is None and key_part_2:
           flat_key = f"{key_part_1}_{key_part_2}"
           value = vsCodeSettings.get(flat_key, default)

        return value

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
    def execute_all_installations(self, installStatus: Optional[Dict[str, Any]] = None) -> None:
        pass
