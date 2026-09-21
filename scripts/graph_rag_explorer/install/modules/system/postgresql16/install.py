import os
import re
import sys
import ssl
import time
import shutil
import urllib.request
import tarfile
import zipfile
import subprocess
import socket
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info, success, error, warn
from install.modules.system.postgresql16.context import PostgresqlContext

POSTGRESQL_MODULE_NAME = "01_system_postgresql16"

@InstallerRegistry.register_installer
class SystemPostgresqlInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.pg_ctx = PostgresqlContext(context)

    @property
    def name(self) -> str:
        return POSTGRESQL_MODULE_NAME

    def _discover_and_link_system_postgresql(self) -> bool:
        candidate_dirs = []

        custom_env_bin = os.environ.get("POSTGRES_BIN_DIR")
        if custom_env_bin and os.path.exists(custom_env_bin):
            candidate_dirs.append(custom_env_bin)

        for path_dir in os.environ.get("PATH", "").split(os.pathsep):
            if path_dir and os.path.exists(path_dir):
                candidate_dirs.append(path_dir)

        candidate_dirs.extend([
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
        ])

        target_pg_ctl = "pg_ctl.exe" if self.context.is_windows else "pg_ctl"
        target_psql = "psql.exe" if self.context.is_windows else "psql"

        found_dir = None
        for c_dir in candidate_dirs:
            if os.path.exists(os.path.join(c_dir, target_pg_ctl)) or os.path.exists(os.path.join(c_dir, target_psql)):
                found_dir = c_dir
                break

        if found_dir:
            info(f"Discovered host system PostgreSQL binaries at: {found_dir}", component=self.name)
            os.makedirs(self.pg_ctx.bin_dir, exist_ok=True)
            for item in os.listdir(found_dir):
                src = os.path.join(found_dir, item)
                dst = os.path.join(self.pg_ctx.bin_dir, item)
                if not os.path.lexists(dst):
                    try:
                        if hasattr(os, "symlink") and not self.context.is_windows:
                            os.symlink(src, dst)
                        else:
                            shutil.copy2(src, dst)
                    except Exception:
                        pass
            return os.path.exists(self.pg_ctx.pg_ctl_cmd) or os.path.exists(self.pg_ctx.psql_cmd)
        return False

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

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        if installStatus is None:
            raise ValueError("installStatus cannot be None. Please provide the installation status dictionary.")

        os.makedirs(self.pg_ctx.sandbox_root, exist_ok=True)
        os.makedirs(self.pg_ctx.logs_dir, exist_ok=True)

        # 1. Verify and install binaries and environment
        if installStatus.get("postgresql_local_installation", {}).get("status") != "✅" or \
           installStatus.get("postgresql_environment_compliance", {}).get("status") != "✅":

            if not os.path.exists(self.pg_ctx.pg_ctl_cmd):
                if not self._discover_and_link_system_postgresql():
                    info("System PostgreSQL binaries not found locally. Attempting remote distribution package download...", component=self.name)
                    self.fetch_distribution_package()
                    if os.path.exists(os.path.join(self.pg_ctx.sandbox_root, self.pg_ctx.archive_name)):
                        self.extract_distribution()

            if not os.path.exists(os.path.join(self.pg_ctx.data_dir, "PG_VERSION")):
                self.initialize_data_cluster()

            if not self.context.is_windows:
                bin_dir = self.pg_ctx.bin_dir
                if os.path.exists(bin_dir):
                    info("Granting executable permissions to all internal utility scripts...", component=self.name)
                    for root, dirs, files in os.walk(bin_dir):
                        for file in files:
                            try:
                                os.chmod(os.path.join(root, file), 0o755)
                            except OSError:
                                pass

        self.configure_postgresql_settings()
        self.deploy_service_script()

        # 2. Boot database process using deployed service script
        if installStatus.get("postgresql_db_running", {}).get("status") != "✅":
            self.boot_postgresql_process()

        # 3. Ensure database 'graph_rag' and schema 'ai_architecture_auditor' exist
        if installStatus.get("postgresql_database_exists", {}).get("status") != "✅" or \
           installStatus.get("postgresql_schema_exists", {}).get("status") != "✅":
            self.ensure_database_and_schema_exist()

        success(
            f"PostgreSQL instance initialized smoothly. Host: {self.pg_ctx.host}:{self.pg_ctx.port} | "
            f"Database: {self.pg_ctx.database} | Schema: {self.pg_ctx.schema} "
            f"[User: {self.pg_ctx.user} | Pass: {self.pg_ctx.password}]",
            component=self.name
        )

    def deploy_service_script(self) -> None:
        source_script = os.path.join(os.path.dirname(__file__), "to-copy", "service.py")
        target_script = os.path.join(self.pg_ctx.sandbox_root, "service.py")

        if os.path.exists(source_script):
            shutil.copy2(source_script, target_script)
            if not self.context.is_windows:
                try:
                    os.chmod(target_script, 0o755)
                except OSError:
                    pass
            info(f"Deployed PostgreSQL service control script to: {target_script}", component=self.name)
        else:
            warn(f"Source service script missing at expected location: {source_script}", component=self.name)

    def fetch_distribution_package(self) -> None:
        archive_path = os.path.join(self.pg_ctx.sandbox_root, self.pg_ctx.archive_name)
        if os.path.exists(self.pg_ctx.pg_ctl_cmd):
            return

        raw_url = str(self.pg_ctx.download_url)
        match = re.search(r'https?://[^\s\]\)\'\"]+', raw_url)
        clean_url = match.group(0) if match else raw_url

        info(f"Fetching PostgreSQL 16 binary distribution package from: {clean_url}", component=self.name)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.enterprisedb.com/download-postgresql-binaries'
        }
        ctx = ssl._create_unverified_context()

        download_success = False

        try:
            req = urllib.request.Request(clean_url, headers=headers)
            with urllib.request.urlopen(req, context=ctx) as response:
                total_size = int(response.info().get('Content-Length', -1))
                block_size = 16384
                read_so_far = 0
                last_reported = -10
                with open(archive_path, 'wb') as out_file:
                    while True:
                        block = response.read(block_size)
                        if not block:
                            break
                        out_file.write(block)
                        read_so_far += len(block)
                        if total_size > 0:
                            percent = min(100, int(read_so_far * 100 / total_size))
                            if percent - last_reported >= 10 or percent == 100:
                                info(f"Downloading PostgreSQL archive progress: {percent}%", component=self.name)
                                last_reported = percent
            download_success = True
            success("Successfully completed download of PostgreSQL distribution archive.", component=self.name)
        except Exception as e:
            warn(f"Python urllib download failed ({e}). Attempting fallback options...", component=self.name)

        if not download_success:
            if shutil.which("curl"):
                info("Attempting package download via curl CLI...", component=self.name)
                try:
                    res = subprocess.run(
                        ["curl", "-sSL", "-A", headers['User-Agent'], "-o", archive_path, clean_url],
                        timeout=120,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    if res.returncode == 0 and os.path.exists(archive_path) and os.path.getsize(archive_path) > 1000000:
                        download_success = True
                        success("Successfully downloaded PostgreSQL package via curl CLI.", component=self.name)
                except Exception as ce:
                    warn(f"curl download attempt failed: {ce}", component=self.name)

        if not download_success:
            if os.path.exists(archive_path):
                try: os.remove(archive_path)
                except OSError: pass

            warn("Remote archive download unreachable. Searching host system for PostgreSQL binaries...", component=self.name)
            if self._discover_and_link_system_postgresql():
                success("Successfully linked system PostgreSQL binaries into project sandbox.", component=self.name)
                return

            error(
                "EnterpriseDB package download was blocked and no local PostgreSQL installation was found. "
                "Please install PostgreSQL on your system (e.g. `brew install postgresql@16`, `apt install postgresql-16`, or `winget install PostgreSQL.PostgreSQL.16`).",
                component=self.name
            )
            raise RuntimeError("Unable to acquire PostgreSQL binaries.")

    def extract_distribution(self) -> None:
        archive_path = os.path.join(self.pg_ctx.sandbox_root, self.pg_ctx.archive_name)
        if os.path.exists(archive_path):
            info("Extracting PostgreSQL structural layout archives...", component=self.name)
            if self.context.is_windows:
                with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                    zip_ref.extractall(self.pg_ctx.sandbox_root)
            else:
                with tarfile.open(archive_path, "r:gz") as tar_ref:
                    tar_ref.extractall(self.pg_ctx.sandbox_root)
            try:
                os.remove(archive_path)
            except OSError:
                pass

    def initialize_data_cluster(self) -> None:
        if os.path.exists(os.path.join(self.pg_ctx.data_dir, "PG_VERSION")):
            return

        info("Initializing PostgreSQL database cluster (initdb)...", component=self.name)
        os.makedirs(self.pg_ctx.data_dir, exist_ok=True)
        try:
            cmd = [
                self.pg_ctx.initdb_cmd,
                "-D", self.pg_ctx.data_dir,
                "-U", self.pg_ctx.user,
                "-A", "trust",
                "--encoding=UTF8"
            ]
            subprocess.run(cmd, env=self.pg_ctx.env, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            success("Database cluster initialized successfully.", component=self.name)
        except subprocess.CalledProcessError as err:
            stderr_out = err.stderr.decode('utf-8', errors='ignore') if err.stderr else str(err)
            error(f"initdb execution failed: {stderr_out}", component=self.name)
            raise RuntimeError(f"PostgreSQL cluster initialization failed: {stderr_out}")

    def configure_postgresql_settings(self) -> None:
        conf_path = os.path.join(self.pg_ctx.data_dir, "postgresql.conf")
        hba_path = os.path.join(self.pg_ctx.data_dir, "pg_hba.conf")

        if not os.path.exists(conf_path):
            return

        info("Tuning configuration layout files for PostgreSQL 16...", component=self.name)
        marker = "# 🔓 Sandbox UI Additions for Graph RAG Explorer"

        pg_configs = (
            f"\n{marker}\n"
            f"listen_addresses = '*'\n"
            f"port = {self.pg_ctx.port}\n"
            "max_connections = 100\n"
        )

        hba_configs = (
            f"\n{marker}\n"
            "host    all             all             0.0.0.0/0               trust\n"
            "host    all             all             ::/0                    trust\n"
        )

        try:
            with open(conf_path, "r", encoding="utf-8") as f:
                content = f.read()
            if marker not in content:
                with open(conf_path, "a", encoding="utf-8") as f:
                    f.write(pg_configs)

            if os.path.exists(hba_path):
                with open(hba_path, "r", encoding="utf-8") as f:
                    hba_content = f.read()
                if marker not in hba_content:
                    with open(hba_path, "a", encoding="utf-8") as f:
                        f.write(hba_configs)

            success("PostgreSQL configuration tuned and validated.", component=self.name)
        except Exception as e:
            error(f"Failed to patch PostgreSQL config files: {e}", component=self.name)

    def boot_postgresql_process(self) -> None:
        info("Spinning up PostgreSQL engine operations...", component=self.name)

        service_script = os.path.join(self.pg_ctx.sandbox_root, "service.py")

        if not os.path.exists(service_script):
            error(f"Service script missing at expected path: {service_script}", component=self.name)
            raise FileNotFoundError(f"Service script not found at {service_script}")

        try:
            res = subprocess.run(
                [sys.executable, service_script, "start"],
                env=self.pg_ctx.env,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if res.stdout.strip():
                info(f"Service manager response:\n{res.stdout.strip()}", component=self.name)
            success("PostgreSQL database started successfully via service script.", component=self.name)

        except subprocess.CalledProcessError as err:
            logs = []
            if err.stdout and err.stdout.strip():
                logs.append(f"STDOUT:\n{err.stdout.strip()}")
            if err.stderr and err.stderr.strip():
                logs.append(f"STDERR:\n{err.stderr.strip()}")

            error_output = "\n".join(logs) if logs else str(err)
            error(f"Failed to start PostgreSQL via service script:\n{error_output}", component=self.name)
            raise RuntimeError(f"PostgreSQL startup via service.py aborted:\n{error_output}")


    def ensure_database_and_schema_exist(self) -> None:
        host = self.pg_ctx.host
        port = int(self.pg_ctx.port)
        db_name = self.pg_ctx.database
        schema_name = self.pg_ctx.schema

        info(f"Waiting for PostgreSQL port {port} to accept connections...", component=self.name)
        timeout = 30
        start_time = time.time()
        port_ready = False

        while time.time() - start_time < timeout:
            try:
                with socket.create_connection((host, port), timeout=2):
                    port_ready = True
                    break
            except (socket.timeout, ConnectionRefusedError):
                time.sleep(1)

        if not port_ready:
            raise TimeoutError(f"PostgreSQL port {port} didn't open within {timeout} seconds.")

        psql_bin = self._find_psql_binary()
        if not psql_bin:
            error("Could not locate 'psql' binary to verify or create database/schema.", component=self.name)
            raise RuntimeError("psql binary missing")

        env = os.environ.copy()
        env["PGPASSWORD"] = self.pg_ctx.password

        # 1. Create target database 'graph_rag' if missing
        info(f"Checking if database '{db_name}' exists...", component=self.name)
        check_db_cmd = [
            psql_bin, "-h", host, "-p", str(port), "-U", self.pg_ctx.user,
            "-d", "postgres", "-tAc", f"SELECT 1 FROM pg_database WHERE datname = '{db_name}';"
        ]
        try:
            res = subprocess.run(check_db_cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if "1" not in res.stdout.strip():
                info(f"Database '{db_name}' not found. Creating database...", component=self.name)
                create_db_cmd = [
                    psql_bin, "-h", host, "-p", str(port), "-U", self.pg_ctx.user,
                    "-d", "postgres", "-c", f"CREATE DATABASE \"{db_name}\";"
                ]
                res_create = subprocess.run(create_db_cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                if res_create.returncode == 0:
                    success(f"Successfully created database '{db_name}'.", component=self.name)
                else:
                    error(f"Failed to create database '{db_name}': {res_create.stderr.strip()}", component=self.name)
                    raise RuntimeError(f"Database creation failed: {res_create.stderr.strip()}")
            else:
                info(f"Database '{db_name}' already exists.", component=self.name)
        except Exception as e:
            error(f"Failed to verify or create database '{db_name}': {e}", component=self.name)
            raise

        # 2. Create schema 'ai_architecture_auditor' inside database 'graph_rag'
        info(f"Ensuring schema '{schema_name}' exists inside database '{db_name}'...", component=self.name)
        create_schema_cmd = [
            psql_bin, "-h", host, "-p", str(port), "-U", self.pg_ctx.user,
            "-d", db_name, "-c", f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\";"
        ]
        try:
            res_schema = subprocess.run(create_schema_cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res_schema.returncode == 0:
                success(f"Successfully verified/created schema '{schema_name}' in database '{db_name}'.", component=self.name)
            else:
                error(f"Failed to create schema '{schema_name}': {res_schema.stderr.strip()}", component=self.name)
                raise RuntimeError(f"Schema creation failed: {res_schema.stderr.strip()}")
        except Exception as e:
            error(f"Failed to ensure schema '{schema_name}': {e}", component=self.name)
            raise
