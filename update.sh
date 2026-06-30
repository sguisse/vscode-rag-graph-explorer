#!/usr/bin/env bash
# Production-ready patch to fix Exit Code 126 (Permission Denied) by ensuring execution permissions are recursively granted across all sandboxed jQAssistant binaries and internal wrapper sub-scripts.

mkdir -p scripts/analyser/tools/java/jqassistant

cat << 'EOF' > scripts/analyser/tools/java/jqassistant/worker.py
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
        if not java_files:
            info("No Java target files detected in manifest paths. Bypassing jQAssistant pipeline loops.", component=self.name)
            return

        workspace_root = manifest_data.get("workspace_root", os.getcwd())

        version = config_matrix.get("jqassistant", {}).get("version", "2.9.1")
        report_sub_setup = config_matrix.get("jqassistant", {}).get("xmlReportPath", "./target/site/jacoco/jacoco.xml")
        java_raw_output_dir = f"{workspace_root}/.graph-rag-explorer/target/raw_outputs/java"

        base_cmd = "jqassistant.cmd" if os.name == 'nt' else "jqassistant.sh"
        executable_target = base_cmd if shutil.which(base_cmd) else ("jqassistant" if shutil.which("jqassistant") else None)

        if not executable_target:
            sandbox_root = f"{workspace_root}/.graph-rag-explorer/target/tools/java/jqassistant/jqassistant-{version}"
            local_bin_path = self._find_sandboxed_binary(sandbox_root, base_cmd)
            if local_bin_path and os.path.exists(local_bin_path):
                executable_target = local_bin_path
                if os.name != 'nt':
                    # Fix Exit Code 126 by recursively ensuring executable permissions on all sub-shells, internal scripts, and binaries inside the sandbox layout
                    for walk_root, _, walk_files in os.walk(sandbox_root):
                        for file in walk_files:
                            if file.endswith(".sh") or "bin" in walk_root.replace("\\", "/").split("/"):
                                try:
                                    os.chmod(os.path.join(walk_root, file), 0o755)
                                except Exception:
                                    pass

        if not executable_target:
            error("Aborting analysis sequence loop: jQAssistant executable command string could not be resolved from tools path repositories.", component=self.name)
            return

        # 1. Bytecode Scan Phase
        info(f"[jQAssistant Engine] Initializing bytecode scanning cycle via '{executable_target}' on path: {java_raw_output_dir}", component=self.name)
        scan_return_code = execute_tracked_command([executable_target, "scan", "-f", java_raw_output_dir], "jqa_scan", cwd=workspace_root)

        # 2. Structural Analysis Phase
        if scan_return_code == 0:
            info(f"[jQAssistant Engine] Scan operation completed successfully. Triggering rule enrichment analysis pass...", component=self.name)
            execute_tracked_command([executable_target, "analyze"], "jqa_analyze", cwd=workspace_root)
        else:
            error(f"[jQAssistant Engine] Ingestion scanning failed with exit status code {scan_return_code}. Bypassing subsequent analysis workflows.", component=self.name)

        for file in java_files:
            neo4j_client.execute_write(
                "MERGE (f:File:Java {path: $path}) SET f.name = $name",
                {"path": file, "name": file.split("/")[-1]}
            )
EOF

# Package the extension bundle configuration changes
npm run package

echo "✅ fix/permissions: Added recursive chmod mapping hooks over the entire sandboxed directory tree to eliminate nested runtime permission faults (Exit Code 126)!"
