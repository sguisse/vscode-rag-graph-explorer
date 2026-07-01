#!/usr/bin/env bash
set -e

# Create necessary module directories
mkdir -p scripts/install/modules/java/jqassistant

# ===========================================================================
# 1. Complete production-ready check.py for java_jqassistant
# ===========================================================================
cat << 'EOF' > scripts/install/modules/java/jqassistant/check.py
import shutil
import os
import subprocess
from install.base import BaseCheckModule
from install.registry import ModuleRegistry

@ModuleRegistry.register_checker
class JavaJQAssistantChecker(BaseCheckModule):
    @property
    def name(self) -> str: return "java_jqassistant"

    def _find_sandboxed_binary(self, base_dir: str, target_name: str) -> str:
        if not os.path.exists(base_dir): return None
        for root, _, files in os.walk(base_dir):
            if target_name in files:
                return os.path.join(root, target_name).replace("\\", "/")
        return None

    def check_java_runtime(self):
        self.steps_count += 1
        if shutil.which("java"):
            self.status["java"] = {"status": "✅"}
        else:
            self.status["java"] = {
                "status": "❌",
                "message": "Java JRE/JDK runtime environment is missing."
            }
            self.ko_count += 1

    def check_jqassistant_executable_availability(self):
        self.steps_count += 1
        version = self.context.get_tool_setting("jqassistant", "version", "2.9.1")
        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant.sh"

        global_bin = shutil.which(base_cmd) or shutil.which("jqassistant")
        sandbox_root = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/jqassistant-{version}"
        local_bin = self._find_sandboxed_binary(sandbox_root, base_cmd)

        if global_bin or local_bin:
            self.status["jqassistant_binary"] = {"status": "✅"}
        else:
            self.status["jqassistant_binary"] = {
                "status": "❌",
                "message": f"jQAssistant command line binary '{base_cmd}' was unmapped globally and inside target/tools/java/jqassistant/ structures."
            }
            self.ko_count += 1

    def check_workspace_raw_outputs_dir(self):
        self.steps_count += 1
        if os.path.exists(f"{self.context.workspace_root}/.graph-rag-explorer/target/raw_outputs/java"):
            self.status["raw_outputs_java"] = {"status": "✅"}
        else:
            self.status["raw_outputs_java"] = {
                "status": "❌",
                "message": "Java analysis target subdirectory raw outputs path layout is missing."
            }
            self.ko_count += 1

    def check_sandboxed_config(self):
        self.steps_count += 1
        if os.path.exists(f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/config/.jqassistant.yml"):
            self.status["jqassistant_custom_config"] = {"status": "✅"}
        else:
            self.status["jqassistant_custom_config"] = {
                "status": "❌",
                "message": "Isolated jQAssistant configuration (.jqassistant.yml) is missing in config directory."
            }
            self.ko_count += 1

    def check_sandboxed_rules(self):
        self.steps_count += 1
        rules_dir = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/config/rules"
        if os.path.exists(rules_dir) and any(f.endswith(".xml") for f in os.listdir(rules_dir)):
            self.status["jqassistant_custom_rules"] = {"status": "✅"}
        else:
            self.status["jqassistant_custom_rules"] = {
                "status": "❌",
                "message": f"No custom XML rules found in sandboxed directory: {rules_dir}"
            }
            self.ko_count += 1

    def check_workspace_mcp_config(self):
        self.steps_count += 1
        mcp_path = os.path.join(self.context.workspace_root, ".vscode", "mcp.json")
        has_server = False

        if os.path.exists(mcp_path):
            try:
                import json
                with open(mcp_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "servers" in data and "jqassistant-graph-rag" in data["servers"]:
                        has_server = True
            except Exception: pass

        if has_server:
            self.status["mcp_server_config"] = {"status": "✅"}
        else:
            self.status["mcp_server_config"] = {
                "status": "❌",
                "message": "MCP server 'jqassistant-graph-rag' is missing from .vscode/mcp.json."
            }
            self.ko_count += 1

    def check_remote_database_token_compliance(self):
        """Queries the active Neo4j container database safely without throwing unhandled lifecycle registration breaks."""
        self.steps_count += 1
        neo4j_version = self.context.get_tool_setting("neo4j", "version", "5.26.0")
        user = self.context.get_tool_setting("neo4j", "user", "neo4j")
        password = self.context.get_tool_setting("neo4j", "password", "password")
        bolt_port = self.context.get_tool_setting("neo4j", "port.bolt", "7687")

        target_folder = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/system/neo4j/neo4j-community-{neo4j_version}"
        shell_cmd = os.path.join(target_folder, "bin", "cypher-shell.bat" if os.name == 'nt' else "cypher-shell")

        if not os.path.exists(shell_cmd):
            self.status["remote_database_token"] = {"status": "❌", "message": "cypher-shell missing from system infrastructure layout routes."}
            return

        try:
            check_query = "MATCH (m:SystemMetadata {id: 'global_config'}) RETURN m.`Remote-Database` AS status;"
            res = subprocess.run([shell_cmd, "-a", f"bolt://localhost:{bolt_port}", "-u", user, "-p", password, check_query], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            if res.returncode == 0 and "true" in res.stdout:
                self.status["remote_database_token"] = {"status": "✅"}
            else:
                self.status["remote_database_token"] = {"status": "❌", "message": "'Remote-Database = true' token missing or invalid on targeted instance profile."}
        except Exception as e:
            self.status["remote_database_token"] = {"status": "❌", "message": f"Targeted database instance currently unreachable. Context: {e}"}

    def execute_all_checks(self) -> dict:
        self.steps_count = 0
        self.ko_count = 0
        self.status = {}
        self.check_java_runtime()
        self.check_jqassistant_executable_availability()
        self.check_workspace_raw_outputs_dir()
        self.check_sandboxed_config()
        self.check_sandboxed_rules()
        self.check_workspace_mcp_config()
        self.check_remote_database_token_compliance()
        return self.generate_summary()
EOF

# ===========================================================================
# 2. Complete production-ready install.py for java_jqassistant
# ===========================================================================
cat << 'EOF' > scripts/install/modules/java/jqassistant/install.py
import os
import sys
import ssl
import json
import re
import zipfile
import urllib.request
import urllib.error
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
        version = self.context.get_tool_setting("jqassistant", "version", "2.9.1")
        jqa_tool_root = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        target_folder = os.path.join(jqa_tool_root, f"jqassistant-{version}")

        if os.path.exists(target_folder): return

        os.makedirs(jqa_tool_root, exist_ok=True)
        local_zip_path = os.path.join(jqa_tool_root, "jqassistant.zip")
        default_url = f"https://github.com/jQAssistant/jqassistant/releases/download/{version}/jqassistant-commandline-neo4jv5-{version}-distribution.zip"
        url = self.context.get_tool_setting("jqassistant", "downloadUrl", default_url).replace("${version}", version)

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

        mcp_host = self.context.get_tool_setting("jqassistant", "mcp.host", "127.0.0.1")
        mcp_port = self.context.get_tool_setting("jqassistant", "mcp.port", 8800)
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
        workspace_root = self.context.workspace_root
        exclude_regex = self.context.get_tool_setting("excludePathsRegex", "")

        jqa_tool_root = f"{workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        config_dir = f"{jqa_tool_root}/config"
        rules_dir = f"{config_dir}/rules"
        jqa_results_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"

        os.makedirs(config_dir, exist_ok=True)
        os.makedirs(rules_dir, exist_ok=True)
        os.makedirs(jqa_results_dir, exist_ok=True)

        discovery_output = f"{jqa_results_dir}/jqassistant/sources_discovered.json"
        discovered = discover_workspace_sources(workspace_root, exclude_regex, discovery_output)

        template_config = os.path.join(os.path.dirname(__file__), "config", "templates", ".jqassistant-template.yml")
        custom_config_path = f"{config_dir}/.jqassistant.yml"

        with open(template_config, "r", encoding="utf-8") as f:
            content = f.read()

        java_src_yaml = "\n".join([f"        - '{path}'" for path in discovered["java_src"]])
        neo4j_uri = self.context.get_tool_setting("neo4j", "uri", "bolt://localhost:7687")
        neo4j_user = self.context.get_tool_setting("neo4j", "username", "neo4j")
        neo4j_pass = self.context.get_tool_setting("neo4j", "password", "password")
        project_name = os.path.basename(workspace_root)

        content = re.sub(r'[ \t]*\{\{JAVA_SRC_DIRS_YAML_LIST\}\}', '{{JAVA_SRC_DIRS_YAML_LIST}}', content)

        content = content.replace("{{JQA_BOLT_URL}}", neo4j_uri)\
                         .replace("{{JQA_BOLT_USERNAME}}", neo4j_user)\
                         .replace("{{JQA_BOLT_PASSWORD}}", neo4j_pass)\
                         .replace("{{JAVA_SRC_DIRS_YAML_LIST}}", java_src_yaml)\
                         .replace("{{PROJECT_NAME}}", project_name)\
                         .replace("{{JQA_RULES_DIRECTORY}}", rules_dir.replace("\\", "/"))

        with open(custom_config_path, "w", encoding="utf-8") as f:
            f.write(content)

        success(f"JQAssistant configuration dropped into {custom_config_path}", component=self.name)

        template_rules = os.path.join(os.path.dirname(__file__), "config", "templates", "analysis-rules-template.xml")
        target_rules = f"{rules_dir}/{project_name}-rules.xml"

        with open(template_rules, "r", encoding="utf-8") as f:
            rules_content = f.read().replace("{{PROJECT_NAME}}", project_name)

        with open(target_rules, "w", encoding="utf-8") as f:
            f.write(rules_content)

        success(f"JQAssistant rules dropped into {target_rules}", component=self.name)

    def execute_all_installations(self) -> None:
        """Selectively runs configurations. Critical: Raises a hard blocking exception if the remote token is invalid."""
        checker = JavaJQAssistantChecker(self.context)
        status = checker.execute_all_checks()

        if status.get("java", {}).get("status") != "✅":
            raise RuntimeError("Blocking Error: Missing mandatory system-wide Java compilation JRE environment dependency framework layout.")

        if status.get("jqassistant_binary", {}).get("status") != "✅":
            self.fetch_and_extract_jqassistant()

        if status.get("mcp_server_config", {}).get("status") != "✅":
            self.inject_mcp_server_config()

        if (status.get("jqassistant_custom_config", {}).get("status") != "✅" or
            status.get("jqassistant_custom_rules", {}).get("status") != "✅"):
            self.install_config_and_rules()

        # Final active state verification block assertion parameter validation check
        neo4j_version = self.context.get_tool_setting("neo4j", "version", "5.26.0")
        neo4j_folder = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/system/neo4j/neo4j-community-{neo4j_version}"

        # Enforce strict token validation checkpoints only if database infrastructure layer stands loaded
        if os.path.exists(neo4j_folder):
            post_check_status = checker.execute_all_checks()
            if post_check_status.get("remote_database_token", {}).get("status") != "✅":
                raise RuntimeError("Blocking Error: 'Remote-Database = true' metadata initialization token validation failed on target sandbox layer profile container context.")
EOF

# Sync updates across extension execution contexts
npm run compile

echo "✅ fix: Safely deferred unhandled verification crashes out of check.py routines into blocking exception assertions inside the java_jqassistant installer pipeline."
