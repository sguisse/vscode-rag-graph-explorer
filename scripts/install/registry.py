import os
import sys
import importlib.util
from typing import List, Type
from install.base import BaseCheckModule, BaseInstallModule

class ModuleRegistry:
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
    def discover_and_load_lifecycle_nodes(cls, install_root_dir: str):
        cls._checker_classes.clear()
        cls._installer_classes.clear()
        for root, _, files in os.walk(install_root_dir):
            for target_file in ["check.py", "install.py"]:
                if target_file in files:
                    file_path = os.path.join(root, target_file)
                    rel_path = os.path.relpath(file_path, install_root_dir)
                    module_name = "install." + rel_path.replace(os.sep, ".").rstrip(".py")

                    spec = importlib.util.spec_from_file_location(module_name, file_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        sys.modules[module_name] = module
                        try:
                            spec.loader.exec_module(module)
                        except Exception as e:
                            sys.stderr.write(f"[-] Failed loading dynamic sequence node {file_path}: {e}\n")
