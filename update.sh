#!/usr/bin/env bash
set -e

# Ensure the core directories exist
mkdir -p scripts/core

# Overwrite scripts/core/discovery_engine.py with proper configuration loading and diagnostic logging
cat << 'EOF' > scripts/core/discovery_engine.py
import os
import re
import json
from typing import List, Dict
from utils import info, warn, success

class DiscoveryEngine:
    def __init__(self, workspace_root: str, config: Dict):
        self.workspace_root = os.path.abspath(workspace_root).replace("\\", "/")
        self.target_dir = os.path.join(self.workspace_root, ".graph-rag-explorer", "target")
        self.manifest_path = os.path.join(self.target_dir, "discovery_manifest.json")
        os.makedirs(self.target_dir, exist_ok=True)

        self.inc_paths = self._compile_regex("includePathsRegex", config.get("includePathsRegex", ".*"))
        self.exc_paths = self._compile_regex("excludePathsRegex", config.get("excludePathsRegex", ""))
        self.inc_exts = self._compile_regex("includeExtensionsRegex", config.get("includeExtensionsRegex", ""))
        self.exc_exts = self._compile_regex("excludeExtensionsRegex", config.get("excludeExtensionsRegex", ""))

        # Strategic diagnostic logs utilizing the info logging interface from utils.py
        info(f"Loaded includePathsRegex patterns: {[p.pattern for p in self.inc_paths]}", component="Discovery")
        info(f"Loaded excludePathsRegex patterns: {[p.pattern for p in self.exc_paths]}", component="Discovery")
        info(f"Loaded includeExtensionsRegex patterns: {[p.pattern for p in self.inc_exts]}", component="Discovery")
        info(f"Loaded excludeExtensionsRegex patterns: {[p.pattern for p in self.exc_exts]}", component="Discovery")

    def _compile_regex(self, name: str, pattern_str: str) -> List[re.Pattern]:
        if not pattern_str: return []
        patterns = [p.strip() for p in re.split(r'[\n,;]', pattern_str) if p.strip()]
        compiled = []
        for p in patterns:
            try:
                compiled.append(re.compile(p))
            except Exception as e:
                warn(f"Failed to compile regex pattern '{p}' for config element '{name}': {e}", component="Discovery")
        return compiled

    def _matches_any(self, text: str, regex_list: List[re.Pattern]) -> bool:
        if not regex_list: return False
        return any(r.search(text) for r in regex_list)

    def _is_allowed(self, rel_path: str, filename: str) -> bool:
        if self.inc_paths and not self._matches_any(rel_path, self.inc_paths): return False
        if self.exc_paths and self._matches_any(rel_path, self.exc_paths): return False
        if self.inc_exts and not self._matches_any(filename, self.inc_exts): return False
        if self.exc_exts and self._matches_any(filename, self.exc_exts): return False
        return True

    def generate_manifest(self) -> str:
        info("Génération du Manifeste d'Indexation (Discovery)...", component="Discovery")
        valid_files = []

        for root, dirs, files in os.walk(self.workspace_root):
            rel_root = "./" + os.path.relpath(root, self.workspace_root).replace("\\", "/")
            if rel_root == "./.":
                rel_root = "."

            if self.exc_paths:
                dirs[:] = [d for d in dirs if not self._matches_any(f"{rel_root}/{d}", self.exc_paths)]

            for file in files:
                rel_path = f"{rel_root}/{file}"
                if self._is_allowed(rel_path, file):
                    abs_path = os.path.join(root, file).replace("\\", "/")
                    valid_files.append(abs_path)

        manifest_data = {
            "workspace_root": self.workspace_root,
            "total_files": len(valid_files),
            "files": valid_files
        }

        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        success(f"Manifeste généré : {len(valid_files)} fichiers validés pour l'analyse.", component="Discovery")
        return self.manifest_path

if __name__ == "__main__":
    import sys as _sys
    if len(_sys.argv) < 3:
        print("Usage: discovery_engine.py <workspace_root> <manifest_path>", file=_sys.stderr)
        _sys.exit(1)

    _config = {}
    if "ENGINE_CONFIG" in os.environ:
        try:
            _config = json.loads(os.environ["ENGINE_CONFIG"])
        except Exception:
            pass

    _engine = DiscoveryEngine(_sys.argv[1], _config)
    _engine.manifest_path = os.path.abspath(_sys.argv[2])
    os.makedirs(os.path.dirname(_engine.manifest_path), exist_ok=True)
    _engine.generate_manifest()
EOF

# Overwrite scripts/core/main.py to propagate the JSON standard input parameters down to the orchestrator and discovery subprocess environment layers
cat << 'EOF' > scripts/core/main.py
#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import shutil

# 1. POINT D'ENTRÉE DU CYCLE DE VIE
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
core_install_script = os.path.join(BASE_DIR, "install.py")

try:
    subprocess.run([sys.executable, core_install_script], check=True)
except subprocess.CalledProcessError as e:
    print(f"[-] Erreur critique lors de l'exécution du cycle d'installation du cœur (Core) : {e}")
    sys.exit(1)

