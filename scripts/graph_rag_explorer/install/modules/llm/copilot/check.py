import os
import shutil
import subprocess
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.llm.copilot.constants import (
    MODULE_NAME,
    get_copilot_binary_name,
    get_platform_target,
    FORCE_INSTALL,
)

@InstallerRegistry.register_checker
class LlmCopilotChecker(BaseCheckModule):
    @property
    def name(self) -> str:
        return MODULE_NAME

    def check_copilot_binary_presence(self):
        self.steps_count += 1

        if FORCE_INSTALL:
            self.status["copilot_binary"] = {
                "status": "❌",
                "message": "Force install flag (FORCE_INSTALL) is enabled in constants.py."
            }
            self.ko_count += 1
            return

        bin_name = get_copilot_binary_name()
        platform_target = get_platform_target()

        local_bin_path = os.path.join(self.context.tools_dir, "copilot", platform_target, bin_name)
        system_bin_path = shutil.which("copilot")

        target_path = local_bin_path if os.path.exists(local_bin_path) else system_bin_path

        if target_path and os.path.exists(target_path):
            self.status["copilot_binary"] = {
                "status": "✅",
                "path": target_path
            }
        else:
            self.status["copilot_binary"] = {
                "status": "❌",
                "message": f"GitHub Copilot CLI binary missing at {local_bin_path} and not in PATH."
            }
            self.ko_count += 1

    def check_copilot_binary_execution(self):
        self.steps_count += 1
        bin_status = self.status.get("copilot_binary", {})
        if bin_status.get("status") != "✅":
            self.status["copilot_execution"] = {
                "status": "❌",
                "message": "Skipped execution verification due to missing or forced-reinstall CLI binary."
            }
            self.ko_count += 1
            return

        bin_path = bin_status.get("path")
        try:
            res = subprocess.run([bin_path, "--version"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0 or "copilot" in res.stdout.lower() or "copilot" in res.stderr.lower():
                self.status["copilot_execution"] = {
                    "status": "✅",
                    "version": res.stdout.strip() or "active"
                }
            else:
                self.status["copilot_execution"] = {
                    "status": "❌",
                    "message": f"CLI execution check failed with exit code {res.returncode}: {res.stderr.strip()}"
                }
                self.ko_count += 1
        except Exception as e:
            self.status["copilot_execution"] = {
                "status": "❌",
                "message": f"CLI execution error: {e}"
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_copilot_binary_presence()
        self.check_copilot_binary_execution()
        return self.generate_summary()
