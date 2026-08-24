import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional
from install.base import BaseCheckModule
from install.registry import InstallerRegistry

from core.VsCodeSettings_gen import vsCodeSettings
from install.modules.system.core.constants import (
    CORE_MODULE_NAME,
    STATUS_OK,
    STATUS_KO,
    KEY_PYTHON3_PREREQUISITE,
    KEY_PIP_PREREQUISITE,
    KEY_NODE_PREREQUISITE,
    KEY_NPM_PREREQUISITE,
    KEY_JAVA_PREREQUISITE,
    KEY_GITIGNORE_RULE_MAPPED,
)


def resolve_binary_path(cmd: str) -> Optional[str]:
    """Finds binary path considering standard system PATH, Volta, Homebrew, NVM, etc."""
    home = Path.home()
    extra_paths = [
        os.path.join(os.environ.get("VOLTA_HOME", str(home / ".volta")), "bin"),
        "/opt/homebrew/bin",
        "/usr/local/bin",
        str(home / ".fnm" / "current" / "bin"),
        str(home / ".n" / "bin"),
    ]

    current_path = os.environ.get("PATH", "")
    path_list = current_path.split(os.pathsep)

    updated = False
    for p in extra_paths:
        if os.path.exists(p) and p not in path_list:
            path_list.insert(0, p)
            updated = True

    if updated:
        os.environ["PATH"] = os.pathsep.join(path_list)

    return shutil.which(cmd)


@InstallerRegistry.register_checker
class SystemCoreChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)

    @property
    def name(self) -> str:
        return CORE_MODULE_NAME

    def check_system_prerequisites(self):
        tools_to_check = [
            ("python3", ["--version"], KEY_PYTHON3_PREREQUISITE),
            ("pip3" if resolve_binary_path("pip3") else "pip", ["--version"], KEY_PIP_PREREQUISITE),
            ("node", ["--version"], KEY_NODE_PREREQUISITE),
            ("npm", ["--version"], KEY_NPM_PREREQUISITE),
            ("java", ["-version"], KEY_JAVA_PREREQUISITE),
        ]

        for tool_cmd, version_args, status_key in tools_to_check:
            self.steps_count += 1
            binary_path = resolve_binary_path(tool_cmd)

            if not binary_path:
                self.status[status_key] = {
                    "status": STATUS_KO,
                    "message": f"Prerequisite tool '{tool_cmd}' is missing or not in system PATH."
                }
                self.ko_count += 1
                continue

            try:
                res = subprocess.run(
                    [binary_path] + version_args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5,
                    env=os.environ
                )
                raw_output = (res.stdout + res.stderr).strip()
                version = raw_output.splitlines()[0] if raw_output else "Version detected"
                self.status[status_key] = {
                    "status": STATUS_OK,
                    "version": version,
                    "path": binary_path,
                    "message": f"Detected {tool_cmd} ({version})"
                }
            except Exception as e:
                self.status[status_key] = {
                    "status": STATUS_KO,
                    "message": f"Failed to execute '{tool_cmd}': {e}"
                }
                self.ko_count += 1

    def check_gitignore_rule(self):
        self.steps_count += 1
        gi_path = f"{self.context.workspace_root}/.gitignore"
        has_rule = False
        beScriptsPath = vsCodeSettings.backendWorkspacePath
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                if beScriptsPath in f.read():
                    has_rule = True

        if has_rule:
            self.status[KEY_GITIGNORE_RULE_MAPPED] = {"status": STATUS_OK}
        else:
            self.status[KEY_GITIGNORE_RULE_MAPPED] = {
                "status": STATUS_KO,
                "message": f"{beScriptsPath} exclusion pattern unlisted."
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_system_prerequisites()
        self.check_gitignore_rule()
        return self.generate_summary()
