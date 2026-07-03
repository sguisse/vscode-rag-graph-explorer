import os
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import info, error, debug, execute_tracked_command
from core.sources_discovery import discover_workspace_sources



@AnalyserRegistry.register_analyser
class JQAssistantAnalyzer(BaseAnalyser):

    jqa_version = ""
    jqa_raw_outputs_dir = ""
    jqa_tools_dir= ""
    jqa_config_dir = ""
    jqa_custom_config_path = ""
    jqa_exclude_paths_regex = ""


    @property
    def name(self) -> str: return "java_jqassistant_analyzer"

    def _find_sandboxed_binary(self, base_dir: str, target_name: str) -> str:
        if not os.path.exists(base_dir): return None
        for root, _, files in os.walk(base_dir):
            if target_name in files:
                return os.path.join(root, target_name).replace("\\", "/")
        return None

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        """Main orchestrator for the jQAssistant analysis pipeline."""
        self.initialize_jqassistant_config()

        os.makedirs(self.jqa_raw_outputs_dir, exist_ok=True)

        # 1. Discovery Phase
        discovered_sources = self._run_discovery()
        if not discovered_sources["java_src"] and not discovered_sources["java_classes"]:
            info("No Java source or class directories detected. Bypassing jQAssistant pipeline.", component=self.name)
            return

        # 2. Binary Resolution Phase
        executable_target = self._resolve_binary()
        if not executable_target:
            error("Aborting analysis: jQAssistant executable command string could not be resolved.", component=self.name)
            return

        custom_env = os.environ.copy()

        # 3. Diagnostics Phase
        self._dump_diagnostics(executable_target, custom_env)

        # 4. Execution Phase
        scan_return_code = self._execute_scan_and_analyze(executable_target, discovered_sources, custom_env)

        # 5. Fallback Linking Phase
        if scan_return_code != 0:
            info(f"Scan code {scan_return_code}. Activating semantic code relationship fallback parser layers...", component=self.name)

    def initialize_jqassistant_config(self):
        self.jqa_version = self.context.get_vscode_setting("jqassistant", "version")
        self.jqa_raw_outputs_dir = f"{self.context.raw_outputs_dir}/java"
        self.jqa_tools_dir = f"{self.context.tools_dir}/java/jqassistant"
        self.jqa_config_dir = f"{self.jqa_tools_dir}/config"
        self.jqa_custom_config_path = f"{self.jqa_config_dir}/.jqassistant.yml"
        self.jqa_exclude_paths_regex = self.context.get_vscode_setting("excludePathsRegex")

    def _run_discovery(self) -> dict:
        info("Running dynamic workspace path discovery for jQAssistant...", component=self.name)
        return discover_workspace_sources(self.context.workspace_root,
                                          self.jqa_exclude_paths_regex)


    def _resolve_binary(self) -> str:
        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant"
        executable_target = shutil.which(base_cmd) or shutil.which("jqassistant")

        if not executable_target:
            sandbox_bin_root = f"{self.jqa_tools_dir}/jqassistant-{self.jqa_version}"
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

    def _dump_diagnostics(self, executable_target: str, custom_env: dict) -> None:
        reports_dir = os.path.join(self.jqa_raw_outputs_dir, "computed_configs")
        os.makedirs(reports_dir, exist_ok=True)

        info(f"Dumping effective jQAssistant configuration and available rules to {reports_dir}...", component=self.name)
        try:
            self._dump_effective_configuration(executable_target, reports_dir, custom_env)
            self._dump_effective_rules(executable_target, reports_dir, custom_env)
            self._dump_available_rules(executable_target, reports_dir, custom_env)
            self._dump_available_scopes(executable_target, reports_dir, custom_env)
        except Exception as e:
            error(f"Failed to execute effective diagnostic commands: {e}", component=self.name)

    def _run_diagnostic_dump(self, command_action: str, executable_target: str, reports_dir: str, custom_env: dict) -> None:
        """Common extraction utility to isolate subprocess executions, log collections, and file IO write operations."""
        cmd = [
            executable_target,
            command_action,
            "-configurationLocations", self.jqa_custom_config_path
        ]
        info(f"Executing subprocess command: {' '.join(cmd)} \nfrom (cwd={self.context.workspace_root})", component=self.name)

        res = subprocess.run(
            cmd,
            cwd=self.context.workspace_root,
            env=custom_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            errors="replace",
            check=False
        )

        config_file_path = os.path.join(reports_dir, f"{command_action}.txt")
        with open(config_file_path, "w", encoding="utf-8") as f:
            f.write(res.stdout)

        debug(f"Saved {command_action} to {config_file_path}", component=self.name)

    def _dump_effective_configuration(self, executable_target: str, reports_dir: str, custom_env: dict) -> None:
        self._run_diagnostic_dump("effective-configuration", executable_target, reports_dir, custom_env)

    def _dump_effective_rules(self, executable_target: str, reports_dir: str, custom_env: dict) -> None:
        self._run_diagnostic_dump("effective-rules", executable_target, reports_dir, custom_env)

    def _dump_available_rules(self, executable_target: str, reports_dir: str, custom_env: dict) -> None:
        self._run_diagnostic_dump("available-rules", executable_target, reports_dir, custom_env)

    def _dump_available_scopes(self, executable_target: str, reports_dir: str, custom_env: dict) -> None:
        self._run_diagnostic_dump("available-scopes", executable_target, reports_dir, custom_env)

    def _execute_scan_and_analyze(self, executable_target: str, discovered_sources: dict, custom_env: dict) -> int:
        scan_return_code = self._execute_scan(executable_target, discovered_sources, custom_env)

        if scan_return_code == 0:
            self._execute_analyze(executable_target, custom_env)

        return scan_return_code

    def _execute_scan(self, executable_target: str, discovered_sources: dict, custom_env: dict) -> int:
        scan_cmd = [
            executable_target,
            "scan",
            "-configurationLocations", self.jqa_custom_config_path,
            "-f", "java:classpath::../../../../target/classes/"
        ]
        info(f"Executing tracking runner: {' '.join(scan_cmd)} \n(cwd={self.jqa_raw_outputs_dir})", component=self.name)
        return execute_tracked_command(scan_cmd, "jqa_scan", cwd=self.jqa_raw_outputs_dir, env=custom_env)

    def _execute_analyze(self, executable_target: str, custom_env: dict) -> int:
        analyze_cmd = [
            executable_target,
            "analyze",
            "-configurationLocations", self.jqa_custom_config_path
        ]
        info(f"Executing tracking runner: {' '.join(analyze_cmd)} \n(cwd={self.jqa_raw_outputs_dir})", component=self.name)
        return execute_tracked_command(analyze_cmd, "jqa_analyze", cwd=self.jqa_raw_outputs_dir, env=custom_env)
