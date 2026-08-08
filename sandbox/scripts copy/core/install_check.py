#!/usr/bin/env python3
import os
import sys
import json
import importlib.util

# Injection dynamique du répertoire courant pour importer utils sans pollution de chemin
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import info

class CoreChecker:
    def __init__(self):
        self.steps_count = 0  # Initialisation explicite à 0
        self.ko_count = 0
        self.status = {}

    def check_gitignore(self):
        """ ÉTAPE 1 (Lancée en premier) : Vérifie la présence de .graph-rag-explorer dans le .gitignore du workspace """
        self.steps_count += 1  # Incrémentation systématique au début de la méthode
        gitignore_path = os.path.join(os.getcwd(), ".gitignore")

        if os.path.exists(gitignore_path):
            try:
                with open(gitignore_path, "r", encoding="utf-8") as f:
                    content = f.read()
                if ".graph-rag-explorer" in content:
                    self.status["gitignore"] = {"status": "✅"}
                else:
                    self.status["gitignore"] = {
                        "status": "❌",
                        "message": "The '.graph-rag-explorer' exclusion rule is missing from your workspace .gitignore file."
                    }
                    self.ko_count += 1
            except Exception as e:
                self.status["gitignore"] = {"status": "❌", "message": f"Failed to read .gitignore file: {str(e)}"}
                self.ko_count += 1
        else:
            self.status["gitignore"] = {
                "status": "❌",
                "message": "Workspace does not contain a standard root level .gitignore configuration file."
            }
            self.ko_count += 1

    def check_python_runtime(self):
        """ ÉTAPE 2 : Validation de la conformité minimale de l'interpréteur Python exécutant le cœur """
        self.steps_count += 1
        if sys.version_info >= (3, 8):
            self.status["python"] = {"status": "✅"}
        else:
            self.status["python"] = {
                "status": "❌",
                "message": f"Python runtime verification constraint rule failed. Active interpreter version: {sys.version_info.major}.{sys.version_info.minor}"
            }
            self.ko_count += 1

    def check_networkx_engine(self):
        """ ÉTAPE 3 : Contrôle de disponibilité de la bibliothèque NetworkX """
        self.steps_count += 1
        if importlib.util.find_spec("networkx") is not None:
            self.status["networkx"] = {"status": "✅"}
        else:
            self.status["networkx"] = {
                "status": "❌",
                "message": "The core data model graphing abstraction layer module 'networkx' is unmapped in context lookup scopes."
            }
            self.ko_count += 1

    def generate_summary(self):
        self.status["summary"] = {
            "globalStatus": "✅" if self.ko_count == 0 else "⚠️",
            "stepsCount": str(self.steps_count),
            "koCount": self.ko_count,
            "okCount": self.steps_count - self.ko_count
        }

def run_check():
    checker = CoreChecker()
    checker.check_gitignore()  # Exécutée en premier comme explicitement demandé
    checker.check_python_runtime()
    checker.check_networkx_engine()
    checker.generate_summary()

    info(json.dumps(checker.status, ensure_ascii=False), component="CoreCheck")

if __name__ == "__main__":
    run_check()
