#!/usr/bin/env python3
import os
import sys
import json
import shutil
import subprocess
import importlib.util

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info

class GraphifyChecker:
    def __init__(self):
        self.steps_count = 0  # Initialisation explicite à 0
        self.ko_count = 0
        self.status = {}

    def check_python(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        if sys.version_info >= (3, 8):
            self.status["python"] = {"status": "✅"}
        else:
            self.status["python"] = {
                "status": "❌",
                "message": f"Python 3.8+ constraint rule failure. Active version: {sys.version_info.major}.{sys.version_info.minor}"
            }
            self.ko_count += 1

    def check_pip(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        if importlib.util.find_spec("pip") is not None:
            self.status["pip"] = {"status": "✅"}
        else:
            self.status["pip"] = {
                "status": "❌",
                "message": "The pip package installation management system is unmapped."
            }
            self.ko_count += 1

    def check_graphifyignore(self):
        """ Vérifie si le fichier .graphifyignore est présent à la racine du workspace """
        self.steps_count += 1  # Incrémentation au début de la méthode
        ignore_path = os.path.join(os.getcwd(), ".graphifyignore")
        if os.path.exists(ignore_path):
            self.status["graphifyignore"] = {"status": "✅"}
        else:
            self.status["graphifyignore"] = {
                "status": "❌",
                "message": ".graphifyignore configuration file is missing from the workspace root."
            }
            self.ko_count += 1

    def check_graphify(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        graphify_ok = False
        if shutil.which("uvx") is not None:
            try:
                res = subprocess.run(
                    ["uvx", "--from", "graphifyy[all]", "graphify", "--help"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                if res.returncode == 0:
                    graphify_ok = True
            except Exception:
                pass

        if graphify_ok:
            self.status["graphify"] = {"status": "✅"}
        else:
            self.status["graphify"] = {
                "status": "❌",
                "message": "Graphify distribution package components are unmapped or incomplete inside the uvx target pipeline."
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
    checker = GraphifyChecker()
    checker.check_python()
    checker.check_pip()
    checker.check_graphifyignore()  # Nouvelle étape insérée de manière séquentielle
    checker.check_graphify()
    checker.generate_summary()

    info(json.dumps(checker.status, ensure_ascii=False), component="GraphifyCheck")

if __name__ == "__main__":
    run_check()
