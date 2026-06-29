import os
import shutil
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.neo4j_client import Neo4jClient
from core.utils import info, error, execute_tracked_command

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
        java_files = [f for f in manifest_data.get("files", []) if f.endswith(".java")]
        workspace_root = manifest_data.get("workspace_root", os.getcwd())

        version = config_matrix.get("jqassistant", {}).get("version", "2.9.1")
        report_sub_setup = config_matrix.get("jqassistant", {}).get("xmlReportPath", "./target/site/jacoco/jacoco.xml")
        java_raw_output_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"

        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant.sh"
        executable_target = base_cmd if shutil.which(base_cmd) else ("jqassistant" if shutil.which("jqassistant") else None)

        # REALIGNED PATH: Fallback to tracking absolute structural workspace paths mapping sandboxed distribution bundles inside tools
        if not executable_target:
            sandbox_root = f"{workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/jqassistant-{version}"
            local_bin_path = self._find_sandboxed_binary(sandbox_root, base_cmd)
            if local_bin_path and os.path.exists(local_bin_path):
                executable_target = local_bin_path
                if os.name != 'nt':
                    os.chmod(executable_target, 0o755)

        if not executable_target:
            error("Aborting analysis sequence loop: jQAssistant executable command string could not be resolved from tools path repositories.", component=self.name)
            return

        info(f"[jQAssistant Engine] Initializing bytecode scanning cycle via '{executable_target}'. Appending report: {report_sub_setup}", component=self.name)
        execute_tracked_command([executable_target, "scan", "-f", java_raw_output_dir], "jqa_scan", cwd=workspace_root)

        for file in java_files:
            neo4j_client.execute_write(
                "MERGE (f:File:Java {path: $path}) SET f.name = $name",
                {"path": file, "name": file.split("/")[-1]}
            )
