import os
from core.context import EnvironmentContext

class Neo4jContext:
    def __init__(self, ctx: EnvironmentContext):
        # The Neo4j token to verify if the remote database is visible for jQAssistant
        self.remote_database_token_name = "Remote-Database"
        self.remote_database_token_value = "true"

        # Configuration Settings
        self.version = ctx.get_vscode_setting("neo4j", "version", "5.26.0")
        self.gds_version = ctx.get_vscode_setting("neo4j", "gds_version", "2026.05.0")
        self.user = ctx.get_vscode_setting("neo4j", "user", "neo4j")
        self.password = ctx.get_vscode_setting("neo4j", "password", "password")
        self.host = ctx.get_vscode_setting("neo4j", "host", "localhost")
        self.bolt_port = ctx.get_vscode_setting("neo4j", "port.bolt", "7687")
        self.http_port = ctx.get_vscode_setting("neo4j", "port.http", "7474")
        self.bolt_uri = ctx.get_vscode_setting("neo4j", "uri", f"bolt://{self.host}:{self.bolt_port}")
        self.http_url = ctx.get_vscode_setting("neo4j", "url", f"http://{self.host}:{self.http_port}")


        # Core Sandbox Paths
        self.sandbox_root = f"{ctx.tools_dir}/system/neo4j"
        self.target_folder = os.path.join(self.sandbox_root, f"neo4j-community-{self.version}")
        self.plugins_dir = os.path.join(self.target_folder, "plugins")
        self.bin_dir = os.path.join(self.target_folder, "bin")
        self.conf_dir = os.path.join(self.target_folder, "conf")

        # Executable Commands
        self.admin_cmd = os.path.join(self.bin_dir, "neo4j-admin.bat" if ctx.is_windows else "neo4j-admin")
        self.neo4j_cmd = os.path.join(self.bin_dir, "neo4j.bat" if ctx.is_windows else "neo4j")
        self.cypher_shell_cmd = os.path.join(self.bin_dir, "cypher-shell.bat" if ctx.is_windows else "cypher-shell")

        # Distribution Archive & Plugins Paths
        self.archive_name = f"neo4j-community-{self.version}-windows.zip" if ctx.is_windows else f"neo4j-community-{self.version}-unix.tar.gz"
        self.apoc_tmp_path = os.path.join(self.sandbox_root, f"apoc-{self.version}-core.jar")
        self.apoc_jar_path = os.path.join(self.plugins_dir, f"apoc-{self.version}-core.jar")

        self.gds_zip_name = f"neo4j-graph-data-science-{self.gds_version}.jar.zip"
        self.gds_tmp_path = os.path.join(self.sandbox_root, self.gds_zip_name)
        self.gds_jar_path = os.path.join(self.plugins_dir, f"neo4j-graph-data-science-{self.gds_version}.jar")
