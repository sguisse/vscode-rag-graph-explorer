#!/usr/bin/env bash
set -euo pipefail

# Ensure the core scripts directory exists
mkdir -p scripts/core

# Overwrite scripts/core/context.py with the missing 'os' and 'Any' imports included
cat << 'EOF' > scripts/core/context.py
import os
from typing import Any
from core.vscode_settings_4_backend import vsCodeSettings

class EnvironmentContext:
    def __init__(self):
        self.workspace_root = os.path.abspath(vsCodeSettings.get("workspaceRoot")).replace("\\", "/")
        self.target_dir = f"{self.workspace_root}/{vsCodeSettings.get('beScriptsPath')}/target"
        self.install_reports_dir = f"{self.target_dir}/install_reports"
        self.raw_outputs_dir = f"{self.target_dir}/raw_outputs"
        self.tools_dir = f"{self.target_dir}/tools"
        self.pids_dir = f"{self.target_dir}/pids"

    def get_vscode_setting(self, key_part_1: str, key_part_2: str = "", default: Any = None) -> Any:
        flat_key = f"{key_part_1}.{key_part_2}" if key_part_2 else key_part_1
        value = vsCodeSettings.get(flat_key)
        if value is None and key_part_2:
           flat_key = f"{key_part_1}_{key_part_2}"
           value = vsCodeSettings.get(flat_key, default)

        return value
EOF

echo "✅ fix: Added missing 'os' and 'Any' module imports to scripts/core/context.py to prevent critical initialization crashes!"
