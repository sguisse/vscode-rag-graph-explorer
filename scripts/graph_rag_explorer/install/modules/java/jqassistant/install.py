import os
import sys
import ssl
import json
import re
import zipfile
import urllib.request
import urllib.error
from typing import Optional
from install.base import BaseInstallModule
from install.registry import InstallerRegistry
from core.utils import info, success, error, warn
from core.sources_discovery import discover_workspace_sources
from install.modules.java.jqassistant.check import JQAssistantChecker
from install.modules.java.jqassistant.context import JQAssistantContext
from core.VsCodeSettings_gen import vsCodeSettings

@InstallerRegistry.register_installer
class JavaJQAssistantInstaller(BaseInstallModule):
    def __init__(self, context):
        super().__init__(context)
        self.jqa = JQAssistantContext(context)

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
        target_folder = os.path.join(self.jqa.tools_dir, f"jqassistant-{self.jqa.version}")

        if os.path.exists(target_folder): return

        os.makedirs(self.jqa.tools_dir, exist_ok=True)
        local_zip_path = os.path.join(self.jqa.tools_dir, "jqassistant.zip")
        download_success = False
        original_context = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context

        try:
            info(f"Downloading jQAssistant portable binaries bundle: {self.jqa.download_url}", component=self.name)
            try:
                self._last_reported_percent = -5
                urllib.request.urlretrieve(self.jqa.download_url, local_zip_path, self._download_progress_bar)
                sys.stdout.write("\n")
                download_success = True
            except urllib.error.URLError as url_err:
                error(f"Target address responded with network fault: {url_err}", component=self.name)
        except Exception as e:
            error(f"Parallel download context failure: {e}", component=self.name)
        finally:
            ssl._create_default_https_context = original_context

        if not download_success:
            raise FileNotFoundError("Network asset download failure. Verification loops terminated.")

        info("Extracting sandboxed jQAssistant binaries...", component=self.name)
        try:
            with zipfile.ZipFile(local_zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_folder)
            os.remove(local_zip_path)
            success(f"jQAssistant workspace package successfully provisioned: {target_folder}", component=self.name)
        except Exception as e:
            error(f"Decompression extraction failed: {e}", component=self.name)
            if os.path.exists(local_zip_path):
                try: os.remove(local_zip_path)
                except OSError: pass
            raise e


    def install_config_and_rules(self):
        os.makedirs(self.jqa.config_dir, exist_ok=True)
        os.makedirs(self.jqa.rules_dir, exist_ok=True)
        os.makedirs(self.jqa.raw_outputs_dir, exist_ok=True)

        discovered = discover_workspace_sources(self.context.workspace_root, self.jqa.exclude_paths_regex)

        #---------------
        with open(self.jqa.jqassistant_template_path, "r", encoding="utf-8") as f:
            content = f.read()

        jqa_src_yaml  = "\n".join([f"        - '{path}'" for path in discovered["java_src"]])
        jqa_src_yaml += "\n"
        jqa_src_yaml += "\n".join([f"        - '{path}'" for path in discovered["java_classes"]])

        neo4j_uri = vsCodeSettings.graphRagExplorer.neo4j.uri
        neo4j_user = vsCodeSettings.graphRagExplorer.neo4j.username
        neo4j_pass = vsCodeSettings.graphRagExplorer.neo4j.password
        project_name = os.path.basename(self.context.workspace_root)

        content = re.sub(r'[ \t]*\{\{JQA_SRC_DIRS_YAML_LIST\}\}', '{{JQA_SRC_DIRS_YAML_LIST}}', content)

        content = content.replace("{{JQA_BOLT_URL}}", neo4j_uri)\
                         .replace("{{JQA_BOLT_USERNAME}}", neo4j_user)\
                         .replace("{{JQA_BOLT_PASSWORD}}", neo4j_pass)\
                         .replace("{{JQA_SRC_DIRS_YAML_LIST}}", jqa_src_yaml)\
                         .replace("{{PROJECT_NAME}}", project_name)\
                         .replace("{{JQA_RULES_DIRECTORY}}", self.jqa.rules_dir.replace("\\", "/"))

        # Centrally deposit configuration file inside tools sandbox config resource route
        with open(self.jqa.custom_config_path, "w", encoding="utf-8") as f:
            f.write(content)

        #---------------
        target_rules = f"{self.jqa.rules_dir}/{project_name}-rules.xml"
        with open(self.jqa.analysis_rules_template, "r", encoding="utf-8") as f:
            rules_content = f.read().replace("{{PROJECT_NAME}}", project_name)

        with open(target_rules, "w", encoding="utf-8") as f:
            f.write(rules_content)

        success(f"JQAssistant rules dropped into {target_rules}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations. Critical: Raises a hard blocking exception if the remote token is invalid."""
        checker = JQAssistantChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("java", {}).get("status") != "✅":
            raise RuntimeError("Blocking Error: Missing mandatory system-wide Java compilation JRE environment dependency framework layout.")

        if installStatus.get("jqassistant_binary", {}).get("status") != "✅":
            self.fetch_and_extract_jqassistant()

        if (installStatus.get("jqassistant_custom_config", {}).get("status") != "✅" or
            installStatus.get("jqassistant_custom_rules", {}).get("status") != "✅"):
            self.install_config_and_rules()


        # Enforce strict token validation checkpoints only if database infrastructure layer stands loaded
        post_check_status = checker.execute_all_checks()
        if post_check_status.get("remote_database_token", {}).get("status") != "✅":
            raise RuntimeError("Blocking Error: 'Remote-Database = true' metadata initialization token validation failed. jqassistant cannot proceed with ingestion lifecycle without this critical database configuration property being set.")
