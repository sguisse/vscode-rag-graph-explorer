import os
import re
import json
from typing import List, Dict
from utils import info, warn, success

class DiscoveryEngine:
    def __init__(self, workspace_root: str, config: Dict):
        self.workspace_root = os.path.abspath(workspace_root).replace("\\", "/")
        self.target_dir = os.path.join(self.workspace_root, ".graph-rag-explorer", "target")
        self.manifest_path = os.path.join(self.target_dir, "discovery_manifest.json")
        os.makedirs(self.target_dir, exist_ok=True)

        self.inc_paths = self._compile_regex(config.get("includePathsRegex", ".*"))
        self.exc_paths = self._compile_regex(config.get("excludePathsRegex", ""))
        self.inc_exts = self._compile_regex(config.get("includeExtensionsRegex", ""))
        self.exc_exts = self._compile_regex(config.get("excludeExtensionsRegex", ""))

    def _compile_regex(self, pattern_str: str) -> List[re.Pattern]:
        if not pattern_str: return []
        patterns = [p.strip() for p in re.split(r'[\n,;]', pattern_str) if p.strip()]
        compiled = []
        for p in patterns:
            try: compiled.append(re.compile(p))
            except Exception: pass
        return compiled

    def _matches_any(self, text: str, regex_list: List[re.Pattern]) -> bool:
        if not regex_list: return False
        return any(r.search(text) for r in regex_list)

    def _is_allowed(self, rel_path: str, filename: str) -> bool:
        if self.inc_paths and not self._matches_any(rel_path, self.inc_paths): return False
        if self.exc_paths and self._matches_any(rel_path, self.exc_paths): return False
        if self.inc_exts and not self._matches_any(filename, self.inc_exts): return False
        if self.exc_exts and self._matches_any(filename, self.exc_exts): return False
        return True

    def generate_manifest(self) -> str:
        info("Génération du Manifeste d'Indexation (Discovery)...", component="Discovery")
        valid_files = []

        for root, dirs, files in os.walk(self.workspace_root):
            # FIX: Restauration du formatage originel ("./" ou ".") attendu par les Regex
            rel_root = "./" + os.path.relpath(root, self.workspace_root).replace("\\", "/")
            if rel_root == "./.":
                rel_root = "."

            # Exclusions des dossiers pour stopper le crawl (Performance)
            if self.exc_paths:
                dirs[:] = [d for d in dirs if not self._matches_any(f"{rel_root}/{d}", self.exc_paths)]

            for file in files:
                rel_path = f"{rel_root}/{file}"
                if self._is_allowed(rel_path, file):
                    abs_path = os.path.join(root, file).replace("\\", "/")
                    valid_files.append(abs_path)

        manifest_data = {
            "workspace_root": self.workspace_root,
            "total_files": len(valid_files),
            "files": valid_files
        }

        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        success(f"Manifeste généré : {len(valid_files)} fichiers validés pour l'analyse.", component="Discovery")
        return self.manifest_path

if __name__ == "__main__":
    import sys as _sys
    if len(_sys.argv) < 3:
        print("Usage: discovery_engine.py <workspace_root> <manifest_path>", file=_sys.stderr)
        _sys.exit(1)
    # Create engine with empty config (include-all default behaviour)
    _engine = DiscoveryEngine(_sys.argv[1], {})
    # Override the hardcoded .graph-rag-explorer/target/ manifest path with the
    # caller-supplied path so the file is written to exactly where main.py expects it
    _engine.manifest_path = os.path.abspath(_sys.argv[2])
    os.makedirs(os.path.dirname(_engine.manifest_path), exist_ok=True)
    _engine.generate_manifest()
