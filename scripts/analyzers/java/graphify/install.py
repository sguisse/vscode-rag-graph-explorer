#!/usr/bin/env python3
import os
import sys
import json
import subprocess

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info, warn, error, success

class GraphifyInstaller:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.tool_subpath = "java/graphify"
        self.status = {}

    def find_target_dir(self, phase: str) -> str:
        """ Remonte l'arborescence pour localiser la racine .graph-rag-explorer """
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

        res = subprocess.run([sys.executable, check_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", check=True)
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

    def setup_graphifyignore(self):
        """ Étape dédiée : Algorithme de fusion dédoublonnée du .graphifyignore """
        if self.status.get("graphifyignore", {}).get("status") == "✅":
            return

        info("Configuring missing .graphifyignore by merging workspace .gitignore and tool template...", component="GraphifyInstall")
        ignore_lines = []

        default_template = ["out", "dist", "node_modules", ".vscode/", ".idea/", ".vscode-test/", "*.vsix", ".history/", "exported-files/", "*.bak*", "*.lock", "graphify-out/", ".claude/"]
        template_path = os.path.join(self.base_dir, ".graphifyignore")
        if os.path.exists(template_path):
            try:
                with open(template_path, "r", encoding="utf-8") as tf:
                    default_template = [line.strip() for line in tf if line.strip()]
            except Exception:
                pass

        for line in default_template:
            if line not in ignore_lines:
                ignore_lines.append(line)

        workspace_gitignore = os.path.join(os.getcwd(), ".gitignore")
        if os.path.exists(workspace_gitignore):
            try:
                with open(workspace_gitignore, "r", encoding="utf-8") as gf:
                    for line in gf:
                        cleaned = line.strip()
                        if cleaned and not cleaned.startswith("#") and cleaned not in ignore_lines:
                            ignore_lines.append(cleaned)
            except Exception as e:
                warn(f"Failed to read workspace .gitignore: {e}", component="GraphifyInstall")

        try:
            target_ignore = os.path.join(os.getcwd(), ".graphifyignore")
            with open(target_ignore, "w", encoding="utf-8") as out_f:
                out_f.write("\n".join(ignore_lines) + "\n")
            success("Successfully generated merged .graphifyignore file at workspace root.", component="GraphifyInstall")
        except Exception as e:
            error(f"Failed to write merged .graphifyignore at workspace root: {e}", component="GraphifyInstall")

    def install_packages(self):
        """ Étape dédiée : Provisionnement du binaire via uvx """
        if self.status.get("graphify", {}).get("status") == "✅":
            return

        info("Invoking uvx package sync installation layer for graphifyy...", component="GraphifyInstall")
        try:
            subprocess.run(["uvx", "--refresh", "graphifyy[all]"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception as e:
            warn(f"Non-blocking installation layout alert: {e}")

    def run(self):
        """ Orchestration globale séquentielle des étapes isolées """
        self.snapshot_environment("before")
        summary = self.status.get("summary", {})

        if summary.get("globalStatus") == "✅":
            success("Optimization Triggered: All checks passed. Skipping installation workflow.", component="GraphifyInstall")
            self.snapshot_environment("after")
            return

        info(f"Analyzing environmental status matrix (KO: {summary.get('koCount')}). Syncing runtime layers...", component="GraphifyInstall")

        self.setup_graphifyignore()
        self.install_packages()

        self.snapshot_environment("after")

if __name__ == "__main__":
    installer = GraphifyInstaller()
    installer.run()
