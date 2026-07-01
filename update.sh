#!/usr/bin/env bash

# Safely manage backticks for Markdown/code generation
BTICK=$(printf '\x60')
TRIPLE_TICK=$(printf '\x60\x60\x60')

echo "🚀 Completely removing config rendering from worker.py and establishing static configuration inside install.py..."

mkdir -p scripts/install/modules/java/jqassistant
mkdir -p scripts/analyser/tools/java/jqassistant

# ------------------------------------------------------------------------------
# FILE: scripts/install/modules/java/jqassistant/install.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/install/modules/java/jqassistant/install.py
import os
import sys
import ssl
import json
import urllib.request
import urllib.error
import zipfile
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import info, success, error, warn
from core.sources_discovery import discover_workspace_sources

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
        sandbox_root = f"{self.context.workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        target_folder = os.path.join(sandbox_root, f"jqassistant-{version}")

        if os.path.exists(target_folder): return

        os.makedirs(sandbox_root, exist_ok=True)
        local_zip_path = os.path.join(sandbox_root, "jqassistant.zip")
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

    def create_isolated_java_raw_target_folder(self):
        java_raw_output_dir = f"{self.context.workspace_root}/.graph-rag-explorer/target/raw_outputs/java"
        os.makedirs(java_raw_output_dir, exist_ok=True)

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

    def provision_sandboxed_config_and_rules(self):
        workspace_root = self.context.workspace_root
        exclude_regex = self.context.get_tool_setting("excludePathsRegex", "")

        sandbox_root = f"{workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        config_dir = f"{sandbox_root}/config"
        rules_dir = f"{config_dir}/rules"
        jqa_run_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"

        os.makedirs(config_dir, exist_ok=True)
        os.makedirs(rules_dir, exist_ok=True)
        os.makedirs(jqa_run_dir, exist_ok=True)

        # 1. Run Discovery during install phase to establish the immutable base config
        discovery_output = f"{jqa_run_dir}/jqassistant/sources_discovered.json"
        discovered = discover_workspace_sources(workspace_root, exclude_regex, discovery_output)

        # 2. Render .jqassistant.yml directly into the isolated tools config directory once
        template_config = f"{os.path.dirname(__file__)}/config/templates/custom-config-template.yaml"
        custom_config_path = f"{config_dir}/.jqassistant.yml"

        with open(template_config, "r", encoding="utf-8") as f:
            content = f.read()

        java_src_yaml = "\n".join([f"        - {path}" for path in discovered["java_src"]])
        neo4j_uri = self.context.get_tool_setting("neo4j", "uri", "bolt://localhost:7687")
        neo4j_user = self.context.get_tool_setting("neo4j", "username", "neo4j")
        neo4j_pass = self.context.get_tool_setting("neo4j", "password", "password")
        project_name = os.path.basename(workspace_root)

        content = content.replace("{{JQA_BOLT_URL}}", neo4j_uri)\
                         .replace("{{JQA_BOLT_USERNAME}}", neo4j_user)\
                         .replace("{{JQA_BOLT_PASSWORD}}", neo4j_pass)\
                         .replace("{{JAVA_SRC_DIRS_YAML_LIST}}", java_src_yaml)\
                         .replace("{{PROJECT_NAME}}", project_name)\
                         .replace("{{JQA_RULES_DIRECTORY}}", rules_dir.replace("\\", "/"))

        with open(custom_config_path, "w", encoding="utf-8") as f:
            f.write(content)

        # 3. Render rules into sandbox
        template_rules = f"{os.path.dirname(__file__)}/config/templates/analysis-rules-template.xml"
        target_rules = f"{rules_dir}/{project_name}-rules.xml"

        with open(template_rules, "r", encoding="utf-8") as f:
            rules_content = f.read().replace("{{PROJECT_NAME}}", project_name)

        with open(target_rules, "w", encoding="utf-8") as f:
            f.write(rules_content)

        success(f"Sandboxed configuration dropped into {custom_config_path}", component=self.name)

    def execute_all_installations(self) -> None:
        self.create_isolated_java_raw_target_folder()
        self.fetch_and_extract_jqassistant()
        self.inject_mcp_server_config()
        self.provision_sandboxed_config_and_rules()
EOF

# ------------------------------------------------------------------------------
# FILE: scripts/analyser/tools/java/jqassistant/worker.py
# ------------------------------------------------------------------------------
cat << 'EOF' > scripts/analyser/tools/java/jqassistant/worker.py
import os
import json
import shutil
import subprocess
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.neo4j_client import Neo4jClient
from core.utils import info, error, debug, execute_tracked_command
from core.sources_discovery import discover_workspace_sources

