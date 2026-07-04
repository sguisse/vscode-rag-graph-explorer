import shutil
import os
import subprocess
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.system.neo4j.install import NEO4J_MODULE_NAME
from install.modules.system.neo4j.context import Neo4jContext # <-- L'import de votre nouveau contexte

@InstallerRegistry.register_checker
class SystemNeo4jChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.neo4j_ctx = Neo4jContext(context)

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

    def check_neo4j_db_is_running(self):
        self.steps_count += 1
        neo4j_running = False

        if self.context.is_windows:
            check_process_cmd = ["tasklist", "/FI", "IMAGENAME eq neo4j.bat"]
            result = subprocess.run(check_process_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if "neo4j.bat" in result.stdout:
                neo4j_running = True
        else:
            check_process_cmd = ["pgrep", "-f", "neo4j"]
            result = subprocess.run(check_process_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if result.stdout.strip():
                neo4j_running = True

        if neo4j_running:
            self.status["neo4j_db_running"] = {"status": "✅", "message": "Neo4j database is running."}
        else:
            self.status["neo4j_db_running"] = {
                "status": "❌",
                "message": "Neo4j database is not running."
            }
            self.ko_count += 1

    def check_local_sandboxed_binaries(self):
        self.steps_count += 1

        # Plus besoin de reconstruire les chemins, ils sont servis par le contexte
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
                "message": "Local database engine binary package missing inside dedicated tools route: target/tools/system/neo4j/"
            }
            self.ko_count += 1

    def check_remote_database_token_exists(self):
        """Queries the database to assert the validation token. Does NOT raise an error if missing."""
        self.steps_count += 1

        if not os.path.exists(self.neo4j_ctx.shell_cmd):
            self.status["remote_database_token"] = {"status": "❌", "message": "cypher-shell script missing from server bin structures."}
            self.ko_count += 1
            return

        try:
            check_query = "MATCH (m:SystemMetadata {id: 'global_config'}) RETURN m.`Remote-Database` AS status;"

            res = subprocess.run(
                [self.neo4j_ctx.shell_cmd, "-a", self.neo4j_ctx.bolt_uri, "-u", self.neo4j_ctx.user, "-p", self.neo4j_ctx.password, check_query],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5
            )
            if "TRUE" in res.stdout:
                self.status["remote_database_token"] = {"status": "✅", "message": "Remote-Database identifier token confirmed active."}
            else:
                self.status["remote_database_token"] = {"status": "❌", "message": "Remote-Database configuration property field unallocated or false."}
                self.ko_count += 1
        except Exception:
            self.status["remote_database_token"] = {"status": "❌", "message": "Database sandbox container cluster currently unreachable or uninitialized."}
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_java_version_compliance()
        self.check_local_sandboxed_binaries()
        self.check_neo4j_db_is_running()
        self.check_remote_database_token_exists()
        return self.generate_summary()
