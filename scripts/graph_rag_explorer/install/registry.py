import os
import sys
import importlib.util
from typing import List, Type
from install.base import BaseCheckModule, BaseInstallModule
from core.utils import info, error

class InstallerRegistry:
    _checker_classes: List[Type[BaseCheckModule]] = []
    _installer_classes: List[Type[BaseInstallModule]] = []

    @classmethod
    def register_checker(cls, checker_cls: Type[BaseCheckModule]):
        cls._checker_classes.append(checker_cls)
        return checker_cls

    @classmethod
    def register_installer(cls, installer_cls: Type[BaseInstallModule]):
        cls._installer_classes.append(installer_cls)
        return installer_cls

    @classmethod
    def get_checkers(cls) -> List[Type[BaseCheckModule]]:
        return cls._checker_classes

    @classmethod
    def get_installers(cls) -> List[Type[BaseInstallModule]]:
        return cls._installer_classes

    @classmethod
    def discover_and_load_checkers_and_installers(cls, install_root_dir: str):
        cls._checker_classes.clear()
        cls._installer_classes.clear()

        info(f"Discovering and loading checkers and installers from: {install_root_dir}", component="InstallerRegistry")
        for root, _, files in os.walk(install_root_dir):
            for target_file in ["check.py", "install.py"]:
                if target_file in files:
                    info(f"Found {target_file} in {root}. Attempting to load...", component="InstallerRegistry")
                    file_path = os.path.join(root, target_file)
                    rel_path = os.path.relpath(file_path, install_root_dir)
                    rel_no_ext = rel_path[:-3] if rel_path.endswith(".py") else rel_path
                    module_name = "install." + rel_no_ext.replace(os.sep, ".")

                    spec = importlib.util.spec_from_file_location(module_name, file_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        sys.modules[module_name] = module
                        try:
                            spec.loader.exec_module(module)
                        except Exception as e:
                            error(f"Failed to load module {module_name} from {file_path}: {e}", component="InstallerRegistry")
