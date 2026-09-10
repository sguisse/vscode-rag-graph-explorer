import os
import shutil
import subprocess
from typing import Optional, Dict, Any

from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info, success, error, warn
from install.modules.llm.copilot.constants import (
    MODULE_NAME,
    get_copilot_binary_name,
    get_platform_target,
    FORCE_INSTALL,
)

@InstallerRegistry.register_installer
class LlmCopilotInstaller(BaseInstallModule):
    @property
    def name(self) -> str:
        return MODULE_NAME

    def install_copilot_cli(self):
        platform_target = get_platform_target()
        bin_name = get_copilot_binary_name()
        target_dir = os.path.join(self.context.tools_dir, "copilot", platform_target)
        target_bin_path = os.path.join(target_dir, bin_name)

        info(f"Installing GitHub Copilot CLI binary for platform target [{platform_target}]...", component=self.name)
        os.makedirs(target_dir, exist_ok=True)

        try:
            pkg_name = f"@github/copilot-{platform_target}"
            info(f"Downloading package {pkg_name} into local tool directory...", component=self.name)

            cmd = f'npm install {pkg_name}@1.0.11 --no-save --prefix "{target_dir}"'
            subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

            npm_bin_location = os.path.join(target_dir, "node_modules", "@github", f"copilot-{platform_target}", bin_name)
            if os.path.exists(npm_bin_location):
                if os.path.exists(target_bin_path):
                    os.remove(target_bin_path)
                shutil.move(npm_bin_location, target_bin_path)

                if os.name != "nt":
                    os.chmod(target_bin_path, 0o755)

                shutil.rmtree(os.path.join(target_dir, "node_modules"), ignore_errors=True)
                lock_file = os.path.join(target_dir, "package-lock.json")
                if os.path.exists(lock_file):
                    os.remove(lock_file)

                success(f"Copilot CLI binary installed successfully at: {target_bin_path}", component=self.name)
            else:
                error(f"Downloaded binary not found at path: {npm_bin_location}", component=self.name)

        except Exception as e:
            error(f"Failed to download and extract Copilot CLI binary: {e}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[Dict[str, Any]] = None) -> None:
        if installStatus is None:
            from install.modules.llm.copilot.check import LlmCopilotChecker
            checker = LlmCopilotChecker(self.context)
            installStatus = checker.execute_all_checks()

        if FORCE_INSTALL or installStatus.get("copilot_binary", {}).get("status") != "✅":
            self.install_copilot_cli()
