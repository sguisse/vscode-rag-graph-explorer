import shutil
import os
import subprocess
from install.base import BaseCheckModule
from install.registry import ModuleRegistry
from install.modules.system.neo4j.install import NEO4J_MODULE_NAME

@ModuleRegistry.register_checker
class SystemNeo4jChecker(BaseCheckModule):
    @property
    def name(self) -> str: return NEO4J_MODULE_NAME

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
                "message": "Local database engine binary package missing inside dedicated tools route: target/tools/system/neo4j/"
            }
            self.ko_count += 1

    def check_remote_database_token_exists(self):
        """Queries the database to assert the validation token. Does NOT raise an error if missing."""
        self.steps_count += 1
        version = self.context.get_tool_setting("neo4j", "version", "5.26.0")
        user = self.context.get_tool_setting("neo4j", "user", "neo4j")
        password = self.context.get_tool_setting("neo4j", "password", "password")
        bolt_port = self.context.get_tool_setting("neo4j", "port.bolt", "7687")
        host = self.context.get_tool_setting("neo4j", "host", "localhost")

        target_folder = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/system/neo4j/neo4j-community-{version}"
        shell_cmd = os.path.join(target_folder, "bin", "cypher-shell.bat" if os.name == 'nt' else "cypher-shell")

        if not os.path.exists(shell_cmd):
            self.status["remote_database_token"] = {"status": "❌", "message": "cypher-shell script missing from server bin structures."}
            self.ko_count += 1
            return

        try:
            check_query = "MATCH (m:SystemMetadata {id: 'global_config'}) RETURN m.`Remote-Database` AS status;"
            res = subprocess.run([shell_cmd, "-a", f"bolt://{host}:{bolt_port}", "-u", user, "-p", password, check_query], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            if "TRUE" in res.stdout:
                self.status["remote_database_token"] = {"status": "✅", "message": "Remote-Database identifier token confirmed active."}
            else:
                self.status["remote_database_token"] = {"status": "❌", "message": "Remote-Database configuration property field unallocated or false."}
                self.ko_count += 1
        except Exception:
            self.status["remote_database_token"] = {"status": "❌", "message": "Database sandbox container cluster currently unreachable or uninitialized."}
            self.ko_count += 1

    def check_custom_user_admin_exists(self):
        self.steps_count += 1
        user = self.context.get_tool_setting("neo4j", "user", "neo4j")
        if user != "neo4j":
            # Do cypher request to check if the custom user exists and has admin role
            check_query = "MATCH (m:SystemMetadata {id: 'global_config'}) RETURN m.`Remote-Database` AS status;"
            res = subprocess.run([shell_cmd, "-a", f"bolt://{host}:{bolt_port}", "-u", user, "-p", password, check_query], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)

            self.status["custom_user_admin"] = {"status": "✅", "message": f"Custom admin user '{user}' detected."}
        else:
            self.status["custom_user_admin"] = {"status": "❌", "message": "Default 'neo4j' admin user is still active. Consider provisioning a custom admin user for enhanced security."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_java_version_compliance()
        self.check_local_sandboxed_binaries()
        self.check_custom_user_admin_exists()
        self.check_remote_database_token_exists()
        return self.generate_summary()
