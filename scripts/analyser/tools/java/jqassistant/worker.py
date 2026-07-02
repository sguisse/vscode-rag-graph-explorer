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


@dataclass(frozen=True)
class JQAssistantContext:
    """Immutable parameter object to encapsulate the jQAssistant environment topologies."""
    workspace_root: str
    version: str
    exclude_regex: str
    jqa_tools_root: str
    config_dir: str
    custom_config_path: str
    jqa_target_dir: str
    discovery_output: str

    @classmethod
    def build_from_matrices(cls, manifest_data: dict, config_matrix: dict) -> "JQAssistantContext":
        """Factory method to cleanly parse raw dict input data structures."""
        workspace_root = manifest_data.get("workspace_root", os.getcwd())
        version = config_matrix.get("jqassistant", {}).get("version", "2.9.1")
        exclude_regex = config_matrix.get("excludePathsRegex", "")

        jqa_tools_root = f"{workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant"
        config_dir = f"{jqa_tools_root}/config"
        custom_config_path = f"{config_dir}/.jqassistant.yml"

        jqa_target_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"
        discovery_output = f"{jqa_target_dir}/jqassistant/sources_discovered.json"

        return cls(
            workspace_root=workspace_root,
            version=version,
            exclude_regex=exclude_regex,
            jqa_tools_root=jqa_tools_root,
            config_dir=config_dir,
            custom_config_path=custom_config_path,
            jqa_target_dir=jqa_target_dir,
            discovery_output=discovery_output
        )


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
        ctx = JQAssistantContext.build_from_matrices(manifest_data, config_matrix)
        os.makedirs(ctx.jqa_target_dir, exist_ok=True)

        # 1. Discovery Phase
        discovered_sources = self._run_discovery(ctx)
        if not discovered_sources["java_src"] and not discovered_sources["java_classes"]:
            info("No Java source or class directories detected. Bypassing jQAssistant pipeline.", component=self.name)
            return

        # 2. Binary Resolution Phase
        executable_target = self._resolve_binary(ctx)
        if not executable_target:
            error("Aborting analysis: jQAssistant executable command string could not be resolved.", component=self.name)
            return

        custom_env = os.environ.copy()

        # 3. Diagnostics Phase
        self._dump_diagnostics(executable_target, ctx, custom_env)

        # 4. Execution Phase
        scan_return_code = self._execute_scan_and_analyze(executable_target, ctx, discovered_sources, custom_env)

        # 5. Fallback Linking Phase
        if scan_return_code != 0:
            info(f"Scan code {scan_return_code}. Activating semantic code relationship fallback parser layers...", component=self.name)

    def _run_discovery(self, ctx: JQAssistantContext) -> dict:
        info("Running dynamic workspace path discovery for jQAssistant...", component=self.name)
        return discover_workspace_sources(ctx.workspace_root, ctx.exclude_regex, ctx.discovery_output)

    def _resolve_binary(self, ctx: JQAssistantContext) -> str:
        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant"
        executable_target = shutil.which(base_cmd) or shutil.which("jqassistant")

        if not executable_target:
            sandbox_bin_root = f"{ctx.jqa_tools_root}/jqassistant-{ctx.version}"
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

    def _dump_diagnostics(self, executable_target: str, ctx: JQAssistantContext, custom_env: dict) -> None:
        reports_dir = os.path.join(ctx.jqa_target_dir, "computed_configs")
        os.makedirs(reports_dir, exist_ok=True)

        info(f"Dumping effective jQAssistant configuration and available rules to {reports_dir}...", component=self.name)
        try:
            self._dump_effective_configuration(executable_target, reports_dir, ctx, custom_env)
            self._dump_effective_rules(executable_target, reports_dir, ctx, custom_env)
            self._dump_available_rules(executable_target, reports_dir, ctx, custom_env)
            self._dump_available_scopes(executable_target, reports_dir, ctx, custom_env)
        except Exception as e:
            error(f"Failed to execute effective diagnostic commands: {e}", component=self.name)

    def _run_diagnostic_dump(self, command_action: str, executable_target: str, reports_dir: str, ctx: JQAssistantContext, custom_env: dict) -> None:
        """Common extraction utility to isolate subprocess executions, log collections, and file IO write operations."""
        cmd = [
            executable_target,
            command_action,
            "-configurationLocations", ctx.custom_config_path
        ]
        info(f"Executing subprocess command: {' '.join(cmd)} \nfrom (cwd={ctx.workspace_root})", component=self.name)

        res = subprocess.run(
            cmd,
            cwd=ctx.workspace_root,
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

    def _dump_effective_configuration(self, executable_target: str, reports_dir: str, ctx: JQAssistantContext, custom_env: dict) -> None:
        self._run_diagnostic_dump("effective-configuration", executable_target, reports_dir, ctx, custom_env)

    def _dump_effective_rules(self, executable_target: str, reports_dir: str, ctx: JQAssistantContext, custom_env: dict) -> None:
        self._run_diagnostic_dump("effective-rules", executable_target, reports_dir, ctx, custom_env)

    def _dump_available_rules(self, executable_target: str, reports_dir: str, ctx: JQAssistantContext, custom_env: dict) -> None:
        self._run_diagnostic_dump("available-rules", executable_target, reports_dir, ctx, custom_env)

    def _dump_available_scopes(self, executable_target: str, reports_dir: str, ctx: JQAssistantContext, custom_env: dict) -> None:
        self._run_diagnostic_dump("available-scopes", executable_target, reports_dir, ctx, custom_env)

    def _execute_scan_and_analyze(self, executable_target: str, ctx: JQAssistantContext, discovered_sources: dict, custom_env: dict) -> int:
        scan_return_code = self._execute_scan(executable_target, ctx, discovered_sources, custom_env)

        if scan_return_code == 0:
            self._execute_analyze(executable_target, ctx, custom_env)

        return scan_return_code

    def _execute_scan(self, executable_target: str, ctx: JQAssistantContext, discovered_sources: dict, custom_env: dict) -> int:
        scan_cmd = [
            executable_target,
            "scan",
            "-configurationLocations", ctx.custom_config_path,
            "-f", "java:classpath::../../../../target/classes/"
        ]
        info(f"Executing tracking runner: {' '.join(scan_cmd)} \n(cwd={ctx.jqa_target_dir})", component=self.name)
        return execute_tracked_command(scan_cmd, "jqa_scan", cwd=ctx.jqa_target_dir, env=custom_env)

    def _execute_analyze(self, executable_target: str, ctx: JQAssistantContext, custom_env: dict) -> int:
        analyze_cmd = [
            executable_target,
            "analyze",
            "-configurationLocations", ctx.custom_config_path
        ]
        info(f"Executing tracking runner: {' '.join(analyze_cmd)} \n(cwd={ctx.jqa_target_dir})", component=self.name)
        return execute_tracked_command(analyze_cmd, "jqa_analyze", cwd=ctx.jqa_target_dir, env=custom_env)
