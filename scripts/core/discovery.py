import os
import re
from typing import List, Dict
from utils import debug, info, warn, error, success

def compile_regexes(patterns_str: str) -> List[re.Pattern]:
    if not patterns_str or not patterns_str.strip():
        return []
    # Cumulative multi-line or boundary delimited alternative split logic
    parts = re.split(r'[\n,;]', patterns_str)
    compiled = []
    for p in parts:
        p_clean = p.strip()
        if p_clean:
            try:
                compiled.append(re.compile(p_clean))
            except Exception as e:
                warn(f"Expression régulière invalide ignorée '{p_clean}': {e}", component="Discovery")
    return compiled

def matches_any(text: str, compiled_regexes: List[re.Pattern]) -> bool:
    if not compiled_regexes:
        return False
    return any(rx.search(text) for rx in compiled_regexes)

class PathFilter:
    # Restored the 4-argument constructor to match main.py and prevent the immediate Python crash!
    def __init__(self, include_paths: str, exclude_paths: str, include_exts: str, exclude_exts: str):
        info("Initialisation du filtre de fichiers via expressions régulières cumulatives.", component="Discovery")
        self.inc_paths = compile_regexes(include_paths)
        self.exc_paths = compile_regexes(exclude_paths)
        self.inc_exts = compile_regexes(include_exts)
        self.exc_exts = compile_regexes(exclude_exts)

    def should_exclude_dir(self, rel_dirpath: str) -> bool:
        # Prepend and append '/' to simulate an absolute-like relative path boundaries.
        # This allows user regexes like ".*/node_modules/.*" to flawlessly match root folders (e.g. "/node_modules/")
        normalized_path = "/" + rel_dirpath.replace("\\", "/").strip("/") + "/"
        if self.exc_paths and matches_any(normalized_path, self.exc_paths):
            return True
        return False

    def is_file_allowed(self, rel_filepath: str, filename: str) -> bool:
        # Prepend '/' for the same boundary-matching reason
        normalized_path = "/" + rel_filepath.replace("\\", "/").lstrip("/")

        if self.inc_paths and not matches_any(normalized_path, self.inc_paths):
            return False
        if self.exc_paths and matches_any(normalized_path, self.exc_paths):
            return False
        if self.inc_exts and not matches_any(filename, self.inc_exts):
            return False
        if self.exc_exts and matches_any(filename, self.exc_exts):
            return False
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
        for root, dirs, files in os.walk(self.root_path):
            rel_root = os.path.relpath(root, self.root_path).replace("\\", "/")
            if rel_root == ".":
                rel_root = ""

            # Prune directory tracking traversal loops immediately using specific lookups
            pruned_dirs = []
            for d in dirs:
                dir_rel_path = f"{rel_root}/{d}" if rel_root else d
                if not self.path_filter.should_exclude_dir(dir_rel_path):
                    pruned_dirs.append(d)
                else:
                    debug(f"Répertoire sauté (Veto exclusion) -> {dir_rel_path}", component="Discovery")
            dirs[:] = pruned_dirs

            for file in files:
                full_path = os.path.join(root, file)
                rel_fp = f"{rel_root}/{file}" if rel_root else file

                if not self.path_filter.is_file_allowed(rel_fp, file):
                    continue

                total_scanned += 1
                lower_file = file.lower()
                _, ext = os.path.splitext(lower_file)

                if lower_file in ["pom.xml", "build.gradle"] or ext == ".java":
                    partitions["JAVA"].append(full_path)
                    debug(f"Partitionné sous [JAVA] -> {rel_fp}", component="Discovery")
                elif lower_file in ["package.json", "tsconfig.json"] or ext in [".ts", ".tsx", ".js", ".jsx"]:
                    partitions["TS_JS"].append(full_path)
                    debug(f"Partitionné sous [TS_JS] -> {rel_fp}", component="Discovery")
                elif lower_file in ["requirements.txt", "pyproject.toml", "pipfile"] or ext == ".py":
                    partitions["PYTHON"].append(full_path)
                    debug(f"Partitionné sous [PYTHON] -> {rel_fp}", component="Discovery")
                else:
                    partitions["OTHER"].append(full_path)
                    debug(f"Partitionné sous [OTHER] -> {rel_fp}", component="Discovery")

        success(f"Scan complété. Fichiers retenus : {total_scanned} | Java: {len(partitions['JAVA'])} | TS/JS: {len(partitions['TS_JS'])} | Py: {len(partitions['PYTHON'])}", component="Discovery")
        return partitions
