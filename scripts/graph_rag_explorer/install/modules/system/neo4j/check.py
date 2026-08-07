import shutil
import os
import subprocess
import socket
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.system.neo4j.install import NEO4J_MODULE_NAME
from install.modules.system.neo4j.context import Neo4jContext
from core.utils import info

@InstallerRegistry.register_checker
class SystemNeo4jChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.neo4j_ctx = Neo4jContext(context)

    @property
    def name(self) -> str: return NEO4J_MODULE_NAME

    def check_java_version_compliance(self):
        self.steps_count += 1

        # Passive check only: reads current system configuration
        if self._is_java_version_compliant():
            java_executable = shutil.which("java")
            self.status["java_runtime_executable"] = {
                "status": "✅",
                "path": java_executable,
                "message": "Compliant Java runtime environment (Java 17 or 21) detected active."
            }
        else:
            self.status["java_runtime_executable"] = {
                "status": "❌",
                "message": "Active Java runtime environment is missing, non-compliant, or untracked."
            }
            self.ko_count += 1

    def _is_java_version_compliant(self) -> bool:
        """Passive validation of the currently accessible Java runtime version boundary."""
        try:
            java_cmd = "java"
            if "JAVA_HOME" in os.environ:
                target_java = os.path.join(os.environ["JAVA_HOME"], "bin", "java")
                if os.path.exists(target_java):
                    java_cmd = target_java

            result = subprocess.run([java_cmd, "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            output = (result.stderr + result.stdout).lower()

            if "17." in output or "21." in output or 'version "17' in output or 'version "21' in output:
                return True
        except Exception:
            pass
        return False

    def check_neo4j_db_is_running(self):
        self.steps_count += 1
        host = self.neo4j_ctx.host
        port = int(self.neo4j_ctx.bolt_port)

        neo4j_running = False
        try:
            with socket.create_connection((host, port), timeout=2):
                neo4j_running = True
        except (socket.timeout, ConnectionRefusedError):
            neo4j_running = False

        if neo4j_running:
            info("Neo4j database is already running.", component=self.name)
            self.status["neo4j_db_running"] = {"status": "✅", "message": f"Neo4j database is running on Bolt port {port}."}
        else:
            self.status["neo4j_db_running"] = {
                "status": "❌",
                "message": f"Neo4j database is not reachable on port {port}."
            }
            self.ko_count += 1

    def check_local_sandboxed_binaries(self):
        self.steps_count += 1
        if os.path.exists(self.neo4j_ctx.admin_cmd):
            self.status["neo4j_local_installation"] = {"status": "✅", "location": self.neo4j_ctx.target_folder}
            self.steps_count += 1
            has_apoc = any("apoc" in file and file.endswith(".jar") for file in os.listdir(self.neo4j_ctx.plugins_dir)) if os.path.exists(self.neo4j_ctx.plugins_dir) else False
            has_gds = any("graph-data-science" in file and file.endswith(".jar") for file in os.listdir(self.neo4j_ctx.plugins_dir)) if os.path.exists(self.neo4j_ctx.plugins_dir) else False

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
                "message": "Local database engine binaric package missing inside dedicated tools route."
            }
            self.ko_count += 1

    def check_remote_database_token_exists(self) -> bool:
        self.steps_count += 1
        if not os.path.exists(self.neo4j_ctx.cypher_shell_cmd):
            self.status["remote_database_token"] = {"status": "❌", "message": "cypher-shell script missing from server bin structures."}
            self.ko_count += 1
            return False

        try:
            check_query = f"MATCH (m:SystemMetadata {{id: 'global_config'}}) RETURN m.`{self.neo4j_ctx.remote_database_token_name}` AS status;"
            res = subprocess.run(
                [self.neo4j_ctx.cypher_shell_cmd, "-a", self.neo4j_ctx.bolt_uri, "-u", self.neo4j_ctx.user, "-p", self.neo4j_ctx.password, check_query],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5
            )
            if self.neo4j_ctx.remote_database_token_value.upper() in res.stdout:
                self.status["remote_database_token"] = {"status": "✅", "message": f"{self.neo4j_ctx.remote_database_token_name} identifier token confirmed active."}
                return True
            else:
                self.status["remote_database_token"] = {"status": "❌", "message": f"{self.neo4j_ctx.remote_database_token_name} configuration property field unallocated or false."}
                self.ko_count += 1
                return False
        except Exception:
            self.status["remote_database_token"] = {"status": "❌", "message": "Database sandbox container cluster currently unreachable or uninitialized."}
            self.ko_count += 1
            return False

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_java_version_compliance()
        self.check_local_sandboxed_binaries()
        self.check_neo4j_db_is_running()
        self.check_remote_database_token_exists()
        return self.generate_summary()
