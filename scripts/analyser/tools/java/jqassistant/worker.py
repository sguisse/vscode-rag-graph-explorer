import os
import json
import shutil
import subprocess
import sys
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
        custom_config_path = f"{config_dir}/.jqassistant.yml"

        # Define isolated execution CWD
        jqa_run_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"
        discovery_output = f"{jqa_run_dir}/jqassistant/sources_discovered.json"

        os.makedirs(jqa_run_dir, exist_ok=True)

        # 1. Discovery Phase
        discovered_sources = self._run_discovery(workspace_root, exclude_regex, discovery_output)
        if not discovered_sources["java_src"] and not discovered_sources["java_classes"]:
            info("No Java source or class directories detected. Bypassing jQAssistant pipeline.", component=self.name)
            return

        # 2. Binary Resolution Phase
        executable_target = self._resolve_binary(sandbox_root, version)
        if not executable_target:
            error("Aborting analysis: jQAssistant executable command string could not be resolved.", component=self.name)
            return

        custom_env = os.environ.copy()

        # 3. Diagnostics Phase
        self._dump_diagnostics(executable_target, jqa_run_dir, custom_config_path, workspace_root, custom_env)


        # 4. Execution Phase (Scan & Analyze via custom configurations)
        scan_return_code = self._execute_scan_and_analyze(
            executable_target, jqa_run_dir, discovered_sources, custom_config_path, custom_env
        )

        # 5. Fallback Linking Phase
        if scan_return_code != 0:
            info(f"Scan code {scan_return_code}. Activating semantic code relationship fallback parser layers...", component=self.name)
        self._run_fallback_linking(discovered_sources, neo4j_client)

    def _run_discovery(self, workspace_root: str, exclude_regex: str, discovery_output: str) -> dict:
        info("Running dynamic workspace path discovery for jQAssistant...", component=self.name)
        return discover_workspace_sources(workspace_root, exclude_regex, discovery_output)

    def _resolve_binary(self, sandbox_root: str, version: str) -> str:
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

    def _dump_diagnostics(self, executable_target: str, jqa_run_dir: str, custom_config_path: str, workspace_root: str, custom_env: dict) -> None:
        reports_dir = os.path.join(workspace_root, ".graph-rag-explorer", "target", "install_reports", "java_jqassistant")
        os.makedirs(reports_dir, exist_ok=True)

        info(f"Dumping effective jQAssistant configuration and available rules to {reports_dir}...", component=self.name)
        try:
            self._dump_effective_configuration(executable_target, jqa_run_dir, custom_config_path, reports_dir, custom_env)
            self._dump_available_rules(executable_target, jqa_run_dir, custom_config_path, reports_dir, custom_env)
        except Exception as e:
            error(f"Failed to execute effective diagnostic commands: {e}", component=self.name)

    def _dump_effective_configuration(self, executable_target: str, jqa_run_dir: str, custom_config_path: str, reports_dir: str, custom_env: dict) -> None:
        eff_config_cmd = [executable_target, "effective-configuration", "-configurationLocations", custom_config_path]
        info(f"Executing subprocess command: {' '.join(eff_config_cmd)} (cwd={jqa_run_dir})", component=self.name)

        res_config = subprocess.run(eff_config_cmd, cwd=jqa_run_dir, env=custom_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
        config_file_path = os.path.join(reports_dir, "effective-configuration.txt")
        with open(config_file_path, "w", encoding="utf-8") as f:
            f.write(res_config.stdout)
        debug(f"Saved effective configuration to {config_file_path}", component=self.name)

    def _dump_available_rules(self, executable_target: str, jqa_run_dir: str, custom_config_path: str, reports_dir: str, custom_env: dict) -> None:
        avail_rules_cmd = [executable_target, "available-rules", "-configurationLocations", custom_config_path]
        info(f"Executing subprocess command: {' '.join(avail_rules_cmd)} (cwd={jqa_run_dir})", component=self.name)

        res_rules = subprocess.run(avail_rules_cmd, cwd=jqa_run_dir, env=custom_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors="replace", check=False)
        rules_file_path = os.path.join(reports_dir, "available-rules.txt")
        with open(rules_file_path, "w", encoding="utf-8") as f:
            f.write(res_rules.stdout)

        if res_rules.stdout:
            sys.stdout.write(res_rules.stdout)
            sys.stdout.flush()

    def _execute_scan_and_analyze(self, executable_target: str, jqa_run_dir: str, discovered_sources: dict, custom_config_path: str, custom_env: dict) -> int:
        scan_return_code = self._execute_scan(executable_target, jqa_run_dir, discovered_sources, custom_config_path, custom_env)

        if scan_return_code == 0:
            self._execute_analyze(executable_target, jqa_run_dir, custom_config_path, custom_env)

        return scan_return_code

    def _execute_scan(self, executable_target: str, jqa_run_dir: str, discovered_sources: dict, custom_config_path: str, custom_env: dict) -> int:
        scan_cmd = [
            executable_target,
            "scan",
            "-configurationLocations", custom_config_path
        ]

        for class_dir in discovered_sources["java_classes"]:
            scan_cmd.extend(["-f", f"java:classpath::{class_dir}"])

        info(f"Executing tracking runner: {' '.join(scan_cmd)} (cwd={jqa_run_dir})", component=self.name)
        return execute_tracked_command(scan_cmd, "jqa_scan", cwd=jqa_run_dir, env=custom_env)

    def _execute_analyze(self, executable_target: str, jqa_run_dir: str, custom_config_path: str, custom_env: dict) -> int:
        analyze_cmd = [
            executable_target,
            "analyze",
            "-configurationLocations", custom_config_path
        ]
        info(f"Executing tracking runner: {' '.join(analyze_cmd)} (cwd={jqa_run_dir})", component=self.name)
        return execute_tracked_command(analyze_cmd, "jqa_analyze", cwd=jqa_run_dir, env=custom_env)

    def _run_fallback_linking(self, discovered_sources: dict, neo4j_client: Neo4jClient) -> None:
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
