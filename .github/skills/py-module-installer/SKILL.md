---
name: py-module-installer
description: Create and register a modular tool checker and installer within the GraphRAG Explorer installation pipeline adhering to BaseCheckModule and BaseInstallModule standards.
---

# GraphRAG Explorer Tool Installer Module Creation

This skill defines the standard procedure for implementing a modular tool installer within the GraphRAG Explorer installation pipeline (`scripts/graph_rag_explorer/install/modules/`).

## Architecture & Discovery Protocol

The installation pipeline relies on dynamic runtime discovery:
- **Dynamic Module Loading**: `InstallerRegistry.discover_and_load_checkers_and_installers()` recursively scans `scripts/graph_rag_explorer/install/modules/` for `check.py` and `install.py` files.
- **Class Registration**: Checker and installer classes register automatically using `@InstallerRegistry.register_checker` and `@InstallerRegistry.register_installer`.
- **Pipeline Execution**: `run_installation_pipeline()` invokes `execute_all_checks()`. If any status resolves to a value other than `"✅"`, it triggers `execute_all_installations()` and re-verifies.
- **Zero Configuration**: Do **not** modify `install/runner.py` directly. The framework discovers valid directories automatically.

---

## Directory Layout

Create the tool module in the pipeline directory tree:

```text
scripts/graph_rag_explorer/install/modules/<category>/<tool_name>/
├── constants.py    # (Optional) Platform target generation & module constants
├── context.py      # (Optional) Tool-specific context, path resolution, VS Code settings
├── check.py        # MANDATORY: Check module inheriting BaseCheckModule with decorator
└── install.py      # MANDATORY: Install module inheriting BaseInstallModule with decorator
```

---

## Step-by-Step Implementation

### Step 1: Define Module Context & Constants (Optional)

Manage path resolutions using `EnvironmentContext` (`core.context`) and settings bindings from `vsCodeSettings` (`core.VsCodeSettings_gen`).

**Example: Target Resolution (`constants.py`)**

```python
import platform

MODULE_NAME = "node_<tool_name>"

def get_platform_target() -> str:
    system = platform.system().lower()
    machine = platform.machine().lower()
    plat_str = "win32" if system == "windows" else ("darwin" if system == "darwin" else "linux")
    arch_str = "arm64" if machine in ["arm64", "aarch64"] else "x64"
    return f"{plat_str}-{arch_str}"
```

**Example: Context Binding (`context.py`)**

```python
from core.VsCodeSettings_gen import vsCodeSettings
from core.context import EnvironmentContext

class ToolContext:
    def __init__(self, ctx: EnvironmentContext):
        self.version = vsCodeSettings.graphRagExplorer.<tool_name>.version
        self.tools_dir = f"{ctx.tools_dir}/<category>/<tool_name>"
        self.workspace_root = ctx.workspace_root
```

### Step 2: Implement the Checker (`check.py`)

Inherit from `BaseCheckModule`, implement `name` and `execute_all_checks()`, and decorate with `@InstallerRegistry.register_checker`.

```python
import os
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.node.context import NodeContext

@InstallerRegistry.register_checker
class ToolChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str:
        # MUST match Installer class name string exactly
        return "node_<tool_name>"

    def check_tool_binary_or_module(self):
        self.steps_count += 1
        target_path = f"{self.node_ctx.node_env_path}/node_modules/<tool_package>"

        if os.path.exists(target_path):
            self.status["tool_module"] = {"status": "✅"}
        else:
            self.status["tool_module"] = {
                "status": "❌",
                "message": "<tool_package> module missing in sandbox tools directory."
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_tool_binary_or_module()
        return self.generate_summary()
```

### Step 3: Implement the Installer (`install.py`)

Inherit from `BaseInstallModule`, implement `name` and `execute_all_installations()`, and decorate with `@InstallerRegistry.register_installer`.

```python
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import execute_tracked_command, info, success, error
from install.modules.node.context import NodeContext
from install.modules.<category>.<tool_name>.check import ToolChecker

@InstallerRegistry.register_installer
class ToolInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str:
        # MUST match Checker class name string exactly
        return "node_<tool_name>"

    def provision_tool(self):
        target_env = self.node_ctx.node_env_path
        info(f"Provisioning <tool_name> in {target_env}...", component=self.name)

        return_code = execute_tracked_command(
            ["npm", "install", "<tool_package>@<version>"],
            "<tool_name>_install",
            cwd=target_env
        )
        if return_code == 0:
            success("<tool_name> provisioned successfully.", component=self.name)
        else:
            error(f"<tool_name> installation failed with code {return_code}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        checker = ToolChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("tool_module", {}).get("status") != "✅":
            self.provision_tool()
```

---

## Technical Requirements Checklist

| Requirement | Description |
| :--- | :--- |
| **Strict Name Synchronization** | The `name` property string in `check.py` and `install.py` MUST be identical (e.g., `"node_llm_copilot_sdk"`). |
| **Registry Decorators** | Ensure `@InstallerRegistry.register_checker` is applied in `check.py` and `@InstallerRegistry.register_installer` in `install.py`. |
| **Metrics Tracking** | In `check.py`, increment `self.steps_count += 1` for every check step and `self.ko_count += 1` whenever status is `"❌"`. |
| **Path Normalization** | Use `EnvironmentContext` or path normalization utilities for Windows/POSIX compatibility. |
| **No Dynamic Modifications** | Do not hardcode references in `install/runner.py`. Allow discovery via structural directory scanning. |
