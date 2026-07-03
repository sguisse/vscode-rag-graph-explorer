import os

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from core.context import EnvironmentContext

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
