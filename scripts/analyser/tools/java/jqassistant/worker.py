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
        config_dir = f"{sandbox_root}/config"
        rules_dir = f"{config_dir}/rules"
        custom_config_path = f"{config_dir}/custom-config.yaml"

        jqa_output_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java/jqassistant"
        jqa_store_dir = f"{jqa_output_dir}/store"
        jqa_report_dir = f"{jqa_output_dir}/report"
        discovery_output = f"{jqa_output_dir}/sources_discovered.json"

        os.makedirs(jqa_store_dir, exist_ok=True)
        os.makedirs(jqa_report_dir, exist_ok=True)

        # 1. Discovery Phase
        discovered_sources = self._run_discovery(workspace_root, exclude_regex, discovery_output)
        if not discovered_sources["java_src"] and not discovered_sources["java_classes"]:
            info("No Java source or class directories detected. Bypassing jQAssistant pipeline.", component=self.name)
            return

        # 2. Configuration Rendering Phase
        template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../install/modules/java/jqassistant/config/templates/custom-config-template.yaml")
        self._render_custom_config(
            template_path, custom_config_path, config_dir,
            discovered_sources, config_matrix, workspace_root,
            rules_dir, jqa_store_dir, jqa_report_dir
        )

        # 3. Binary Resolution Phase
        executable_target = self._resolve_binary(sandbox_root, version)
        if not executable_target:
            error("Aborting analysis: jQAssistant executable command string could not be resolved.", component=self.name)
            return

        # 4. Environment Preparation Phase
        custom_env = self._prepare_environment(custom_config_path, jqa_store_dir, jqa_report_dir)

        # 5. Diagnostics Phase (Dumping to dedicated files)
        self._dump_diagnostics(executable_target, jqa_store_dir, jqa_report_dir, workspace_root, custom_env)

        # 6. Execution Phase (Scan & Analyze)
        scan_return_code = self._execute_scan_and_analyze(
            executable_target, jqa_store_dir, jqa_report_dir,
            discovered_sources, workspace_root, custom_env
        )

        # 7. Fallback Linking Phase
        if scan_return_code != 0:
            info(f"Scan code {scan_return_code}. Activating semantic code relationship fallback parser layers...", component=self.name)
        self._run_fallback_linking(discovered_sources, neo4j_client)

    def _run_discovery(self, workspace_root: str, exclude_regex: str, discovery_output: str) -> dict:
        """Discovers java source and class paths within the workspace."""
        info("Running dynamic workspace path discovery for jQAssistant...", component=self.name)
        return discover_workspace_sources(workspace_root, exclude_regex, discovery_output)

    def _render_custom_config(self, template_path: str, custom_config_path: str, config_dir: str, discovered_sources: dict, config_matrix: dict, workspace_root: str, rules_dir: str, jqa_store_dir: str, jqa_report_dir: str) -> None:
        """Generates the custom configuration file from template."""
        if not os.path.exists(template_path):
            return

        java_src_yaml_list = "\n".join([f"        - {path}" for path in discovered_sources["java_src"]])
        neo4j_uri = config_matrix.get("neo4j", {}).get("uri", "bolt://localhost:7687")
        neo4j_user = config_matrix.get("neo4j", {}).get("username", "neo4j")
        neo4j_pass = config_matrix.get("neo4j", {}).get("password", "password")
        project_name = os.path.basename(workspace_root)

        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()

        content = content.replace("{{JQA_BOLT_URL}}", neo4j_uri)\
                         .replace("{{JQA_BOLT_USERNAME}}", neo4j_user)\
                         .replace("{{JQA_BOLT_PASSWORD}}", neo4j_pass)\
                         .replace("{{JAVA_SRC_DIRS_YAML_LIST}}", java_src_yaml_list)\
                         .replace("{{PROJECT_NAME}}", project_name)\
                         .replace("{{JQA_RULES_DIRECTORY}}", rules_dir.replace("\\", "/"))\
                         .replace("{{JQA_STORE_DIRECTORY}}", jqa_store_dir.replace("\\", "/"))\
                         .replace("{{JQA_REPORT_DIRECTORY}}", jqa_report_dir.replace("\\", "/"))

        os.makedirs(config_dir, exist_ok=True)
        with open(custom_config_path, "w", encoding="utf-8") as f:
            f.write(content)

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

    def _prepare_environment(self, custom_config_path: str, jqa_store_dir: str, jqa_report_dir: str) -> dict:
        """Prepares environment variables for the jQAssistant execution."""
        custom_env = os.environ.copy()
        custom_env["JQASSISTANT_OPTS"] = (
            f"-Dsmallrye.config.locations=file:{custom_config_path} "
            f"-Djqassistant.store.directory={jqa_store_dir} "
            f"-Djqassistant.report.directory={jqa_report_dir}"
        )
        return custom_env

    def _dump_diagnostics(self, executable_target: str, jqa_store_dir: str, jqa_report_dir: str, workspace_root: str, custom_env: dict) -> None:
        """Dumps effective configuration and available rules to dedicated log files."""
        reports_dir = os.path.join(workspace_root, ".graph-rag-explorer", "target", "install_reports", "java_jqassistant")
        os.makedirs(reports_dir, exist_ok=True)

        info(f"Dumping effective jQAssistant configuration and available rules to {reports_dir}...", component=self.name)
        try:
            # 1. Effective Configuration
            eff_config_cmd = [
                executable_target,
                f"-Djqassistant.store.directory={jqa_store_dir}",
                f"-Djqassistant.report.directory={jqa_report_dir}",
                "effective-configuration"
            ]
            res_config = subprocess.run(eff_config_cmd, cwd=workspace_root, env=custom_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
            config_file_path = os.path.join(reports_dir, "effective-configuration.txt")
            with open(config_file_path, "w", encoding="utf-8") as f:
                f.write(res_config.stdout)
            debug(f"Saved effective configuration to {config_file_path}", component=self.name)

            # 2. Available Rules
            avail_rules_cmd = [
                executable_target,
                f"-Djqassistant.store.directory={jqa_store_dir}",
                f"-Djqassistant.report.directory={jqa_report_dir}",
                "available-rules"
            ]
            res_rules = subprocess.run(avail_rules_cmd, cwd=workspace_root, env=custom_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
            rules_file_path = os.path.join(reports_dir, "available-rules.txt")
            with open(rules_file_path, "w", encoding="utf-8") as f:
                f.write(res_rules.stdout)
            debug(f"Saved available rules to {rules_file_path}", component=self.name)
        except Exception as e:
            error(f"Failed to execute effective diagnostic commands: {e}", component=self.name)

    def _execute_scan_and_analyze(self, executable_target: str, jqa_store_dir: str, jqa_report_dir: str, discovered_sources: dict, workspace_root: str, custom_env: dict) -> int:
        """Executes the jQAssistant scan and analyze phases."""
        scan_cmd = [
            executable_target,
            f"-Djqassistant.store.directory={jqa_store_dir}",
            f"-Djqassistant.report.directory={jqa_report_dir}",
            "scan"
        ]
        for class_dir in discovered_sources["java_classes"]:
            scan_cmd.extend(["-f", f"java:classpath::{class_dir}"])

        info(f"Triggering CLI jQAssistant Scan Phase...", component=self.name)
        scan_return_code = execute_tracked_command(scan_cmd, "jqa_scan", cwd=workspace_root, env=custom_env)

        if scan_return_code == 0:
            info(f"Scan operation completed. Triggering rule enrichment analysis pass...", component=self.name)
            analyze_cmd = [
                executable_target,
                f"-Djqassistant.store.directory={jqa_store_dir}",
                f"-Djqassistant.report.directory={jqa_report_dir}",
                "analyze"
            ]
            execute_tracked_command(analyze_cmd, "jqa_analyze", cwd=workspace_root, env=custom_env)

        return scan_return_code

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