@AnalyserRegistry.register
class JQAssistantWorker(BaseAnalyser):
    @property
    def name(self) -> str: return "java_jqassistant_worker"

    def _find_sandboxed_binary(self, base_dir: str, target_name: str) -> str:
        if not os.path.exists(base_dir): return None
        for root, _, files in os.walk(base_dir):
            if target_name in files:
                return os.path.join(root, target_name).replace("\\", "/")
        return None

    def run_analysis(self, manifest_data: dict, neo4j_client: Neo4jClient, config_matrix: dict) -> None:
        """Main orchestrator for the jQAssistant analysis pipeline."""
        workspace_root = manifest_data.get("workspace_root", os.getcwd())
        version = config_matrix.get("jqassistant", {}).get("version", "2.9.1")
        exclude_regex = config_matrix.get("excludePathsRegex", "")

        sandbox_root = f"{workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        custom_config_path = f"{sandbox_root}/config/.jqassistant.yml"

        # Define isolated execution CWD
        jqa_run_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"
        discovery_output = f"{jqa_run_dir}/jqassistant/sources_discovered.json"

        os.makedirs(jqa_run_dir, exist_ok=True)

        # 1. Discovery Phase (Still needed for dynamic classpath extraction)
        discovered_sources = self._run_discovery(workspace_root, exclude_regex, discovery_output)
        if not discovered_sources["java_src"] and not discovered_sources["java_classes"]:
            info("No Java source or class directories detected. Bypassing jQAssistant pipeline.", component=self.name)
            return

        # 2. Binary Resolution Phase
        executable_target = self._resolve_binary(sandbox_root, version)
        if not executable_target:
            error("Aborting analysis: jQAssistant executable command string could not be resolved.", component=self.name)
            return

        # 3. Environment Preparation Phase
        custom_env = self._prepare_environment(custom_config_path)

        # 4. Diagnostics Phase (Using jqa_run_dir as CWD)
        self._dump_diagnostics(executable_target, jqa_run_dir, workspace_root, custom_env)

        # 5. Execution Phase (Scan & Analyze in isolated CWD)
        scan_return_code = self._execute_scan_and_analyze(
            executable_target, jqa_run_dir, discovered_sources, custom_env
        )

        # 6. Fallback Linking Phase
        if scan_return_code != 0:
            info(f"Scan code {scan_return_code}. Activating semantic code relationship fallback parser layers...", component=self.name)
        self._run_fallback_linking(discovered_sources, neo4j_client)

    def _run_discovery(self, workspace_root: str, exclude_regex: str, discovery_output: str) -> dict:
        """Discovers java source and class paths within the workspace."""
        info("Running dynamic workspace path discovery for jQAssistant...", component=self.name)
        return discover_workspace_sources(workspace_root, exclude_regex, discovery_output)

    def _resolve_binary(self, sandbox_root: str, version: str) -> str:
        """Resolves the correct jqassistant executable binary."""
        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant.sh"
        executable_target = shutil.which(base_cmd) or shutil.which("jqassistant")

        if not executable_target:
            sandbox_bin_root = f"{sandbox_root}/jqassistant-{version}"
            local_bin_path = self._find_sandboxed_binary(sandbox_bin_root, base_cmd)
            if local_bin_path and os.path.exists(local_bin_path):
                executable_target = local_bin_path
                if os.name != 'nt':
                    for walk_root, _, walk_files in os.walk(sandbox_bin_root):
                        for file in walk_files:
                            if file.endswith(".sh") or "bin" in walk_root.replace("\\", "/").split("/"):
                                try: os.chmod(os.path.join(walk_root, file), 0o755)
                                except Exception: pass
        return executable_target

    def _prepare_environment(self, custom_config_path: str) -> dict:
        """Prepares environment variables by binding SmallRye config location."""
        custom_env = os.environ.copy()
        custom_env["JQASSISTANT_OPTS"] = f"-Dsmallrye.config.locations=file:{custom_config_path}"
        return custom_env

    def _dump_diagnostics(self, executable_target: str, jqa_run_dir: str, workspace_root: str, custom_env: dict) -> None:
        """Dumps effective configuration and available rules to dedicated log files using isolated CWD."""
        reports_dir = os.path.join(workspace_root, ".graph-rag-explorer", "target", "install_reports", "java_jqassistant")
        os.makedirs(reports_dir, exist_ok=True)

        info(f"Dumping effective jQAssistant configuration and available rules to {reports_dir}...", component=self.name)
        try:
            self._dump_effective_configuration(executable_target, jqa_run_dir, reports_dir, custom_env)
            self._dump_available_rules(executable_target, jqa_run_dir, reports_dir, custom_env)
        except Exception as e:
            error(f"Failed to execute effective diagnostic commands: {e}", component=self.name)

    def _dump_effective_configuration(self, executable_target: str, jqa_run_dir: str, reports_dir: str, custom_env: dict) -> None:
        """Executes 'effective-configuration' and saves the output, logging the target environment parameters."""
        eff_config_cmd = [executable_target, "effective-configuration"]
        info(f"Executing subprocess command: {' '.join(eff_config_cmd)} (cwd={jqa_run_dir})", component=self.name)
        info(f"Injected JQASSISTANT_OPTS environment configuration matrix: {custom_env.get('JQASSISTANT_OPTS')}", component=self.name)

        res_config = subprocess.run(eff_config_cmd, cwd=jqa_run_dir, env=custom_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
        config_file_path = os.path.join(reports_dir, "effective-configuration.txt")
        with open(config_file_path, "w", encoding="utf-8") as f:
            f.write(res_config.stdout)
        debug(f"Saved effective configuration to {config_file_path}", component=self.name)

    def _dump_available_rules(self, executable_target: str, jqa_run_dir: str, reports_dir: str, custom_env: dict) -> None:
        """Executes 'available-rules' and saves the output, logging the target environment parameters."""
        avail_rules_cmd = [executable_target, "available-rules"]
        info(f"Executing subprocess command: {' '.join(avail_rules_cmd)} (cwd={jqa_run_dir})", component=self.name)
        info(f"Injected JQASSISTANT_OPTS environment configuration matrix: {custom_env.get('JQASSISTANT_OPTS')}", component=self.name)

        res_rules = subprocess.run(avail_rules_cmd, cwd=jqa_run_dir, env=custom_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
        rules_file_path = os.path.join(reports_dir, "available-rules.txt")
        with open(rules_file_path, "w", encoding="utf-8") as f:
            f.write(res_rules.stdout)
        debug(f"Saved available rules to {rules_file_path}", component=self.name)

    def _execute_scan_and_analyze(self, executable_target: str, jqa_run_dir: str, discovered_sources: dict, custom_env: dict) -> int:
        """Orchestrates the jQAssistant scan and analyze phases within the isolated CWD."""
        scan_return_code = self._execute_scan(executable_target, jqa_run_dir, discovered_sources, custom_env)

        if scan_return_code == 0:
            self._execute_analyze(executable_target, jqa_run_dir, custom_env)

        return scan_return_code

    def _execute_scan(self, executable_target: str, jqa_run_dir: str, discovered_sources: dict, custom_env: dict) -> int:
        """Executes the jQAssistant scan phase, logging the command string and custom environment options via info."""
        scan_cmd = [executable_target, "scan"]
        for class_dir in discovered_sources["java_classes"]:
            scan_cmd.extend(["-f", f"java:classpath::{class_dir}"])

        info(f"Executing tracking runner: {' '.join(scan_cmd)} (cwd={jqa_run_dir})", component=self.name)
        info(f"Injected JQASSISTANT_OPTS environment configuration matrix: {custom_env.get('JQASSISTANT_OPTS')}", component=self.name)
        return execute_tracked_command(scan_cmd, "jqa_scan", cwd=jqa_run_dir, env=custom_env)

    def _execute_analyze(self, executable_target: str, jqa_run_dir: str, custom_env: dict) -> int:
        """Executes the jQAssistant analyze phase, logging the command string and custom environment options via info."""
        analyze_cmd = [executable_target, "analyze"]
        info(f"Executing tracking runner: {' '.join(analyze_cmd)} (cwd={jqa_run_dir})", component=self.name)
        info(f"Injected JQASSISTANT_OPTS environment configuration matrix: {custom_env.get('JQASSISTANT_OPTS')}", component=self.name)
        return execute_tracked_command(analyze_cmd, "jqa_analyze", cwd=jqa_run_dir, env=custom_env)

    def _run_fallback_linking(self, discovered_sources: dict, neo4j_client: Neo4jClient) -> None:
        """Applies fallback graph mutations if the scan was incomplete or failed."""
        java_files = discovered_sources["java_src"]
        for file in java_files:
            neo4j_client.execute_write(
                "MERGE (f:File:Java {path: $path}) SET f.name = $name",
                {"path": file, "name": file.split("/")[-1]}
            )

        controllers = [f for f in java_files if "Controller" in f]
        services = [f for f in java_files if "Service" in f]
        repositories = [f for f in java_files if any(x in f for x in ["Repository", "Mapper", "Provider"])]

        for c in controllers:
            base_name = c.split("/")[-1].replace("Controller.java", "")
            matched = [s for s in services if base_name in s.split("/")[-1]]
            if matched:
                neo4j_client.execute_write("MATCH (src:File {path: $src}), (dst:File {path: $dst}) MERGE (src)-[:CALLS]->(dst)", {"src": c, "dst": matched[0]})

        for s in services:
            base_name = s.split("/")[-1].replace("Service.java", "")
            matched = [r for r in repositories if base_name in r.split("/")[-1]]
            if matched:
                neo4j_client.execute_write("MATCH (src:File {path: $src}), (dst:File {path: $dst}) MERGE (src)-[:CALLS]->(dst)", {"src": s, "dst": matched[0]})
EOF

echo "✅ refactor: Moved the custom configuration template rendering logic strictly inside install.py, keeping worker.py clean and runtime-oriented."
