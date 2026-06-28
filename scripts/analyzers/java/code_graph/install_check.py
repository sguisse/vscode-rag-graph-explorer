#!/usr/bin/env python3
import os
import sys
import json
import shutil
import subprocess

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info

class CodeGraphChecker:
    def __init__(self):
        self.steps_count = 0  # Initialisation explicite à 0
        self.ko_count = 0
        self.status = {}

    def check_node(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        if shutil.which("node") is not None:
            self.status["node"] = {"status": "✅"}
        else:
            self.status["node"] = {"status": "❌", "message": "Node.js environment executable runtime bindings are unmapped."}
            self.ko_count += 1

    def check_npm(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        if shutil.which("npm") is not None:
            self.status["npm"] = {"status": "✅"}
        else:
            self.status["npm"] = {"status": "❌", "message": "The npm packet installation shell controller tool could not be initialized."}
            self.ko_count += 1

    def check_codegraph(self):
        self.steps_count += 1  # Incrémentation au début de la méthode
        codegraph_ok = False
        if shutil.which("node") is not None and shutil.which("npm") is not None:
            try:
                res = subprocess.run(["npx", "--yes", "@codegraph/cli", "--help"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res.returncode == 0:
                    codegraph_ok = True
            except Exception:
                pass

        if codegraph_ok:
            self.status["codegraph"] = {"status": "✅"}
        else:
            self.status["codegraph"] = {"status": "❌", "message": "CodeGraph relational indices system CLI tool failed execution testing loops."}
            self.ko_count += 1

    def generate_summary(self):
        self.status["summary"] = {
            "globalStatus": "✅" if self.ko_count == 0 else "⚠️",
            "stepsCount": str(self.steps_count),
            "koCount": self.ko_count,
            "okCount": self.steps_count - self.ko_count
        }

def run_check():
    checker = CodeGraphChecker()
    checker.check_node()
    checker.check_npm()
    checker.check_codegraph()
    checker.generate_summary()

    info(json.dumps(checker.status, ensure_ascii=False), component="CodeGraphCheck")

if __name__ == "__main__":
    run_check()
