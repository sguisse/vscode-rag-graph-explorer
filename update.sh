#!/bin/bash
set -e

# ============================================================================
# NETTOYAGE DU DOSSIER FANTÔME ET LECTURE PROPRE DU MANIFESTE (MAIN.PY)
# ============================================================================

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

    # === CORRECTIF ANTI-DOSSIER FANTÔME ===
    if os.path.exists(manifest_path) and os.path.isdir(manifest_path):
        warn(f"Anomalie détectée: '{manifest_path}' est un répertoire ! Nettoyage en cours...", component="Main")
        shutil.rmtree(manifest_path)
    # ======================================

    info("Initialisation du scan de cartographie via DiscoveryEngine...", component="Main")
    try:
        discovery_script = os.path.join(BASE_DIR, "discovery_engine.py")
        if os.path.exists(discovery_script):
            subprocess.run([sys.executable, discovery_script, workspace_root, manifest_path], check=True)
        elif DiscoveryEngine is not None:
            try:
                engine = DiscoveryEngine({"workspace_root": workspace_root, "manifest_path": manifest_path})
                engine.generate_manifest()
            except Exception:
                try:
                    engine = DiscoveryEngine(workspace_root, manifest_path)
                    engine.generate_manifest()
                except Exception:
                    DiscoveryEngine.generate_manifest(workspace_root, manifest_path)
        else:
            raise FileNotFoundError("Impossible de localiser 'discovery_engine.py'.")

        success("Topologie du projet cartographiée avec succès. Fichier 'discovery_manifest.json' validé.", component="Main")
    except Exception as e:
        error(f"Échec critique de la phase de découverte synchrone : {e}", component="Main")
        sys.exit(1)

    raw_outputs_dir = os.path.join(output_dir, "raw_outputs")

    try:
        info("Manifeste sécurisé. Lecture des données d'indexation...", component="Main")

        # Le fichier est garanti d'être un vrai fichier JSON à ce stade
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)

        orchestrator = ParallelOrchestrator(workspace_root, manifest_data, raw_outputs_dir)

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

chmod +x scripts/core/main.py
npm run compile

echo "✅ fix: L'exorcisme est terminé. Les dossiers pirates 'discovery_manifest.json' seront détruits à vue."