# 2. CHARGEMENT DES DÉPENDANCES
from utils import info, success, error, warn
from orchestrator import ParallelOrchestrator
from install_summary import generate_final_install_status

try:
    from discovery_engine import DiscoveryEngine
except ImportError:
    DiscoveryEngine = None

def main():
    # Ingest runtime configuration matrix from layout context standard input stream
    config = {}
    if not sys.stdin.isatty():
        try:
            config = json.loads(sys.stdin.read())
        except Exception:
            config = {}

    clean_args = [arg for arg in sys.argv[1:] if not arg.startswith('-')]
    provided_paths = [os.path.abspath(p) for p in clean_args if p.strip()]

    manifest_path = None
    workspace_root = None
    output_dir = None

    for p in provided_paths:
        if p.endswith(".json"):
            manifest_path = p
            break

    dir_paths = [p for p in provided_paths if p != manifest_path]

    for p in dir_paths:
        if ".graph-rag-explorer" in p or "target" in p or "raw_outputs" in p:
            output_dir = p
        else:
            workspace_root = p

        if not workspace_root and dir_paths:
            workspace_root = dir_paths[0]

    if workspace_root:
        if not output_dir:
            output_dir = os.path.join(workspace_root, ".graph-rag-explorer", "target")
        if not manifest_path:
            manifest_path = os.path.join(output_dir, "discovery_manifest.json")

    if not workspace_root or not manifest_path or not output_dir:
        print(f"[-] Erreur critique d'arguments. Reçu: {sys.argv[1:]}")
        sys.exit(1)

    info("Démarrage de la phase d'orchestration globale du réseau de neurones de graphes...", component="Main")
    info(f"Workspace actif : {workspace_root}", component="Main")
    info(f"Manifeste cible : {manifest_path}", component="Main")
    info(f"Dossier de sortie : {output_dir}", component="Main")

    if os.path.exists(manifest_path) and os.path.isdir(manifest_path):
        warn(f"Anomalie détectée: '{manifest_path}' est un répertoire ! Nettoyage en cours...", component="Main")
        shutil.rmtree(manifest_path)

    info("Initialisation du scan de cartographie via DiscoveryEngine...", component="Main")
    try:
        discovery_script = os.path.join(BASE_DIR, "discovery_engine.py")
        if os.path.exists(discovery_script):
            subprocess.run(
                [sys.executable, discovery_script, workspace_root, manifest_path],
                env={**os.environ, "ENGINE_CONFIG": json.dumps(config)},
                check=True
            )
        elif DiscoveryEngine is not None:
            try:
                engine = DiscoveryEngine(workspace_root, config)
                engine.generate_manifest()
            except Exception:
                try:
                    engine = DiscoveryEngine({"workspace_root": workspace_root, "manifest_path": manifest_path})
                    engine.generate_manifest()
                except Exception:
                    DiscoveryEngine.generate_manifest(workspace_root, manifest_path)
        else:
            raise FileNotFoundError("Impossible de localiser 'discovery_engine.py'.")

        success("Topologie du projet cartographiée avec succès. Fichier 'discovery_manifest.json' validé.", component="Main")
    except Exception as e:
        error(f"Échec critique de la phase de découverte synchrone : {e}", component="Main")
        sys.exit(1)

    raw_outputs_dir = os.path.join(workspace_root, ".graph-rag-explorer", "target", "raw_outputs")

    try:
        info("Manifeste sécurisé. Lecture des données d'indexation...", component="Main")

        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)

        orchestrator = ParallelOrchestrator(workspace_root, output_dir, config)

        execution_triggered = False
        target_methods = [
            "execute_analysis_pool",
            "run_parallel_analysis", "start_analysis", "run_analysis",
            "execute", "run", "start", "run_analyzers", "analyze", "process"
        ]

        for method_name in target_methods:
            if hasattr(orchestrator, method_name):
                info(f"Point d'entrée analytique détecté : {method_name}(). Lancement du pipeline...", component="Main")
                getattr(orchestrator, method_name)()
                execution_triggered = True
                break

        if not execution_triggered:
            available_methods = [
                m for m in dir(orchestrator)
                if callable(getattr(orchestrator, m)) and not m.startswith('_')
            ]
            raise AttributeError(f"Aucune méthode standard trouvée. Méthodes publiquement disponibles : {available_methods}")

        from graph_engine import GraphEngine
        engine = GraphEngine()

        info("Fusion et réconciliation des couches de graphes isolées...", component="Main")
        engine.load_raw_outputs(raw_outputs_dir)
        engine.save_to_workspace(output_dir)

        success("🎉 Indexation et consolidation globale du Knowledge Graph terminées avec succès !", component="Main")

    except Exception as e:
        error(f"Échec critique durant l'arbre d'exécution parallèle : {e}", component="Main")
        sys.exit(1)

    finally:
        generate_final_install_status()

if __name__ == "__main__":
    main()
EOF

echo "✅ fix/logging: Connected standard input parsing pipeline configurations down to DiscoveryEngine runtime hooks and enabled structured diagnostic log output metrics!"
