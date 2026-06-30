#!/usr/bin/env bash
# Production-ready patch to relocate the sandboxed Node analyzer environment to target/tools/node.

# 1. Purge the old workspace-root level node sandbox paths if they exist to avoid confusion
if [ -d "scripts/analyser/node_modules" ]; then
    rm -rf "scripts/analyser/node_modules"
fi
if [ -f "scripts/analyser/package.json" ]; then
    rm -f "scripts/analyser/package.json"
fi
if [ -f "scripts/analyser/package-lock.json" ]; then
    rm -f "scripts/analyser/package-lock.json"
fi

# 2. Create the new sandboxed tools location
mkdir -p scripts/install/modules/node/dependency_cruiser
mkdir -p scripts/install/modules/node/swc

# 3. Rewrite Dependency Cruiser Checker with new sandboxed paths
cat << 'EOF' > scripts/install/modules/node/dependency_cruiser/check.py
import shutil
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class NodeDependencyCruiserChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "node_dependency_cruiser"

    def check_node_executable(self):
        self.steps_count += 1
        if shutil.which("node"): self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {"status": "❌"}
            self.ko_count += 1

    def check_dependency_cruiser_modules(self):
        self.steps_count += 1
        dc_path = f"{self.context.tools_dir}/node/node_modules/dependency-cruiser"
        if os.path.exists(dc_path): self.status["dependency_cruiser"] = {"status": "✅"}
        else:
            self.status["dependency_cruiser"] = {"status": "❌"}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.check_node_executable()
        self.check_dependency_cruiser_modules()
        return self.generate_summary()
EOF

# 4. Rewrite Dependency Cruiser Installer with new sandboxed paths
cat << 'EOF' > scripts/install/modules/node/dependency_cruiser/install.py
import os
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import execute_tracked_command

@ModuleRegistry.register_installer
class NodeDependencyCruiserInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "node_dependency_cruiser"

    def provisioning_dependency_cruiser(self, target_env: str):
        execute_tracked_command(["npm", "install", "dependency-cruiser@18.0.0"], "dc_install", cwd=target_env)

    def execute_all_installations(self) -> None:
        target_env = f"{self.context.tools_dir}/node"
        os.makedirs(target_env, exist_ok=True)
        if not os.path.exists(f"{target_env}/package.json"):
            execute_tracked_command(["npm", "init", "-y"], "dc_init", cwd=target_env)
        self.provisioning_dependency_cruiser(target_env)
EOF

# 5. Rewrite SWC Checker with new sandboxed paths
cat << 'EOF' > scripts/install/modules/node/swc/check.py
import shutil
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class NodeSwcChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "node_swc"

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
        swc_path = f"{self.context.tools_dir}/node/node_modules/@swc/core"
        if os.path.exists(swc_path):
            self.status["swc"] = {"status": "✅"}
        else:
            self.status["swc"] = {"status": "❌", "message": "@swc/core modules unallocated."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.check_node_binary()
        self.check_npm_binary()
        self.check_swc_core_package()
        return self.generate_summary()
EOF

# 6. Rewrite SWC Installer with new sandboxed paths
cat << 'EOF' > scripts/install/modules/node/swc/install.py
import os
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import execute_tracked_command

@ModuleRegistry.register_installer
class NodeSwcInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "node_swc"

    def init_package_json(self, target_env: str):
        if not os.path.exists(f"{target_env}/package.json"):
            execute_tracked_command(["npm", "init", "-y"], "swc_init", cwd=target_env)

    def install_swc_core(self, target_env: str):
        execute_tracked_command(["npm", "install", "@swc/core@1.15.43"], "swc_install", cwd=target_env)

    def execute_all_installations(self) -> None:
        target_env = f"{self.context.tools_dir}/node"
        os.makedirs(target_env, exist_ok=True)
        self.init_package_json(target_env)
        self.install_swc_core(target_env)
EOF

# Rebuild the production asset packages
npm run package

echo "✅ refactor/node: Relocated localized package.json configurations and node modules installation directories safely into .graph-rag-explorer/target/tools/node!"
