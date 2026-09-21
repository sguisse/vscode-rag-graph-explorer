import shutil
import os
import sys
import subprocess
import socket
from typing import Optional
from install.base import BaseCheckModule
from install.registry import InstallerRegistry
from install.modules.system.postgresql16.install import POSTGRESQL_MODULE_NAME
from install.modules.system.postgresql16.context import PostgresqlContext
from core.utils import info

@InstallerRegistry.register_checker
class SystemPostgresqlChecker(BaseCheckModule):
    def __init__(self, context):
        super().__init__(context)
        self.pg_ctx = PostgresqlContext(context)

    @property
    def name(self) -> str:
        return POSTGRESQL_MODULE_NAME

    def _has_system_postgresql(self) -> bool:
        if shutil.which("pg_ctl") or shutil.which("psql"):
            return True
        candidate_dirs = [
            "/Applications/Postgres.app/Contents/Versions/latest/bin",
            "/Applications/Postgres.app/Contents/Versions/16/bin",
            "/Applications/Postgres.app/Contents/Versions/15/bin",
            "/opt/homebrew/bin",
            "/opt/homebrew/opt/postgresql@16/bin",
            "/opt/homebrew/opt/postgresql@15/bin",
            "/opt/homebrew/opt/postgresql/bin",
            "/usr/local/bin",
            "/usr/local/opt/postgresql@16/bin",
            "/usr/local/opt/postgresql/bin",
            "/usr/lib/postgresql/16/bin",
            "/usr/lib/postgresql/15/bin",
            "/usr/bin",
            r"C:\Program Files\PostgreSQL\16\bin",
            r"C:\Program Files\PostgreSQL\15\bin",
            r"C:\PostgreSQL\16\bin",
            r"C:\PostgreSQL\bin"
        ]
        target_pg_ctl = "pg_ctl.exe" if self.context.is_windows else "pg_ctl"
        target_psql = "psql.exe" if self.context.is_windows else "psql"
        return any(
            os.path.exists(os.path.join(d, target_pg_ctl)) or os.path.exists(os.path.join(d, target_psql))
            for d in candidate_dirs
        )

    def _find_psql_binary(self) -> Optional[str]:
        if os.path.exists(self.pg_ctx.psql_cmd):
            return self.pg_ctx.psql_cmd

        psql_in_path = shutil.which("psql")
        if psql_in_path:
            return psql_in_path

        candidate_dirs = [
            os.path.join(self.pg_ctx.bin_dir, "psql.exe" if self.context.is_windows else "psql"),
            "/Applications/Postgres.app/Contents/Versions/latest/bin/psql",
            "/Applications/Postgres.app/Contents/Versions/16/bin/psql",
            "/opt/homebrew/bin/psql",
            "/opt/homebrew/opt/postgresql@16/bin/psql",
            "/opt/homebrew/opt/postgresql/bin/psql",
            "/usr/local/bin/psql",
            "/usr/local/opt/postgresql@16/bin/psql",
            "/usr/lib/postgresql/16/bin/psql",
            r"C:\Program Files\PostgreSQL\16\bin\psql.exe",
        ]
        for cand in candidate_dirs:
            if os.path.exists(cand):
                return cand
        return None

    def check_local_sandboxed_binaries(self):
        self.steps_count += 1
        service_script = os.path.join(self.pg_ctx.sandbox_root, "service.py")

        has_pg_ctl = os.path.exists(self.pg_ctx.pg_ctl_cmd)
        has_psql = os.path.exists(self.pg_ctx.psql_cmd)
        has_initdb = os.path.exists(self.pg_ctx.initdb_cmd)
        has_system = self._has_system_postgresql()

        if (has_pg_ctl and has_psql and has_initdb) or has_system:
            self.status["postgresql_local_installation"] = {
                "status": "✅",
                "location": self.pg_ctx.target_folder if (has_pg_ctl and has_psql and has_initdb) else "System PATH / Installed binaries"
            }
            self.steps_count += 1

            has_data = os.path.exists(self.pg_ctx.data_dir)
            has_service_script = os.path.exists(service_script)

            if has_data and has_service_script:
                self.status["postgresql_environment_compliance"] = {
                    "status": "✅",
                    "message": "Initialized data cluster and service.py controller detected inside sandbox context."
                }
            else:
                missing = []
                if not has_data: missing.append("data cluster directory")
                if not has_service_script: missing.append("service.py controller")

                self.status["postgresql_environment_compliance"] = {
                    "status": "❌",
                    "message": f"Missing required components inside runtime subfolder: {', '.join(missing)}."
                }
                self.ko_count += 1
        else:
            self.status["postgresql_local_installation"] = {
                "status": "❌",
                "message": "Local or system PostgreSQL binaries missing from environment."
            }
            self.ko_count += 1

    def check_postgresql_db_is_running(self):
        self.steps_count += 1
        host = self.pg_ctx.host
        port = int(self.pg_ctx.port)
        service_script = os.path.join(self.pg_ctx.sandbox_root, "service.py")

        socket_running = False
        try:
            with socket.create_connection((host, port), timeout=2):
                socket_running = True
        except (socket.timeout, ConnectionRefusedError):
            socket_running = False

        service_running = False
        if os.path.exists(service_script):
            try:
                res = subprocess.run(
                    [sys.executable, service_script, "status"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5
                )
                service_running = (res.returncode == 0)
            except Exception:
                service_running = False

        if socket_running or service_running:
            info("PostgreSQL database process and network port verified active.", component=self.name)
            self.status["postgresql_db_running"] = {
                "status": "✅",
                "message": f"PostgreSQL database is running and reachable on port {port}."
            }
        else:
            self.status["postgresql_db_running"] = {
                "status": "❌",
                "message": f"PostgreSQL database service/process is not running or reachable on port {port}."
            }
            self.ko_count += 1

    def check_postgresql_database_and_schema(self):
        self.steps_count += 2
        host = self.pg_ctx.host
        port = int(self.pg_ctx.port)
        db_name = self.pg_ctx.database
        schema_name = self.pg_ctx.schema

        psql_bin = self._find_psql_binary()
        if not psql_bin:
            self.status["postgresql_database_exists"] = {
                "status": "❌",
                "message": f"Cannot verify database '{db_name}': 'psql' binary is missing."
            }
            self.status["postgresql_schema_exists"] = {
                "status": "❌",
                "message": f"Cannot verify schema '{schema_name}': 'psql' binary is missing."
            }
            self.ko_count += 2
            return

        env = os.environ.copy()
        env["PGPASSWORD"] = self.pg_ctx.password

        # 1. Verify target database existence ("graph_rag")
        try:
            check_db_cmd = [
                psql_bin, "-h", host, "-p", str(port), "-U", self.pg_ctx.user,
                "-d", "postgres", "-tAc", f"SELECT 1 FROM pg_database WHERE datname = '{db_name}';"
            ]
            res = subprocess.run(check_db_cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            if res.returncode == 0 and "1" in res.stdout.strip():
                self.status["postgresql_database_exists"] = {
                    "status": "✅",
                    "message": f"PostgreSQL database instance '{db_name}' confirmed active."
                }
            else:
                self.status["postgresql_database_exists"] = {
                    "status": "❌",
                    "message": f"PostgreSQL database '{db_name}' does not exist on instance."
                }
                self.ko_count += 1
        except Exception as e:
            self.status["postgresql_database_exists"] = {
                "status": "❌",
                "message": f"Failed to check database '{db_name}': {e}"
            }
            self.ko_count += 1

        # 2. Verify schema existence inside database ("ai_architecture_auditor")
        if self.status.get("postgresql_database_exists", {}).get("status") == "✅":
            try:
                check_schema_cmd = [
                    psql_bin, "-h", host, "-p", str(port), "-U", self.pg_ctx.user,
                    "-d", db_name, "-tAc", f"SELECT 1 FROM information_schema.schemata WHERE schema_name = '{schema_name}';"
                ]
                res = subprocess.run(check_schema_cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
                if res.returncode == 0 and "1" in res.stdout.strip():
                    self.status["postgresql_schema_exists"] = {
                        "status": "✅",
                        "message": f"Schema '{schema_name}' exists inside database '{db_name}'."
                    }
                else:
                    self.status["postgresql_schema_exists"] = {
                        "status": "❌",
                        "message": f"Schema '{schema_name}' is missing inside database '{db_name}'."
                    }
                    self.ko_count += 1
            except Exception as e:
                self.status["postgresql_schema_exists"] = {
                    "status": "❌",
                    "message": f"Failed to check schema '{schema_name}': {e}"
                }
                self.ko_count += 1
        else:
            self.status["postgresql_schema_exists"] = {
                "status": "❌",
                "message": f"Schema '{schema_name}' check skipped (database '{db_name}' missing or unreachable)."
            }
            self.ko_count += 1

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_local_sandboxed_binaries()
        self.check_postgresql_db_is_running()
        self.check_postgresql_database_and_schema()
        return self.generate_summary()
