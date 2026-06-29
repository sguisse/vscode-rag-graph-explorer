import os
import sys
import ssl
import urllib.request
import tarfile
import zipfile
import subprocess
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import info, success, error

@ModuleRegistry.register_installer
class SystemNeo4jInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self._last_reported_percent = -5

    @property
    def name(self) -> str: return "system_neo4j"

    def _download_progress_bar(self, block_num, block_size, total_size):
        if total_size <= 0: return
        read_so_far = block_num * block_size
        percent = min(100, int(read_so_far * 100 / total_size))
        if percent - self._last_reported_percent >= 5 or percent == 100:
            info(f"Downloading Neo4j Graph Platform Archive: {percent}%", component=self.name)
            self._last_reported_percent = percent

    def fetch_and_extract_distribution(self):
        version = self.context.get_tool_setting("neo4j", "version", "5.26.0")
        is_windows = (os.name == 'nt')
        archive_name = f"neo4j-community-{version}-windows.zip" if is_windows else f"neo4j-community-{version}-unix.tar.gz"

        # REALIGNED PATH: Provisioning target/tools/system/neo4j as isolation context root
        sandbox_root = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/system/neo4j"
        target_folder = os.path.join(sandbox_root, f"neo4j-community-{version}")

        if os.path.exists(target_folder):
            return

        os.makedirs(sandbox_root, exist_ok=True)
        url = f"https://dist.neo4j.org/{archive_name}"
        local_archive_path = os.path.join(sandbox_root, archive_name)

        if not os.path.exists(local_archive_path):
            info(f"Starting download from destination URL: {url}", component=self.name)
            try:
                original_https_context = ssl._create_default_https_context
                ssl._create_default_https_context = ssl._create_unverified_context
                try:
                    urllib.request.urlretrieve(url, local_archive_path, self._download_progress_bar)
                finally:
                    ssl._create_default_https_context = original_https_context
            except Exception as e:
                error(f"Network request timeout or download pipeline block exception context: {e}", component=self.name)
                raise e

        info(f"Decompressing structural layout archives onto tools target context...", component=self.name)
        if is_windows:
            with zipfile.ZipFile(local_archive_path, 'r') as zip_ref:
                zip_ref.extractall(sandbox_root)
        else:
            with tarfile.open(local_archive_path, "r:gz") as tar_ref:
                tar_ref.extractall(sandbox_root)

        try: os.remove(local_archive_path)
        except OSError: pass

    def configure_credentials_and_boot(self):
        version = self.context.get_tool_setting("neo4j", "version", "5.26.0")
        password = self.context.get_tool_setting("neo4j", "password", "password")
        is_windows = (os.name == 'nt')

        target_folder = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/system/neo4j/neo4j-community-{version}"
        bin_dir = os.path.join(target_folder, "bin")
        admin_cmd = os.path.join(bin_dir, "neo4j-admin.bat" if is_windows else "neo4j-admin")
        neo4j_cmd = os.path.join(bin_dir, "neo4j.bat" if is_windows else "neo4j")

        if not is_windows:
            os.chmod(admin_cmd, 0o755)
            os.chmod(neo4j_cmd, 0o755)

        info("Initializing system administrator authorization credentials token inside Neo4j engine...", component=self.name)
        try:
            subprocess.run([admin_cmd, "dbms", "set-initial-password", password], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:
            pass

        info("Spinning up native standalone data cluster mapping engine operations...", component="SystemNeo4j")
        pids_dir = f"{self.context.workspace_root}/.graph-rag-explorer/target/pids"
        os.makedirs(pids_dir, exist_ok=True)

        if is_windows:
            proc = subprocess.Popen([neo4j_cmd, "console"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            with open(os.path.join(pids_dir, f"neo4j_instance_{proc.pid}.pid"), "w", encoding="utf-8") as f:
                f.write(str(proc.pid))
        else:
            proc = subprocess.Popen([neo4j_cmd, "start"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, preexec_fn=os.setsid)
            with open(os.path.join(pids_dir, f"neo4j_instance_{proc.pid}.pid"), "w", encoding="utf-8") as f:
                f.write(str(proc.pid))

        success(f"Neo4j instance initialized smoothly over active Bolt profile: bolt://localhost:7687 [User: neo4j | Pass: {password}]", component=self.name)

    def execute_all_installations(self) -> None:
        self.fetch_and_extract_distribution()
        self.configure_credentials_and_boot()
