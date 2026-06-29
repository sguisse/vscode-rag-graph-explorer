import os
import sys
import signal
import subprocess
from discovery_engine import DiscoveryEngine
from graph_engine import GraphEngine
from utils import info, warn, success, error

class ParallelOrchestrator:
    def __init__(self, workspace_root: str, output_dir: str, config: dict):
        self.workspace_root = os.path.abspath(workspace_root)
        self.config = config
        self.target_dir = os.path.join(self.workspace_root, ".graph-rag-explorer", "target")
        self.pid_dir = os.path.join(self.target_dir, "pids")
        self.raw_out_node = os.path.join(self.target_dir, "raw_outputs", "node")
        self.raw_out_java = os.path.join(self.target_dir, "raw_outputs", "java")

        self.consolidated_dir = os.path.abspath(output_dir)

        for d in [self.pid_dir, self.raw_out_node, self.raw_out_java, self.consolidated_dir]:
            os.makedirs(d, exist_ok=True)

        self.cleanup_orphan_processes()

    def is_process_running(self, pid: int) -> bool:
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False

    def cleanup_orphan_processes(self):
        purged = 0
        for f in os.listdir(self.pid_dir):
            if f.endswith(".pid"):
                path = os.path.join(self.pid_dir, f)
                try:
                    with open(path, "r") as pf:
                        pid = int(pf.read().strip())
                    if self.is_process_running(pid):
                        os.kill(pid, signal.SIGKILL)
                        purged += 1
                except:
                    pass
                finally:
                    if os.path.exists(path):
                        os.remove(path)
        if purged > 0:
            warn(f"{purged} processus orphelins nettoyés.", component="Orchestrator")

    def run_node_analyzer(self, manifest_path: str):
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        analyzer_js = os.path.join(script_dir, "analyzers", "node", "node_analyzer.js")

        info("Lancement de l'analyseur Web (AST Node.js Architecture)...", component="Orchestrator")
        p = subprocess.Popen(["node", analyzer_js, manifest_path, self.raw_out_node])

        pid_file = os.path.join(self.pid_dir, f"node_orchestrator_{p.pid}.pid")
        with open(pid_file, "w") as f:
            f.write(str(p.pid))

        p.wait()
        if os.path.exists(pid_file):
            os.remove(pid_file)

    def run_java_analyzer(self, manifest_path: str):
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        java_analyzer_py = os.path.join(script_dir, "analyzers", "java", "java_analyzer.py")

        if not os.path.exists(java_analyzer_py):
            warn("Analyseur structural Java introuvable. Étape sautée.", component="Orchestrator")
            return

        info("Lancement de l'analyseur Java (Multi-Engine AST Pipeline)...", component="Orchestrator")
        p = subprocess.Popen([sys.executable, java_analyzer_py, manifest_path, self.raw_out_java])

        pid_file = os.path.join(self.pid_dir, f"java_orchestrator_{p.pid}.pid")
        with open(pid_file, "w") as f:
            f.write(str(p.pid))

        p.wait()
        if os.path.exists(pid_file):
            os.remove(pid_file)

    def execute_analysis_pool(self):
        discovery = DiscoveryEngine(self.workspace_root, self.config)
        manifest_path = discovery.generate_manifest()

        self.run_node_analyzer(manifest_path)
        self.run_java_analyzer(manifest_path)

        engine = GraphEngine()
        engine.load_raw_outputs(os.path.join(self.target_dir, "raw_outputs"))
        engine.save_to_workspace(self.consolidated_dir)
