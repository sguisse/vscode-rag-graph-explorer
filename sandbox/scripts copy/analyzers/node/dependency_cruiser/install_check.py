#!/usr/bin/env python3
import os
import sys
import json
import shutil

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info

class DependencyCruiserChecker:
    def __init__(self):
        self.steps_count = 0  # Initialisation explicite à 0
        self.ko_count = 0
        self.status = {}

    def check_node(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        if shutil.which("node") is not None:
            self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {
                "status": "❌",
                "message": "Node.js environment executable runtime bindings are unmapped in active PATH targets."
            }
            self.ko_count += 1

    def check_npm(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        if shutil.which("npm") is not None:
            self.status["npm"] = {"status": "✅"}
        else:
            self.status["npm"] = {
                "status": "❌",
                "message": "The npm packet installation shell controller tool could not be initialized."
            }
            self.ko_count += 1

    def check_dependency_cruiser(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        dc_ok = False
        node_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        if os.path.exists(os.path.join(node_dir, "node_modules", "dependency-cruiser")):
            dc_ok = True

        if dc_ok:
            self.status["dependency_cruiser"] = {"status": "✅"}
        else:
            self.status["dependency_cruiser"] = {
                "status": "❌",
                "message": "The dependency-cruiser core analytical package module is missing from local node analyzer layout contexts."
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
    checker = DependencyCruiserChecker()
    checker.check_node()
    checker.check_npm()
    checker.check_dependency_cruiser()
    checker.generate_summary()

    info(json.dumps(checker.status, ensure_ascii=False), component="DependencyCruiserCheck")

if __name__ == "__main__":
    run_check()
