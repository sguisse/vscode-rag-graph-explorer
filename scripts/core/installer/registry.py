import os
import sys
import importlib.util
from typing import List, Type
from core.installer.config import BaseConfigModule
from core.installer.check import BaseCheckModule
from core.installer.install import BaseInstallModule
from core.utils import info, success, error


class InstallerRegistry:
    _configurator_classes: List[Type[BaseConfigModule]] = []
    _checker_classes: List[Type[BaseCheckModule]] = []
    _installer_classes: List[Type[BaseInstallModule]] = []

    @classmethod
    def register_configurator(cls, configurator_cls: Type[BaseConfigModule]):
        cls._configurator_classes.append(configurator_cls)
        return configurator_cls

    @classmethod
    def register_checker(cls, checker_cls: Type[BaseCheckModule]):
        cls._checker_classes.append(checker_cls)
        return checker_cls

    @classmethod
    def register_installer(cls, installer_cls: Type[BaseInstallModule]):
        cls._installer_classes.append(installer_cls)
        return installer_cls

    @classmethod
    def get_configurators(cls) -> List[Type[BaseConfigModule]]:
        return cls._configurator_classes

    @classmethod
    def get_checkers(cls) -> List[Type[BaseCheckModule]]:
        return cls._checker_classes

    @classmethod
    def get_installers(cls) -> List[Type[BaseInstallModule]]:
        return cls._installer_classes

    @classmethod
    def discover_and_load_checkers_and_installers(cls, install_root_dir: str):
        """Discovers and loads config.py, check.py, and install.py files from the given module directory."""
        cls._configurator_classes.clear()
        cls._checker_classes.clear()
        cls._installer_classes.clear()

        info(f"Discovering and loading configurators, checkers, and installers from: {install_root_dir}", component="InstallerRegistry")
        failed_modules: List[str] = []
        for root, _, files in os.walk(install_root_dir):
            for target_file in ["config.py", "check.py", "install.py"]:
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
                            failed_modules.append(module_name)
                            error(f"Failed to load module {module_name} from {file_path}: {e}", component="InstallerRegistry")
                    else:
                        failed_modules.append(module_name)
                        error(f"Unable to build an import spec for {module_name} from {file_path}", component="InstallerRegistry")

        summary = f"{len(cls._configurator_classes)} configurator(s), {len(cls._checker_classes)} checker(s), and {len(cls._installer_classes)} installer(s) registered."
        if failed_modules:
            error(f"{summary} {len(failed_modules)} module(s) failed to load: {', '.join(failed_modules)}", component="InstallerRegistry")
        else:
            success(summary, component="InstallerRegistry")