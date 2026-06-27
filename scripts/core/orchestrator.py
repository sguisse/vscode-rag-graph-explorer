import os
import signal
import subprocess
from discovery_engine import DiscoveryEngine
from graph_engine import GraphEngine
from utils import info, warn, success, error

class ParallelOrchestrator:
    # Ajout du paramètre output_dir
    def __init__(self, workspace_root: str, output_dir: str, config: dict):
        self.workspace_root = os.path.abspath(workspace_root)
        self.config = config
        self.target_dir = os.path.join(self.workspace_root, ".graph-rag-explorer", "target")
        self.pid_dir = os.path.join(self.target_dir, "pids")
        self.raw_out_node = os.path.join(self.target_dir, "raw_outputs", "node")

        # Le dossier de consolidation final pointe directement vers args.output (code-graph)
        self.consolidated_dir = os.path.abspath(output_dir)

        for d in [self.pid_dir, self.raw_out_node, self.consolidated_dir]:
            os.makedirs(d, exist_ok=True)

        self.cleanup_orphan_processes()

    def is_process_running(self, pid: int) -> bool:
        try: os.kill(pid, 0); return True
        except OSError: return False

    def cleanup_orphan_processes(self):
        purged = 0
        for f in os.listdir(self.pid_dir):
            if f.endswith(".pid"):
                path = os.path.join(self.pid_dir, f)
                try:
                    with open(path, "r") as pf: pid = int(pf.read().strip())
                    if self.is_process_running(pid):
                        os.kill(pid, signal.SIGKILL)
                        purged += 1
                except: pass
                finally: os.remove(path)
        if purged > 0: warn(f"{purged} processus orphelins nettoyés.", component="Orchestrator")

    def _bootstrap_node_analyzer(self) -> str:
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        node_project_dir = os.path.join(script_dir, "analyzers", "node")
        node_modules_dir = os.path.join(node_project_dir, "node_modules")

        if not os.path.exists(node_modules_dir):
            info("📦 Installation JIT des dépendances Node.js (Dependency-Cruiser)...", component="Orchestrator")
            try:
                subprocess.run(["npm", "install"], cwd=node_project_dir, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                success("Environnement Node.js initialisé avec succès.", component="Orchestrator")
            except subprocess.CalledProcessError as e:
                error(f"Échec de l'installation NPM: {e.stderr.decode('utf-8', errors='replace')}", component="Orchestrator")
                raise RuntimeError("Impossible de démarrer l'analyseur Node.")
        return os.path.join(node_project_dir, "analyzer.js")

    def run_node_analyzer(self, manifest_path: str):
        analyzer_js = self._bootstrap_node_analyzer()
        info("Lancement de l'analyseur Web (AST Node.js)...", component="Orchestrator")

        p = subprocess.Popen(["node", analyzer_js, manifest_path, self.raw_out_node])

        pid_file = os.path.join(self.pid_dir, f"{p.pid}.pid")
        with open(pid_file, "w") as f: f.write(str(p.pid))

        p.wait()
        if os.path.exists(pid_file): os.remove(pid_file)

    def execute_analysis_pool(self):
        discovery = DiscoveryEngine(self.workspace_root, self.config)
        manifest_path = discovery.generate_manifest()

        self.run_node_analyzer(manifest_path)

        engine = GraphEngine()
        engine.load_raw_outputs(os.path.join(self.target_dir, "raw_outputs"))
        engine.save_to_workspace(self.consolidated_dir)
