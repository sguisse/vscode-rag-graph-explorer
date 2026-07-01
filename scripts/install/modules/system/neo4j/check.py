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
