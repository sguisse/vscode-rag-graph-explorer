#!/usr/bin/env python3
import os
import sys
import json
import subprocess

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info, warn, error, success

class DependencyCruiserInstaller:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.tool_subpath = "node/dependency_cruiser"
        self.status = {}

    def find_target_dir(self, phase: str) -> str:
        current = os.path.abspath(self.base_dir)
        while current != os.path.dirname(current):
            if os.path.basename(current) == ".graph-rag-explorer":
                return os.path.join(current, "target", "install_outputs", self.tool_subpath, phase)
            current = os.path.dirname(current)
        return os.path.abspath(os.path.join(self.base_dir, "../../../../target/install_outputs", self.tool_subpath, phase))

    def snapshot_environment(self, phase: str):
        """ Étape dédiée : Exécution du check et sauvegarde du rapport structurel """
        check_script = os.path.join(self.base_dir, "install_check.py")
        output_dir = self.find_target_dir(phase)
        os.makedirs(output_dir, exist_ok=True)

        res = subprocess.run([sys.executable, check_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        json_payload = None
        for line in res.stdout.splitlines():
            if "{" in line and "}" in line:
                start = line.find("{")
                end = line.rfind("}") + 1
                json_payload = line[start:end]
                break

        if not json_payload:
            raise ValueError("No structural mapping payload recovered from checklist stream.")

        self.status = json.loads(json_payload)
        with open(os.path.join(output_dir, "status.json"), "w", encoding="utf-8") as f:
            json.dump(self.status, f, indent=2, ensure_ascii=False)

    def install_packages(self):
        """ Étape dédiée : Résolution locale JIT des modules node_modules """
        if self.status.get("dependency_cruiser", {}).get("status") == "✅":
            return

        node_dir = os.path.abspath(os.path.join(self.base_dir, ".."))
        info("Running localized node dependency provisioning loop via npm install...", component="DependencyCruiserInstall")
        try:
            subprocess.run(["npm", "install"], cwd=node_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            pass

    def run(self):
        """ Orchestration globale séquentielle des étapes isolées """
        self.snapshot_environment("before")
        summary = self.status.get("summary", {})

        if summary.get("globalStatus") == "✅":
            success("Optimization Triggered: All checks passed. Skipping installation.", component="DependencyCruiserInstall")
            self.snapshot_environment("after")
            return

        info(f"Analyzing environmental status matrix (KO: {summary.get('koCount')}). Syncing runtime layers...", component="DependencyCruiserInstall")

        self.install_packages()

        self.snapshot_environment("after")

if __name__ == "__main__":
    installer = DependencyCruiserInstaller()
    installer.run()
