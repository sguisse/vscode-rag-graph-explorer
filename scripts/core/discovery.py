import os
import re
from typing import List, Dict
from utils import debug, info, warn, error, success

def glob_to_regex(pattern: str) -> str:
    clean = pattern.strip()
    if not clean:
        return ".*"
    if clean.startswith("^") or clean.endswith("$"):
        return clean
    p = clean.replace(".", "\\.").replace("+", "\\+").replace("(", "\\(").replace(")", "\\)")
    p = p.replace("**/", ".*")
    p = p.replace("*", ".*")
    p = p.replace("?", ".")
    return p

class PathFilter:
    def __init__(self, include_patterns: List[str], exclude_patterns: List[str]):
        info("Initialisation du filtre de fichiers de l'espace de travail.", component="Discovery")
        self.includes = []
        for p in include_patterns:
            if p.strip():
                rx_str = glob_to_regex(p)
                try:
                    self.includes.append(re.compile(rx_str))
                    debug(f"Motif d'inclusion compilé : '{p}' -> '{rx_str}'", component="Discovery")
                except Exception as e:
                    warn(f"Motif d'inclusion invalide ignoré '{p}':", e, component="Discovery")

        self.excludes = []
        for p in exclude_patterns:
            if p.strip():
                rx_str = glob_to_regex(p)
                try:
                    self.excludes.append(re.compile(rx_str))
                    debug(f"Motif d'exclusion compilé : '{p}' -> '{rx_str}'", component="Discovery")
                except Exception as e:
                    warn(f"Motif d'exclusion invalide ignoré '{p}':", e, component="Discovery")

    def should_analyze(self, file_path: str) -> bool:
        normalized_path = file_path.replace("\\", "/")
        for rx in self.excludes:
            if rx.search(normalized_path):
                debug(f"Fichier VETO-EXCLUDED [Motif: {rx.pattern}] -> {normalized_path}", component="Discovery")
                return False
        if self.includes:
            match = any(rx.search(normalized_path) for rx in self.includes)
            if not match:
                debug(f"Fichier sauté (hors inclusion) -> {normalized_path}", component="Discovery")
                return False
        debug(f"Fichier AUTORISÉ -> {normalized_path}", component="Discovery")
        return True

class WorkspaceScanner:
    def __init__(self, root_path: str, path_filter: PathFilter):
        self.root_path = os.path.abspath(root_path)
        self.path_filter = path_filter

    def scan_and_partition(self) -> Dict[str, List[str]]:
        info(f"Début du scan de l'arborescence : {self.root_path}", component="Discovery")
        partitions = {"JAVA": [], "TS_JS": [], "PYTHON": [], "OTHER": []}
        if not os.path.exists(self.root_path):
            error(f"Le chemin racine spécifié n'existe pas : {self.root_path}", component="Discovery")
            return partitions

        total_scanned = 0
        for root, _, files in os.walk(self.root_path):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, self.root_path)

                if not self.path_filter.should_analyze(rel_path):
                    continue

                total_scanned += 1
                lower_file = file.lower()
                _, ext = os.path.splitext(lower_file)

                if lower_file in ["pom.xml", "build.gradle"] or ext == ".java":
                    partitions["JAVA"].append(full_path)
                    debug(f"Partitionné sous [JAVA] -> {rel_path}", component="Discovery")
                elif lower_file in ["package.json", "tsconfig.json"] or ext in [".ts", ".tsx", ".js", ".jsx"]:
                    partitions["TS_JS"].append(full_path)
                    debug(f"Partitionné sous [TS_JS] -> {rel_path}", component="Discovery")
                elif lower_file in ["requirements.txt", "pyproject.toml", "pipfile"] or ext == ".py":
                    partitions["PYTHON"].append(full_path)
                    debug(f"Partitionné sous [PYTHON] -> {rel_path}", component="Discovery")
                else:
                    partitions["OTHER"].append(full_path)
                    debug(f"Partitionné sous [OTHER] -> {rel_path}", component="Discovery")

        success(f"Scan complété. Fichiers retenus : {total_scanned} | Java: {len(partitions['JAVA'])} | TS/JS: {len(partitions['TS_JS'])} | Py: {len(partitions['PYTHON'])}", component="Discovery")
        return partitions
