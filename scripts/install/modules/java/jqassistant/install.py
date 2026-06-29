import os
import sys
import ssl
import urllib.request
import urllib.error
import zipfile
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import info, success, error

@ModuleRegistry.register_installer
class JavaJQAssistantInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self._last_reported_percent = -5

    @property
    def name(self) -> str: return "java_jqassistant"

    def _download_progress_bar(self, block_num, block_size, total_size):
        if total_size <= 0: return
        read_so_far = block_num * block_size
        percent = min(100, int(read_so_far * 100 / total_size))
        if percent - self._last_reported_percent >= 5 or percent == 100:
            info(f"Downloading portable jQAssistant CLI distribution package: {percent}%", component=self.name)
            self._last_reported_percent = percent

    def fetch_and_extract_jqassistant(self):
        version = self.context.get_tool_setting("jqassistant", "version", "2.9.1")

        # REALIGNED PATH: Injecting tools framework mirror subdivision
        sandbox_root = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        target_folder = os.path.join(sandbox_root, f"jqassistant-{version}")

        if os.path.exists(target_folder):
            return

        os.makedirs(sandbox_root, exist_ok=True)
        local_zip_path = os.path.join(sandbox_root, "jqassistant.zip")

        default_url = f"https://github.com/jQAssistant/jqassistant/releases/download/{version}/jqassistant-commandline-neo4jv5-{version}-distribution.zip"
        url = self.context.get_tool_setting("jqassistant", "downloadUrl", default_url)
        url = url.replace("${version}", version)

        download_success = False
        original_context = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context

        try:
            info(f"Downloading jQAssistant portable binaries bundle directly from verified asset location: {url}", component=self.name)
            try:
                self._last_reported_percent = -5
                urllib.request.urlretrieve(url, local_zip_path, self._download_progress_bar)
                sys.stdout.write("\n")
                download_success = True
            except urllib.error.URLError as url_err:
                error(f"Target address responded with network fault or 404 code: {url_err}", component=self.name)
        finally:
            ssl._create_default_https_context = original_context

        if not download_success:
            raise FileNotFoundError("Network asset download failure. Verification loops terminated.")

        info("Extracting sandboxed jQAssistant binaries layout structures...", component=self.name)
        try:
            with zipfile.ZipFile(local_zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_folder)
            os.remove(local_zip_path)
            success(f"Standalone jQAssistant workspace package successfully provisioned inside tools repository: {target_folder}", component=self.name)
        except Exception as e:
            error(f"Decompression extraction pass failed mapping package contents: {e}", component=self.name)
            if os.path.exists(local_zip_path):
                try: os.remove(local_zip_path)
                except OSError: pass
            raise e

    def create_isolated_java_raw_target_folder(self):
        java_raw_output_dir = f"{self.context.workspace_root}/.graph-rag-explorer/target/raw_outputs/java"
        os.makedirs(java_raw_output_dir, exist_ok=True)

    def execute_all_installations(self) -> None:
        self.create_isolated_java_raw_target_folder()
        self.fetch_and_extract_jqassistant()
