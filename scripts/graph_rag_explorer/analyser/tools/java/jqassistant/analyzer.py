import os
import json
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import info, error, debug, execute_tracked_command, success, warn
from graph_rag_explorer.services.sources_discovery import discover_workspace_sources
from graph_rag_explorer.install.context import GraphRagExplorerContext
from install.modules.java.jqassistant.context import JQAssistantContext

@AnalyserRegistry.register_analyser
class JQAssistantAnalyzer(BaseAnalyser):

    def __init__(self, context: GraphRagExplorerContext):
        # 1.Call the parent class (BaseAnalyser) to store the global context
        super().__init__(context)
        # 2. Compose the specific jQAssistant context
        self.jqa = JQAssistantContext(context)

    @property
    def name(self) -> str: return "01-java_jqassistant_analyzer"

    def _find_sandboxed_binary(self, base_dir: str, target_name: str) -> str:
        if not os.path.exists(base_dir): return None
        for root, _, files in os.walk(base_dir):
            if target_name in files:
                return os.path.join(root, target_name).replace("\\", "/")
        return None

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        """Main orchestrator for the jQAssistant analysis pipeline."""
        os.makedirs(self.jqa.raw_outputs_dir, exist_ok=True)

        # 1. Discovery Phase
        discovered_sources = self._run_discovery()
        has_sources = any(
            discovered_sources.get(k)
            for k in ["java_src", "java_classes", "typescript_src", "javascript_src"]
        )

        if not has_sources:
            info("No Java or TS/JS source directories detected. Bypassing jQAssistant pipeline.", component=self.name)
            return

        # 2. Binary Resolution Phase
        executable_target = self._resolve_binary()
        if not executable_target:
            error("Aborting analysis: jQAssistant executable command string could not be resolved.", component=self.name)
            return


        # 3. Environment Customization Phase (Injecting SDKMAN! Java 25.0.1-tem)
        # TODO: Externalize JDK in package.json for user-defined overrides, to move in installation pipeline later. For now, hardcoded to ensure JDK 25 is used for jQAssistant analysis.
        custom_env = os.environ.copy()
        sdkman_java_home = os.path.expanduser("~/.sdkman/candidates/java/25.0.1-tem")

        if os.path.exists(sdkman_java_home):
            custom_env["JAVA_HOME"] = sdkman_java_home
            custom_env["PATH"] = f"{os.path.join(sdkman_java_home, 'bin')}{os.pathsep}{custom_env.get('PATH', '')}"
            info("🔄 Command executed inline: sdk use java 25.0.1-tem -> Context switched to JDK 25", component=self.name)
        else:
            warn(f"SDKMAN target path absent at {sdkman_java_home}. Inheriting global default system JDK.", component=self.name)

        # 4. Pre-scan TypeScript AST extraction via @jqassistant/ts-lce
        self._extract_typescript_ast(discovered_sources, custom_env)

        # 5. Diagnostics Phase
        self._dump_diagnostics(executable_target, custom_env)

        # 6. Execution Phase
        scan_return_code = self._execute_scan_and_analyze(executable_target, discovered_sources, custom_env)

        # 7. Fallback Linking Phase
        if scan_return_code != 0:
            info(f"Scan code {scan_return_code}. Activating semantic code relationship fallback parser layers...", component=self.name)


    def _run_discovery(self) -> dict:
        info("Running dynamic workspace path discovery for jQAssistant...", component=self.name)
        return discover_workspace_sources(self.context.workspace_root, self.jqa.exclude_paths_regex)

    def _resolve_binary(self) -> str:
        base_cmd = "jqassistant.cmd" if self.context.is_windows else "jqassistant"
        executable_target = shutil.which(base_cmd) or shutil.which("jqassistant")

        if not executable_target:
            sandbox_bin_root = f"{self.jqa.tools_dir}/jqassistant-{self.jqa.version}"
            local_bin_path = self._find_sandboxed_binary(sandbox_bin_root, base_cmd)
            if local_bin_path and os.path.exists(local_bin_path):
                executable_target = local_bin_path
                if not self.context.is_windows:
                    for walk_root, _, walk_files in os.walk(sandbox_bin_root):
                        for file in walk_files:
                            if file.endswith(".sh") or "bin" in walk_root.replace("\\", "/").split("/"):
                                try: os.chmod(os.path.join(walk_root, file), 0o755)
                                except Exception: pass
        return executable_target

    def _dump_diagnostics(self, executable_target: str, custom_env: dict) -> None:
        reports_dir = os.path.join(self.jqa.raw_outputs_dir, "jqassistant", "computed_configs")
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
        cmd = [
            executable_target,
            command_action,
            "-configurationLocations", self.jqa.custom_config_path
        ]

        cwd = self.context.workspace_root

        self._log_execution_command(cmd, cwd)
        res = subprocess.run(
            cmd,
            cwd=cwd,
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
            success ("jQAssistant 'scan' completed successfully.", component=self.name)
            info("Proceeding to jQAssistant 'analyze' phase...", component=self.name)
        else:
            # A partial scan still leaves a usable store: analyze must run anyway (violations are indicated, never blocking).
            warn(f"jQAssistant 'scan' failed with code {scan_return_code}. Running 'analyze' anyway on the partially scanned store.", component=self.name)

        try:
            analyze_return_code = self._execute_analyze(executable_target, custom_env)
            if analyze_return_code != 0:
                warn(f"jQAssistant 'analyze' exited with code {analyze_return_code} (rule violations or a rule failure; this never blocks the analysis). Parsing the report anyway.", component=self.name)
            else:
                success ("jQAssistant 'analyze' completed successfully.", component=self.name)
        except Exception as e:
            warn(f"jQAssistant 'analyze' could not be executed: {e}", component=self.name)

        self._summarize_report()
        return scan_return_code

    #----------------
    def _report_path(self) -> str:
        return os.path.join(self.jqa.raw_outputs_dir, "jqassistant", "report", "jqassistant-report.xml")

    def _parse_report_summary(self, report_path: str) -> dict:
        """Counts rule results per (kind, severity, status) from jqassistant-report.xml; tolerant to partial reports."""
        def local(tag: str) -> str:
            return tag.rsplit("}", 1)[-1]

        def child_text(node, name: str) -> str:
            for child in node.iter():
                if local(child.tag) == name:
                    return (child.text or "").strip().lower()
            return ""

        summary = {"counts": {}, "violation_rows": 0, "partial": False}
        try:
            for _event, elem in ET.iterparse(report_path, events=("end",)):
                kind = local(elem.tag)
                if kind not in ("constraint", "concept"):
                    continue
                key = (kind, child_text(elem, "severity") or "unknown", child_text(elem, "status") or "unknown")
                summary["counts"][key] = summary["counts"].get(key, 0) + 1
                if kind == "constraint":
                    summary["violation_rows"] += sum(1 for n in elem.iter() if local(n.tag) == "row")
                elem.clear()
        except ET.ParseError as e:
            summary["partial"] = True
            warn(f"jQAssistant report is truncated or malformed ({e}); summary covers the complete rules only.", component=self.name)
        return summary

    def _summarize_report(self) -> None:
        """Always parses the XML report (even after a non-zero exit code) and prints a per-severity summary."""
        report_path = self._report_path()
        if not os.path.isfile(report_path) or os.path.getsize(report_path) == 0:
            warn(f"jQAssistant report not found or empty, no severity summary available: {report_path}", component=self.name)
            return
        try:
            summary = self._parse_report_summary(report_path)
        except Exception as e:
            warn(f"Could not parse jQAssistant report '{report_path}': {e}", component=self.name)
            return

        counts = summary["counts"]
        if not counts:
            warn(f"jQAssistant report contains no concept/constraint results: {report_path}", component=self.name)
            return
        order = ["blocker", "critical", "major", "minor", "info", "unknown"]
        info(f"jQAssistant report summary ({report_path}){' [PARTIAL]' if summary['partial'] else ''}:", component=self.name)
        for kind in ("constraint", "concept"):
            lines = sorted(
                ((sev, status, n) for (k, sev, status), n in counts.items() if k == kind),
                key=lambda t: (order.index(t[0]) if t[0] in order else len(order), t[1]),
            )
            for sev, status, n in lines:
                info(f"  {kind:<10} severity={sev:<8} status={status:<8} results={n}", component=self.name)
        violated = sum(n for (k, _s, st), n in counts.items() if k == "constraint" and st in ("failure", "warning"))
        if violated:
            warn(
                f"{violated} constraint(s) report violations ({summary['violation_rows']} row(s)); "
                "violations are indicated only and never block the analysis.",
                component=self.name,
            )
        else:
            success("No constraint violations reported.", component=self.name)

    #----------------
    def _execute_scan_or_analyze(self, cmd, executable_target: str, discovered_sources: dict, custom_env: dict) -> int:
        scan_cmd = [
            executable_target,
            cmd,
            "-configurationLocations", self.jqa.custom_config_path
        ]

        cwd = self.jqa.raw_outputs_dir

        self._log_execution_command(scan_cmd, cwd)
        return execute_tracked_command(scan_cmd, f"jqa_{cmd}", cwd=cwd, env=custom_env)

    def _execute_scan(self, executable_target: str, discovered_sources: dict, custom_env: dict) -> int:
        return self._execute_scan_or_analyze("scan", executable_target, {}, custom_env)

    def _execute_analyze(self, executable_target: str, custom_env: dict) -> int:
        return self._execute_scan_or_analyze("analyze", executable_target, {}, custom_env)


    #----------------
    def _log_execution_command(self, cmd, cwd) -> None:
        # Split runner commands line by line in stdout/log stream for transparent debugging topology layout
        formatted_cmd_string = " \\\n  ".join(cmd)
        info(f"Executing tracking cmd:\n  {formatted_cmd_string}\n(cwd={cwd})", component=self.name)

    #----------------
    def _extract_typescript_ast(self, discovered_sources: dict, custom_env: dict) -> None:
        """Runs @jqassistant/ts-lce in TypeScript project roots and moves generated AST JSON to proj_root."""
        ts_sources = discovered_sources.get("typescript_src", [])
        if not ts_sources:
            return

        jqa_ts_output = "jqa-ts-output.json"
        info(f"Extracting TypeScript AST for {len(ts_sources)} target path(s)...", component=self.name)

        processed_roots = set()
        for ts_path in ts_sources:
            proj_root = ts_path.replace(jqa_ts_output, "").rstrip("/")
            proj_root = proj_root.replace("typescript:project::", "")
            # Resolve project root containing package.json or tsconfig.json
            info(f"Extracting TypeScript AST for '{proj_root}' proj_root path...", component=self.name)

            # Destination outside hidden folder so jQAssistant won't skip it
            target_output_file = os.path.join(proj_root, jqa_ts_output)

            info(f"Running '@jqassistant/ts-lce' extractor in: {proj_root}", component=self.name)

            # Check if tsconfig.json exists in the project root
            cmd_p=""
            tsconfig_path = os.path.join(proj_root, "tsconfig.json")
            if os.path.exists(tsconfig_path):
              cmd_p="-p" # -p / --project: Indicates scanning a TypeScript project based on tsconfig.json

            # Check if react is used in the project by looking for react in package.json dependencies
            cmd_e=""
            package_json_path = os.path.join(proj_root, "package.json")
            if os.path.exists(package_json_path):
                with open(package_json_path, "r", encoding="utf-8") as f:
                    package_data = json.load(f)
                    dependencies = package_data.get("dependencies", {})
                    dev_dependencies = package_data.get("devDependencies", {})
                    if "react" in dependencies or "react" in dev_dependencies:
                      cmd_e="-e react" # -e <extractor> / --extractors: Specifies additional framework-specific concept extractors to activate (e.g., -e react to extract React components and JSX render hierarchies).

            cmd = ["npx", "--yes", "@jqassistant/ts-lce@1.4.4", cmd_p, cmd_e]
            info(f"Running jqassistant/ts-lce command: {' '.join(cmd)} in {proj_root}", component=self.name)

            try:
                # 1. Execute ts-lce (generates .reports/jqa/ts-output.json inside proj_root)
                execute_tracked_command(cmd, "ts_lce_extractor", cwd=proj_root, env=custom_env)

                # 2. Locate default output inside hidden folder
                reports_dir = os.path.join(proj_root, ".reports")
                default_generated_path = os.path.join(reports_dir, "jqa", "ts-output.json")

                # 3. Move to project root where scanner can freely read it
                if os.path.exists(default_generated_path):
                    shutil.move(default_generated_path, target_output_file)
                    info(f"Moved TypeScript AST report from '{default_generated_path}' -> '{target_output_file}'", component=self.name)

                    # 4. Clean up temporary .reports directory
                    if os.path.exists(reports_dir):
                        shutil.rmtree(reports_dir, ignore_errors=True)
                        info(f"Deleted temporary directory: {reports_dir}", component=self.name)
                else:
                    warn(f"Expected ts-lce report not found at: {default_generated_path}", component=self.name)

            except Exception as e:
                warn(f"TypeScript AST extraction failed in {proj_root}: {e}", component=self.name)
