#!/usr/bin/env python3
import os
import sys
import json
import subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import info, warn, error, success

class CoreInstaller:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.tool_subpath = "core"
        self.status = {}

    def find_target_dir(self, phase: str) -> str:
        """ Détermine l'emplacement exact d'exportation au sein de l'architecture install_outputs """
        current = os.path.abspath(self.base_dir)
        while current != os.path.dirname(current):
            if os.path.basename(current) == ".graph-rag-explorer":
                return os.path.join(current, "target", "install_outputs", self.tool_subpath, phase)
            current = os.path.dirname(current)
        return os.path.abspath(os.path.join(self.base_dir, "../../target/install_outputs", self.tool_subpath, phase))

    def snapshot_environment(self, phase: str):
        """ Exécute l'analyse de statut et écrit les résultats sous forme d'instantané structurel JSON """
        check_script = os.path.join(self.base_dir, "install_check.py")
        output_dir = self.find_target_dir(phase)
        os.makedirs(output_dir, exist_ok=True)

        res = subprocess.run([sys.executable, check_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", check=True)
        json_payload = None
        for line in res.stdout.splitlines():
            if "{" in line and "}" in line:
                start = line.find("{")
                end = line.rfind("}") + 1
                json_payload = line[start:end]
                break

        if not json_payload:
            raise ValueError("No structural mapping payload recovered from core checklist stream.")

        self.status = json.loads(json_payload)
        with open(os.path.join(output_dir, "status.json"), "w", encoding="utf-8") as f:
            json.dump(self.status, f, indent=2, ensure_ascii=False)

    def patch_workspace_gitignore(self):
        """ Injection de la règle d'exclusion de l'extension si elle est absente ou non détectée """
        if self.status.get("gitignore", {}).get("status") == "✅":
            return

        info("Injecting missing tracking restriction rule '.graph-rag-explorer' inside workspace .gitignore...", component="CoreInstall")
        gitignore_path = os.path.join(os.getcwd(), ".gitignore")

        try:
            content = ""
            if os.path.exists(gitignore_path):
                with open(gitignore_path, "r", encoding="utf-8") as f:
                    content = f.read()

            if content and not content.endswith("\n"):
                content += "\n"

            # Ajout propre avec commentaires délimitant le bloc de configuration
            content += "\n# [Graph RAG Explorer] Local compilation target folder exclusion rule\n.graph-rag-explorer\n"

            with open(gitignore_path, "w", encoding="utf-8") as f:
                f.write(content)
            success("Successfully append '.graph-rag-explorer' metadata exclusion pattern in workspace .gitignore.", component="CoreInstall")
        except Exception as e:
            error(f"Failed patching local repository tracker layout parameters: {e}", component="CoreInstall")

    def ensure_graphify_dependencies(self):
        """ Force la présence de networkx si l'environnement s'avère incomplet """
        if self.status.get("networkx", {}).get("status") == "✅":
            return

        info("Installing required base plotting dependency frameworks (networkx)...", component="CoreInstall")
        try:
            cmd = [sys.executable, "-m", "pip", "install", "networkx", "--break-system-packages"]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception as e:
            warn(f"Non-blocking core package automatic provisioning alert: {e}", component="CoreInstall")

    def run(self):
        """ Point d'entrée de l'orchestration séquentielle isolée de chaque étape """
        self.snapshot_environment("before")
        summary = self.status.get("summary", {})

        if summary.get("globalStatus") == "✅":
            success("Optimization Triggered: Core metrics are healthy. Bypassing setup loops entirely.", component="CoreInstall")
            self.snapshot_environment("after")
            return

        info(f"Analyzing orchestrator health matrices (KO: {summary.get('koCount')}). Standardizing runtime configurations...", component="CoreInstall")

        self.patch_workspace_gitignore()
        self.ensure_graphify_dependencies()

        self.snapshot_environment("after")

if __name__ == "__main__":
    installer = CoreInstaller()
    installer.run()
