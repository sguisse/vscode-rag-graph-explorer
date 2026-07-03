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
from install.registry import ModuleRegistry
from core.utils import info, success, error, warn
from core.sources_discovery import discover_workspace_sources
from install.modules.java.jqassistant.check import JavaJQAssistantChecker

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
        version = self.context.get_vscode_setting("jqassistant", "version")
        jqa_tool_root = f"{self.context.tools_dir}/java/jqassistant"
        target_folder = os.path.join(jqa_tool_root, f"jqassistant-{version}")

        if os.path.exists(target_folder): return

        os.makedirs(jqa_tool_root, exist_ok=True)
        local_zip_path = os.path.join(jqa_tool_root, "jqassistant.zip")
        url = self.context.get_vscode_setting("jqassistant", "downloadUrl", "")

        download_success = False
        original_context = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context

        try:
            info(f"Downloading jQAssistant portable binaries bundle: {url}", component=self.name)
            try:
                self._last_reported_percent = -5
                urllib.request.urlretrieve(url, local_zip_path, self._download_progress_bar)
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

    def inject_mcp_server_config(self):
        mcp_dir = os.path.join(self.context.workspace_root, ".vscode")
        os.makedirs(mcp_dir, exist_ok=True)
        mcp_path = os.path.join(mcp_dir, "mcp.json")

        template_path = os.path.join(os.path.dirname(__file__), "config", "templates", "mcp-server-template.json")
        if not os.path.exists(template_path):
            error("MCP Server template missing from installer resources.", component=self.name)
            return

        with open(template_path, "r", encoding="utf-8") as f:
            template_content = f.read()

        mcp_host = self.context.get_vscode_setting("jqassistant", "mcp.host")
        mcp_port = self.context.get_vscode_setting("jqassistant", "mcp.port")
        template_content = template_content.replace("{{JQA_MCP_HOST}}", str(mcp_host)).replace("{{JQA_MCP_PORT}}", str(mcp_port))

        try:
            template_data = json.loads(template_content)
        except json.JSONDecodeError as e:
            error(f"Malformed MCP template JSON: {e}", component=self.name)
            return

        mcp_data = {}
        if os.path.exists(mcp_path):
            try:
                with open(mcp_path, "r", encoding="utf-8") as f:
                    mcp_data = json.load(f)
            except json.JSONDecodeError:
                warn("Existing .vscode/mcp.json is malformed. Overwriting.", component=self.name)

        if "servers" not in mcp_data:
            mcp_data["servers"] = {}

        server_key = "jqassistant-graph-rag"
        if server_key in template_data:
            mcp_data["servers"][server_key] = template_data[server_key]
        elif "servers" in template_data and server_key in template_data["servers"]:
            mcp_data["servers"][server_key] = template_data["servers"][server_key]

        with open(mcp_path, "w", encoding="utf-8") as f:
            json.dump(mcp_data, f, indent=4)
        success(f"MCP server config injected successfully into {mcp_path}", component=self.name)

    def install_config_and_rules(self):
        jqa_tool_root = f"{self.context.tools_dir}/java/jqassistant"
        config_dir = f"{jqa_tool_root}/config"
        rules_dir = f"{config_dir}/rules"
        jqa_results_dir = f"{self.context.raw_outputs_dir}/java"

        os.makedirs(config_dir, exist_ok=True)
        os.makedirs(rules_dir, exist_ok=True)
        os.makedirs(jqa_results_dir, exist_ok=True)

        discovery_output = f"{jqa_results_dir}/jqassistant/sources_discovered.json"
        discovered = discover_workspace_sources(self.context.workspace_root)

        #---------------
        template_config = os.path.join(os.path.dirname(__file__), "config", "templates", ".jqassistant-template.yml")
        custom_config_path = f"{config_dir}/.jqassistant.yml"

        with open(template_config, "r", encoding="utf-8") as f:
            content = f.read()

        java_src_yaml = "\n".join([f"        - '{path}'" for path in discovered["java_src"]])
        neo4j_uri = self.context.get_vscode_setting("neo4j", "uri")
        neo4j_user = self.context.get_vscode_setting("neo4j", "username")
        neo4j_pass = self.context.get_vscode_setting("neo4j", "password")
        project_name = os.path.basename(self.context.workspace_root)

        content = re.sub(r'[ \t]*\{\{JAVA_SRC_DIRS_YAML_LIST\}\}', '{{JAVA_SRC_DIRS_YAML_LIST}}', content)

        content = content.replace("{{JQA_BOLT_URL}}", neo4j_uri)\
                         .replace("{{JQA_BOLT_USERNAME}}", neo4j_user)\
                         .replace("{{JQA_BOLT_PASSWORD}}", neo4j_pass)\
                         .replace("{{JAVA_SRC_DIRS_YAML_LIST}}", java_src_yaml)\
                         .replace("{{PROJECT_NAME}}", project_name)\
                         .replace("{{JQA_RULES_DIRECTORY}}", rules_dir.replace("\\", "/"))

        # Centrally deposit configuration file inside tools sandbox config resource route
        with open(custom_config_path, "w", encoding="utf-8") as f:
            f.write(content)

        #---------------
        template_rules = os.path.join(os.path.dirname(__file__), "config", "templates", "analysis-rules-template.xml")
        target_rules = f"{rules_dir}/{project_name}-rules.xml"

        with open(template_rules, "r", encoding="utf-8") as f:
            rules_content = f.read().replace("{{PROJECT_NAME}}", project_name)

        with open(target_rules, "w", encoding="utf-8") as f:
            f.write(rules_content)

        success(f"JQAssistant rules dropped into {target_rules}", component=self.name)

    def execute_all_installations(self, installStatus: Optional[dict] = None) -> None:
        """Selectively runs configurations. Critical: Raises a hard blocking exception if the remote token is invalid."""
        checker = JavaJQAssistantChecker(self.context)
        if installStatus is None:
            installStatus = checker.execute_all_checks()

        if installStatus.get("java", {}).get("status") != "✅":
            raise RuntimeError("Blocking Error: Missing mandatory system-wide Java compilation JRE environment dependency framework layout.")

        if installStatus.get("jqassistant_binary", {}).get("status") != "✅":
            self.fetch_and_extract_jqassistant()

        if installStatus.get("mcp_server_config", {}).get("status") != "✅":
            self.inject_mcp_server_config()

        if (installStatus.get("jqassistant_custom_config", {}).get("status") != "✅" or
            installStatus.get("jqassistant_custom_rules", {}).get("status") != "✅"):
            self.install_config_and_rules()

        # Final active state verification block assertion parameter validation check
        neo4j_version = self.context.get_vscode_setting("neo4j", "version")
        neo4j_folder = f"{self.context.tools_dir}/system/neo4j/neo4j-community-{neo4j_version}"

        # Enforce strict token validation checkpoints only if database infrastructure layer stands loaded
        if os.path.exists(neo4j_folder):
            post_check_status = checker.execute_all_checks()
            if post_check_status.get("remote_database_token", {}).get("status") != "✅":
                raise RuntimeError("Blocking Error: 'Remote-Database = true' metadata initialization token validation failed. jqassistant cannot proceed with ingestion lifecycle without this critical database configuration property being set.")
