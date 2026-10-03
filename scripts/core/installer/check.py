from abc import ABC, abstractmethod
from typing import Dict, Any
from core.installer.context import BaseEnvironmentContext


class BaseCheckModule(ABC):
    def __init__(self, context: BaseEnvironmentContext):
        self.context = context
        self.status: Dict[str, Any] = {}
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
            "okCount": self.steps_count - self.ko_count,
        }
        return self.status
