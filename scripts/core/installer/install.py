from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from core.installer.context import BaseEnvironmentContext


class BaseInstallModule(ABC):
    def __init__(self, context: BaseEnvironmentContext):
        self.context = context

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def execute_all_installations(self, installStatus: Optional[Dict[str, Any]] = None) -> None:
        pass
