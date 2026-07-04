import os
import sys
import ssl
import time
import shutil
import urllib.request
import tarfile
import zipfile
import subprocess
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info, success, error, warn
from install.modules.system.neo4j.context import Neo4jContext

NEO4J_MODULE_NAME = "01_system_neo4j"

@InstallerRegistry.register_installer
class SystemNeo4jInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.neo4j_ctx = Neo4jContext(context)

        self._last_reported_percent = -5


    @property
    def name(self) -> str: return NEO4J_MODULE_NAME

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        if installStatus is None:
            raise ValueError("installStatus cannot be None. Please provide the installation status dictionary.")

        # Création du dossier racine
        os.makedirs(self.neo4j_ctx.sandbox_root, exist_ok=True)

        # 1. Vérification et installation des binaires et plugins
        if installStatus.get("neo4j_local_installation", {}).get("status") != "✅" or \
           installStatus.get("neo4j_plugins_compliance", {}).get("status") != "✅":

            self.fetch_distribution_packages(
                self.neo4j_ctx.sandbox_root, self.neo4j_ctx.archive_name,
                self.neo4j_ctx.apoc_tmp_path, self.neo4j_ctx.gds_zip_name,
                self.neo4j_ctx.gds_tmp_path, self.neo4j_ctx.admin_cmd,
                self.neo4j_ctx.apoc_jar_path, self.neo4j_ctx.gds_jar_path,
                self.neo4j_ctx.version, self.neo4j_ctx.gds_version
            )
            self.extract_distribution(self.neo4j_ctx.sandbox_root, self.neo4j_ctx.archive_name)
            self.provision_plugins(
                self.neo4j_ctx.plugins_dir, self.neo4j_ctx.apoc_tmp_path,
                self.neo4j_ctx.apoc_jar_path, self.neo4j_ctx.gds_tmp_path,
                self.neo4j_ctx.gds_jar_path
            )
            self.configure_neo4j_settings(self.neo4j_ctx.target_folder)

            # Rendre les scripts exécutables sous Unix
            if not self.context.is_windows:
                for cmd in [self.neo4j_ctx.admin_cmd, self.neo4j_ctx.neo4j_cmd, self.neo4j_ctx.shell_cmd]:
                    if os.path.exists(cmd):
                        os.chmod(cmd, 0o755)

            self.set_initial_admin_password(self.neo4j_ctx.admin_cmd, self.neo4j_ctx.password)

        # 2. Démarrage de la base de données
        if installStatus.get("neo4j_db_running", {}).get("status") != "✅":
            self.boot_neo4j_process(self.neo4j_ctx.neo4j_cmd)

        # 3. Initialisation du Token Métadonnées
        if installStatus.get("remote_database_token", {}).get("status") != "✅":
            self.initialize_remote_database_token(
                self.neo4j_ctx.shell_cmd
            )

        success(f"Neo4j instance initialized smoothly. Browser UI: {self.neo4j_ctx.http_url} | Bolt profile: {self.neo4j_ctx.bolt_uri} [User: {self.neo4j_ctx.user} | Pass: {self.neo4j_ctx.password}]", component=self.name)


    def _download_file(self, url, local_path, asset_name, headers, ctx):
        if os.path.exists(local_path):
            return
        info(f"Starting parallel download for asset: {asset_name}", component=self.name)
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx) as response:
                total_size = int(response.info().get('Content-Length', -1))
                block_size = 16384
                read_so_far = 0
                last_reported_percent = -10
                with open(local_path, 'wb') as out_file:
                    while True:
                        block = response.read(block_size)
                        if not block: break
                        out_file.write(block)
                        read_so_far += len(block)
                        if total_size > 0:
                            percent = min(100, int(read_so_far * 100 / total_size))
                            if percent - last_reported_percent >= 10 or percent == 100:
                                info(f"Downloading {asset_name} progress: {percent}%", component=self.name)
                                last_reported_percent = percent
            success(f"Successfully completed download for: {asset_name}", component=self.name)
        except Exception as e:
            error(f"Parallel download context failure for {asset_name}: {e}", component=self.name)
            if os.path.exists(local_path):
                try: os.remove(local_path)
                except OSError: pass
            raise e

    def fetch_distribution_packages(self, sandbox_root, archive_name, apoc_tmp_path, gds_zip_name, gds_tmp_path, admin_cmd, apoc_jar_path, gds_jar_path, version, gds_version):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*;q=0.8',
        }
        ctx = ssl._create_unverified_context()
        download_tasks = []

        if not os.path.exists(admin_cmd):
            dist_url = f"https://dist.neo4j.org/{archive_name}"
            download_tasks.append((dist_url, os.path.join(sandbox_root, archive_name), archive_name))

        if not os.path.exists(apoc_jar_path):
            apoc_url = f"https://github.com/neo4j/apoc/releases/download/{version}/apoc-{version}-core.jar"
            download_tasks.append((apoc_url, apoc_tmp_path, f"apoc-{version}-core.jar"))

        if not os.path.exists(gds_jar_path):
            gds_zip_url = f"https://github.com/neo4j/graph-data-science/releases/download/{gds_version}/{gds_zip_name}"
            download_tasks.append((gds_zip_url, gds_tmp_path, gds_zip_name))

        if download_tasks:
            info(f"Launching {len(download_tasks)} download threads concurrently...", component=self.name)
            with ThreadPoolExecutor(max_workers=len(download_tasks)) as executor:
                futures = [
                    executor.submit(self._download_file, url, path, name, headers, ctx)
                    for url, path, name in download_tasks
                ]
                for future in futures:
                    future.result()

    def extract_distribution(self, sandbox_root, archive_name):
        local_archive_path = os.path.join(sandbox_root, archive_name)
        if os.path.exists(local_archive_path):
            info("Decompressing structural layout archives onto tools target context...", component=self.name)
            if os.name == 'nt':
                with zipfile.ZipFile(local_archive_path, 'r') as zip_ref:
                    zip_ref.extractall(sandbox_root)
            else:
                with tarfile.open(local_archive_path, "r:gz") as tar_ref:
                    tar_ref.extractall(sandbox_root)
            try: os.remove(local_archive_path)
            except OSError: pass

    def provision_plugins(self, plugins_dir, apoc_tmp_path, apoc_jar_path, gds_tmp_path, gds_jar_path):
        os.makedirs(plugins_dir, exist_ok=True)
        if os.path.exists(apoc_tmp_path):
            shutil.move(apoc_tmp_path, apoc_jar_path)

        if os.path.exists(gds_tmp_path):
            info("Extracting GDS JAR from downloaded archive...", component=self.name)
            with zipfile.ZipFile(gds_tmp_path, 'r') as zip_ref:
                jar_filename = next((f.filename for f in zip_ref.infolist() if f.filename.endswith(".jar")), None)
                if jar_filename:
                    with zip_ref.open(jar_filename) as zf, open(gds_jar_path, 'wb') as f:
                        f.write(zf.read())
                else:
                    raise Exception("No .jar file found inside the GDS zip archive.")
            try: os.remove(gds_tmp_path)
            except OSError: pass

    def configure_neo4j_settings(self, target_folder):
        conf_path = os.path.join(target_folder, "conf", "neo4j.conf")
        if not os.path.exists(conf_path):
            return

        info("Tuning configuration layout files for semantic graph expansion...", component=self.name)

        security_configs = (
            "\n# 🔓 Sandbox UI Additions for Graph RAG Explorer Security Adjustments\n"
            "dbms.security.procedures.unrestricted=apoc.*,gds.*\n"
            "dbms.security.procedures.allowlist=apoc.*,gds.*\n"
            "apoc.export.file.enabled=true\n"
            "apoc.import.file.enabled=true\n"
            "apoc.import.file.use_neo4j_config=true\n"
            f"server.bolt.listen_address=0.0.0.0:{self.neo4j_ctx.bolt_port}\n"
            f"server.http.listen_address=0.0.0.0:{self.neo4j_ctx.http_port}\n"
        )

        try:
            with open(conf_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "dbms.security.procedures.unrestricted" not in content:
                with open(conf_path, "a", encoding="utf-8") as f:
                    f.write(security_configs)
        except Exception as e:
            error(f"Failed to patch config parameters: {e}", component=self.name)

    def set_initial_admin_password(self, admin_cmd, password):
        info("Initializing system administrator authorization credentials token inside Neo4j engine...", component=self.name)
        try:
            subprocess.run([admin_cmd, "dbms", "set-initial-password", password], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:
            pass

    def boot_neo4j_process(self, neo4j_cmd):
        info("Spinning up native standalone data cluster mapping engine operations...", component="self.name")
        os.makedirs(self.context.pids_dir, exist_ok=True)

        if self.context.is_windows:
            proc = subprocess.Popen([neo4j_cmd, "console"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 512))
            with open(os.path.join(self.context.pids_dir, f"neo4j_instance_{proc.pid}.pid"), "w", encoding="utf-8") as f:
                f.write(str(proc.pid))
        else:
            proc = subprocess.Popen([neo4j_cmd, "start"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, preexec_fn=os.setsid)
            with open(os.path.join(self.context.pids_dir, f"neo4j_instance_{proc.pid}.pid"), "w", encoding="utf-8") as f:
                f.write(str(proc.pid))
        time.sleep(12)


    def initialize_remote_database_token(self, shell_cmd):
        """Adds Remote-Database=true if missing. Bypasses blocking errors."""
        try:
            info("Ensuring verification environment metadata label presence...", component=self.name)
            verification_query = "MERGE (m:SystemMetadata {id: 'global_config'}) SET m.`Remote-Database` = true;"
            subprocess.run([shell_cmd, "-a", f"{self.neo4j_ctx.bolt_uri}", "-u", self.neo4j_ctx.user, "-p", self.neo4j_ctx.password, verification_query], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            success("Successfully added 'Remote-Database = true' token inside Neo4j instance.", component=self.name)
        except Exception as err:
            warn(f"Bypassed metadata injection (non-blocking exception caught): {err}", component=self.name)
