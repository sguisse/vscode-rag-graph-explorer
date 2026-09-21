import os
import re
from core.context import EnvironmentContext
from core.VsCodeSettings_gen import vsCodeSettings

class PostgresqlContext:
    def __init__(self, ctx: EnvironmentContext):
        # Configuration Settings
        self.version = "16.2-1"
        try:
            if hasattr(vsCodeSettings, "graphRagExplorer") and hasattr(vsCodeSettings.graphRagExplorer, "postgresql"):
                raw_ver = getattr(vsCodeSettings.graphRagExplorer.postgresql, "version", "16.2-1")
                if raw_ver:
                    match = re.search(r'(\d+\.\d+(?:-\d+)?)', str(raw_ver))
                    if match:
                        self.version = match.group(1)
        except Exception:
            pass

        try:
            pg_cfg = vsCodeSettings.graphRagExplorer.postgresql
            self.user = str(pg_cfg.username)
            self.password = str(pg_cfg.password)
            self.host = str(pg_cfg.host)
            self.port = str(pg_cfg.port)
            self.database = str(getattr(pg_cfg, "database", "graph_rag"))
            self.lang = str(getattr(pg_cfg, "lang", "C.UTF-8"))
            self.lc_all = str(getattr(pg_cfg, "lc_all", "C.UTF-8"))
        except Exception:
            self.user = "postgres"
            self.password = "postgres"
            self.host = "127.0.0.1"
            self.port = "5432"
            self.database = "graph_rag"
            self.lang = "C.UTF-8"
            self.lc_all = "C.UTF-8"

        self.schema = "ai_architecture_auditor"
        self.uri = f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

        # Subprocess Execution Environment with Locale Defaults
        self.env = os.environ.copy()
        self.env["LANG"] = self.lang
        self.env["LC_ALL"] = self.lc_all

        # Core Sandbox Paths
        self.sandbox_root = f"{ctx.tools_dir}/system/postgresql16"
        self.target_folder = os.path.join(self.sandbox_root, f"postgresql-{self.version}")
        self.bin_dir = os.path.join(self.target_folder, "bin")
        self.data_dir = os.path.join(self.sandbox_root, "data")
        self.logs_dir = os.path.join(self.sandbox_root, "logs")

        # Target results directory
        self.raw_outputs_dir = f"{ctx.raw_outputs_dir}/postgresql"

        # Executable Commands
        self.initdb_cmd = os.path.join(self.bin_dir, "initdb.exe" if ctx.is_windows else "initdb")
        self.pg_ctl_cmd = os.path.join(self.bin_dir, "pg_ctl.exe" if ctx.is_windows else "pg_ctl")
        self.psql_cmd = os.path.join(self.bin_dir, "psql.exe" if ctx.is_windows else "psql")
        self.createdb_cmd = os.path.join(self.bin_dir, "createdb.exe" if ctx.is_windows else "createdb")

        # Distribution Archive Paths
        if ctx.is_windows:
            self.archive_name = f"postgresql-{self.version}-windows-x64-binaries.zip"
            self.download_url = f"https://get.enterprisedb.com/postgresql/postgresql-{self.version}-windows-x64-binaries.zip"
        else:
            self.archive_name = f"postgresql-{self.version}-linux-x64-binaries.tar.gz"
            self.download_url = f"https://get.enterprisedb.com/postgresql/postgresql-{self.version}-linux-x64-binaries.tar.gz"
