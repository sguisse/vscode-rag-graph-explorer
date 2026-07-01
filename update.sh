#!/usr/bin/env bash

# Safely manage backticks for Markdown/code generation
BTICK=$(printf '\x60')
TRIPLE_TICK=$(printf '\x60\x60\x60')

echo "🚀 Standardizing state resetting across all remaining module checkers to eliminate cumulative summary duplication..."

mkdir -p scripts/install/modules/python/graphify
mkdir -p scripts/install/modules/java/jacoco
mkdir -p scripts/install/modules/system/neo4j
mkdir -p scripts/install/modules/system/core
mkdir -p scripts/install/modules/node/dependency_cruiser
mkdir -p scripts/install/modules/node/swc

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/python/graphify/check.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/install/modules/python/graphify/check.py
import shutil
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class PythonGraphifyChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "python_graphify"

    def check_uvx_runtime_utility(self):
        self.steps_count += 1
        if shutil.which("uvx"): self.status["uvx"] = {"status": "✅"}
        else: self.status["uvx"] = {"status": "⚠️", "message": "Optimized compilation layer binaries absent."}

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_uvx_runtime_utility()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/java/jacoco/check.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/install/modules/java/jacoco/check.py
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class JavaJacocoChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "java_jacoco"

    def check_xml_report_path_wiring(self):
        self.steps_count += 1
        target_report = self.context.get_tool_setting("jqassistant", "xmlReportPath", "./target/site/jacoco/jacoco.xml")
        self.status["jacoco_wired"] = {"status": "✅", "path": target_report}

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_xml_report_path_wiring()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/system/neo4j/check.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/install/modules/system/neo4j/check.py
import shutil
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class SystemNeo4jChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "system_neo4j"

    def check_java_version_compliance(self):
        self.steps_count += 1
        java_executable = shutil.which("java")
        if java_executable:
            self.status["java_runtime_executable"] = {"status": "✅", "path": java_executable}
        else:
            self.status["java_runtime_executable"] = {
                "status": "❌",
                "message": "Neo4j operations constraint requires an active local installation of Java 17 or Java 21."
            }
            self.ko_count += 1

    def check_local_sandboxed_binaries(self):
        self.steps_count += 1
        version = self.context.get_tool_setting("neo4j", "version", "5.26.0")

        target_folder = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/system/neo4j/neo4j-community-{version}"
        bin_dir = os.path.join(target_folder, "bin")
        admin_executable = os.path.join(bin_dir, "neo4j-admin.bat" if os.name == 'nt' else "neo4j-admin")

        if os.path.exists(admin_executable):
            self.status["neo4j_local_installation"] = {"status": "✅", "location": target_folder}

            self.steps_count += 1
            plugins_dir = os.path.join(target_folder, "plugins")
            has_apoc = any("apoc" in file and file.endswith(".jar") for file in os.listdir(plugins_dir)) if os.path.exists(plugins_dir) else False
            has_gds = any("graph-data-science" in file and file.endswith(".jar") for file in os.listdir(plugins_dir)) if os.path.exists(plugins_dir) else False

            if has_apoc and has_gds:
                self.status["neo4j_plugins_compliance"] = {"status": "✅", "message": "APOC Core and GDS extensions detected inside sandbox context."}
            else:
                self.status["neo4j_plugins_compliance"] = {
                    "status": "❌",
                    "message": "Missing necessary procedure plugins jars (apoc or graph-data-science) inside runtime subfolder."
                }
                self.ko_count += 1
        else:
            self.status["neo4j_local_installation"] = {
                "status": "❌",
                "message": f"Local database engine binary package missing inside dedicated tools route: target/tools/system/neo4j/"
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_java_version_compliance()
        self.check_local_sandboxed_binaries()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/system/core/check.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/install/modules/system/core/check.py
import os
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class SystemCoreChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "system_core"

    def check_gitignore_rule(self):
        self.steps_count += 1
        gi_path = f"{self.context.workspace_root}/.gitignore"
        has_rule = False
        if os.path.exists(gi_path):
            with open(gi_path, "r", encoding="utf-8") as f:
                if ".graph-rag-explorer" in f.read():
                    has_rule = True

        if has_rule:
            self.status["gitignore_rule_mapped"] = {"status": "✅"}
        else:
            self.status["gitignore_rule_mapped"] = {"status": "❌", "message": ".graph-rag-explorer exclusion pattern unlisted."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_gitignore_rule()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/node/dependency_cruiser/check.py
# ------------------------------------------------------------------------------
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
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_node_executable()
        self.check_dependency_cruiser_modules()
        return self.generate_summary()
EOF

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/node/swc/check.py
# ------------------------------------------------------------------------------
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
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_node_binary()
        self.check_npm_binary()
        self.check_swc_core_package()
        return self.generate_summary()
EOF

npm run package

echo "✅ fix/metrics-idempotency: Extended the pre-check cleanup logic across all system, node, and python checkers to systematically stabilize telemetry step-counts."
