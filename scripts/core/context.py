import os
from typing import Any
from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info

class EnvironmentContext:
    def __init__(self):
        # System State
        self.is_windows = (os.name == 'nt')

        self.beScriptsPath = vsCodeSettings.backendWorkspacePath
        self.workspace_root = os.path.abspath(vsCodeSettings.workspaceRoot).replace("\\", "/")
        self.target_dir = f"{self.workspace_root}/{self.beScriptsPath}/target"
        self.tools_dir = f"{self.target_dir}/tools"
        self.install_reports_dir = f"{self.target_dir}/install_reports"
        self.raw_outputs_dir = f"{self.target_dir}/raw_outputs"
        self.ui_outputs_dir = f"{self.target_dir}/ui_outputs"

        self.pids_dir = f"{self.target_dir}/pids"
