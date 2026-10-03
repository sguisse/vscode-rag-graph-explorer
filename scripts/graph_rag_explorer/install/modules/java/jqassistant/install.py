import os
import sys
import ssl
import json
import re
import shutil
import zipfile
import urllib.request
import urllib.error
from typing import Optional
from install.install import GraphRagExplorerInstall
from core.installer.registry import InstallerRegistry
from core.utils import info, success, error, warn
from graph_rag_explorer.services.sources_discovery import discover_workspace_sources
from install.modules.java.jqassistant.check import JQAssistantChecker
from install.modules.java.jqassistant.context import JQASSISTANT_MODULE_NAME, JQAssistantContext
from core.VsCodeSettings_gen import vsCodeSettings

@InstallerRegistry.register_installer
class JavaJQAssistantInstaller(GraphRagExplorerInstall):
    def __init__(self, context):
        super().__init__(context)
        self.jqa = JQAssistantContext(context)

        self._last_reported_percent = -5

    @property
    def name(self) -> str: return JQASSISTANT_MODULE_NAME

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


    # Directories never scanned for configuration / workflow files
    _SKIPPED_DIRS = {"node_modules", "target", ".git", "dist", "out", ".idea", ".vscode", ".history", ".token-razor"}

    def _discover_config_dirs(self) -> list:
        """src/main/resources and .github/workflows directories (YAML 2 / XML plugins)."""
        found = []
        for root, dirs, _files in os.walk(self.context.workspace_root):
            dirs[:] = [d for d in dirs if d not in self._SKIPPED_DIRS]
            norm = root.replace("\\", "/")
            if norm.endswith("/src/main/resources") or norm.endswith("/.github/workflows"):
                found.append(norm)
                dirs[:] = []
        return sorted(found)

    @staticmethod
    def _read_flat_yaml(path: str) -> dict:
        """Reads flat 'name: value' pairs (comments allowed), no YAML dependency required."""
        params = {}
        if not os.path.isfile(path):
            return params
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                key, value = line.split(":", 1)
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                    value = value[1:-1]
                if key.strip() and value:
                    params[key.strip()] = value
        return params

    def _install_rule_packs(self) -> list:
        """Copies the portable packs and the application pack XML files verbatim. Returns the application audit group ids."""
        copied = 0
        if os.path.isdir(self.jqa.rule_packs_dir):
            for name in sorted(os.listdir(self.jqa.rule_packs_dir)):
                if name.endswith(".xml"):
                    shutil.copyfile(os.path.join(self.jqa.rule_packs_dir, name), os.path.join(self.jqa.rules_dir, name))
                    copied += 1
        app_groups = []
        if os.path.isdir(self.jqa.app_pack_dir):
            for name in sorted(os.listdir(self.jqa.app_pack_dir)):
                if not name.endswith(".xml"):
                    continue
                shutil.copyfile(os.path.join(self.jqa.app_pack_dir, name), os.path.join(self.jqa.rules_dir, name))
                copied += 1
                with open(os.path.join(self.jqa.app_pack_dir, name), "r", encoding="utf-8") as f:
                    app_groups.extend(re.findall(r'<group\s+id="([^"]+:Audit)"', f.read()))
        info(f"{copied} rule pack file(s) copied into {self.jqa.rules_dir}", component=self.name)
        return sorted(set(app_groups))

    def install_config_and_rules(self):
        os.makedirs(self.jqa.config_dir, exist_ok=True)
        os.makedirs(self.jqa.rules_dir, exist_ok=True)
        os.makedirs(self.jqa.raw_outputs_dir, exist_ok=True)

        discovered = discover_workspace_sources(self.context.workspace_root, self.jqa.exclude_paths_regex)

        #---------------
        with open(self.jqa.jqassistant_template_path, "r", encoding="utf-8") as f:
            content = f.read()

        yaml_lines = []
        for key, paths in discovered.items():
            if paths:
                yaml_lines.extend([f"        - '{path}'" for path in paths])

        jqa_src_yaml = "\n".join(yaml_lines)

        #---------------
        # Search for the root pom.xml and all child pom.xml files in the workspace
        pom_xml_yaml_list = []
        for root, dirs, files in os.walk(self.context.workspace_root):
            if "pom.xml" in files:
                # If path not contains "target", add it to the list
                if "target" not in root:
                    pom_xml_yaml_list.extend([f"        - '{os.path.join(root, 'pom.xml')}'"])
        jqa_pom_yaml = "\n".join(pom_xml_yaml_list)

        #---------------
        # Configuration / workflow directories, application rule parameters and application audit groups
        jqa_config_yaml = "\n".join(f"        - '{path}'" for path in self._discover_config_dirs())
        app_params = self._read_flat_yaml(os.path.join(self.jqa.app_pack_dir, "rule-parameters.yml"))
        jqa_params_yaml = "\n".join(f"      {key}: '{value.replace(chr(39), chr(39) * 2)}'" for key, value in app_params.items()) or "      {}"
        app_groups = self._install_rule_packs()
        jqa_groups_yaml = "\n".join(f"      - '{group}'" for group in app_groups)

        neo4j_uri = vsCodeSettings.graphRagExplorer.neo4j.uri
        neo4j_user = vsCodeSettings.graphRagExplorer.neo4j.username
        neo4j_pass = vsCodeSettings.graphRagExplorer.neo4j.password
        project_name = os.path.basename(self.context.workspace_root)

        content = re.sub(r'[ \t]*\{\{JQA_POM_FILES_YAML_LIST\}\}', '{{JQA_POM_FILES_YAML_LIST}}', content)
        content = re.sub(r'[ \t]*\{\{JQA_SRC_DIRS_YAML_LIST\}\}', '{{JQA_SRC_DIRS_YAML_LIST}}', content)
        content = re.sub(r'[ \t]*\{\{JQA_CONFIG_DIRS_YAML_LIST\}\}', '{{JQA_CONFIG_DIRS_YAML_LIST}}', content)
        content = re.sub(r'[ \t]*\{\{JQA_RULE_PARAMETERS_YAML\}\}', '{{JQA_RULE_PARAMETERS_YAML}}', content)
        content = re.sub(r'[ \t]*\{\{JQA_APP_GROUPS_YAML\}\}', '{{JQA_APP_GROUPS_YAML}}', content)

        content = content.replace("{{JQA_BOLT_URL}}", neo4j_uri)\
                         .replace("{{JQA_BOLT_USERNAME}}", neo4j_user)\
                         .replace("{{JQA_BOLT_PASSWORD}}", neo4j_pass)\
                         .replace("{{JQA_POM_FILES_YAML_LIST}}", jqa_pom_yaml)\
                         .replace("{{JQA_SRC_DIRS_YAML_LIST}}", jqa_src_yaml)\
                         .replace("{{JQA_CONFIG_DIRS_YAML_LIST}}", jqa_config_yaml)\
                         .replace("{{JQA_RULE_PARAMETERS_YAML}}", jqa_params_yaml)\
                         .replace("{{JQA_APP_GROUPS_YAML}}", jqa_groups_yaml)\
                         .replace("{{PROJECT_NAME}}", project_name)\
                         .replace("{{JQA_RULES_DIRECTORY}}", self.jqa.rules_dir.replace("\\", "/"))\


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
