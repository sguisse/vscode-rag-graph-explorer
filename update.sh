#!/usr/bin/env bash
set -e

# Create module directories if missing
mkdir -p scripts/graph_rag_explorer/install/modules/node/dependency_cruiser
mkdir -p scripts/graph_rag_explorer/install/modules/node/swc

# ------------------------------------------------------------------------------
# 1. dependency_cruiser/constants.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/graph_rag_explorer/install/modules/node/dependency_cruiser/constants.py
MODULE_NAME = "node_dependency_cruiser"
EOF

# ------------------------------------------------------------------------------
# 2. dependency_cruiser/check.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/graph_rag_explorer/install/modules/node/dependency_cruiser/check.py
import shutil
import os
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.node.dependency_cruiser.constants import (
    MODULE_NAME,
)
from install.modules.node.context import NodeContext

@InstallerRegistry.register_checker
class NodeDependencyCruiserChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def check_node_executable(self):
        self.steps_count += 1
        if shutil.which("node"): self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {"status": "❌"}
            self.ko_count += 1

    def check_dependency_cruiser_modules(self):
        self.steps_count += 1
        dc_path = f"{self.node_ctx.node_env_path}/node_modules/dependency-cruiser"
        if os.path.exists(dc_path): self.status["dependency_cruiser"] = {"status": "✅"}
        else:
            self.status["dependency_cruiser"] = {"status": "❌"}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_node_executable()
        self.check_dependency_cruiser_modules()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# 3. dependency_cruiser/install.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/graph_rag_explorer/install/modules/node/dependency_cruiser/install.py
import os
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import execute_tracked_command
from install.modules.node.dependency_cruiser.constants import (
    MODULE_NAME,
)
from install.modules.node.context import NodeContext
from install.modules.node.dependency_cruiser.check import NodeDependencyCruiserChecker

@InstallerRegistry.register_installer
class NodeDependencyCruiserInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def provisioning_dependency_cruiser(self):
        target_env = self.node_ctx.node_env_path
        execute_tracked_command(["npm", "install", "dependency-cruiser@18.0.0"], "dc_install", cwd=target_env)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeDependencyCruiserChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("dependency_cruiser", {}).get("status") != "✅":
            self.provisioning_dependency_cruiser()
EOF

# ------------------------------------------------------------------------------
# 4. swc/constants.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/graph_rag_explorer/install/modules/node/swc/constants.py
MODULE_NAME = "node_swc"
EOF

# ------------------------------------------------------------------------------
# 5. swc/check.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/graph_rag_explorer/install/modules/node/swc/check.py
import shutil
import os
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.node.swc.constants import (
    MODULE_NAME,
)
from install.modules.node.context import NodeContext

@InstallerRegistry.register_checker
class NodeSwcChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def check_node_binary(self):
        self.steps_count += 1
        node_bin = shutil.which("node")
        if node_bin:
            self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {"status": "❌", "message": "Node environment runtime omitted."}
            self.ko_count += 1

    def check_npm_binary(self):
        self.steps_count += 1
        npm_bin = shutil.which("npm")
        if npm_bin:
            self.status["npm"] = {"status": "✅"}
        else:
            self.status["npm"] = {"status": "❌", "message": "Npm utility wrapper unmapped."}
            self.ko_count += 1

    def check_swc_core_package(self):
        self.steps_count += 1
        swc_path = f"{self.node_ctx.node_env_path}/node_modules/@swc/core"
        if os.path.exists(swc_path):
            self.status["swc"] = {"status": "✅"}
        else:
            self.status["swc"] = {"status": "❌", "message": "@swc/core modules unallocated."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_node_binary()
        self.check_npm_binary()
        self.check_swc_core_package()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# 6. swc/install.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/graph_rag_explorer/install/modules/node/swc/install.py
import os
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import execute_tracked_command
from install.modules.node.swc.constants import (
    MODULE_NAME,
)
from install.modules.node.context import NodeContext
from install.modules.node.swc.check import NodeSwcChecker

@InstallerRegistry.register_installer
class NodeSwcInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.node_ctx = NodeContext(context)

    @property
    def name(self) -> str: return MODULE_NAME

    def install_swc_core(self):
        target_env = self.node_ctx.node_env_path
        execute_tracked_command(["npm", "install", "@swc/core@1.15.43"], "swc_install", cwd=target_env)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations."""
        checker = NodeSwcChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("swc", {}).get("status") != "✅":
            self.install_swc_core()
EOF

echo "✅ refactor: Aligned dependency_cruiser and swc modules with node_env_initialisation and sdk_copilot context structures!"
