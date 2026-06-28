#!/usr/bin/env python3
import os
import sys
import json
import subprocess

# 1. POINT D'ENTRÉE DU CYCLE DE VIE : Exécuter l'installation du cœur avant tout le reste
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
core_install_script = os.path.join(BASE_DIR, "install.py")

try:
    # Appel synchrone du script d'installation du cœur
    subprocess.run([sys.executable, core_install_script], check=True)
except subprocess.CalledProcessError as e:
    print(f"[-] Erreur critique lors de l'exécution du cycle d'installation du cœur (Core) : {e}")
    sys.exit(1)

# 2. CHARGEMENT DES DÉPENDANCES ET UTILS APRÈS LA SÉCURISATION DE L'ENVIRONNEMENT
from utils import info, success, error
from orchestrator import ParallelOrchestrator

def load_manifest(manifest_path):
    if not os.path.exists(manifest_path):
        error(f"Le manifeste d'indexation est introuvable au chemin : {manifest_path}", component="Main")
        sys.exit(1)
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        error(f"Impossible de lire le manifeste de découverte : {e}", component="Main")
        sys.exit(1)

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 main.py <workspace_root> <manifest_path> <output_dir>")
        sys.exit(1)

    workspace_root = os.path.abspath(sys.argv[1])
    manifest_path = os.path.abspath(sys.argv[2])
    output_dir = os.path.abspath(sys.argv[3])

    info("Démarrage de la phase d'orchestration globale du réseau de neurones de graphes...", component="Main")

    # Lecture du manifeste validé par le moteur Discovery
    manifest = load_manifest(manifest_path)

    # Configuration du dossier des sorties brutes par rapport au dossier cible
    raw_outputs_dir = os.path.join(output_dir, "raw_outputs")

    # Initialisation de l'orchestrateur parallèle multi-moteurs (Java et Node)
    orchestrator = ParallelOrchestrator(manifest, manifest_path, raw_outputs_dir)

    try:
        # Lancement en parallèle des sous-analyseurs du cycle AST
        orchestrator.run_parallel_analysis()

        # Consolidation finale et sauvegarde du graphe NetworkX unifié
        from graph_engine import GraphEngine
        engine = GraphEngine()

        info("Fusion et réconciliation des couches de graphes isolées...", component="Main")
        engine.load_raw_outputs(raw_outputs_dir)

        # Sauvegarde vers le dossier de destination finale de l'extension
        engine.save_to_workspace(output_dir)
        success("🎉 Indexation et consolidation globale du Knowledge Graph terminées avec succès !", component="Main")

    except Exception as e:
        error(f"Échec critique durant l'arbre d'exécution parallèle : {e}", component="Main")
        sys.exit(1)

if __name__ == "__main__":
    main()
