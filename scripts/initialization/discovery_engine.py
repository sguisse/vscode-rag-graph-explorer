import os
import re
import json
from typing import List, Dict, Any
from core.utils import info, warn, success, normalize_path

class DiscoveryEngine:
    """Evaluates workspace file structures using multi-layered regex settings patterns."""
    def __init__(self, workspace_root: str, config: Dict[str, Any]):
        self.workspace_root = normalize_path(workspace_root)
        self.output_path = f"{self.workspace_root}/.graph-rag-explorer/target/discovery_manifest.json"
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

        # Read keys directly matching variables mapped out under package.json configuration nodes
        self.inc_paths = self._compile_regex("includePathsRegex", config.get("includePathsRegex", ".*"))
        self.exc_paths = self._compile_regex("excludePathsRegex", config.get("excludePathsRegex", ""))
        self.inc_exts = self._compile_regex("includeExtensionsRegex", config.get("includeExtensionsRegex", ""))
        self.exc_exts = self._compile_regex("excludeExtensionsRegex", config.get("excludeExtensionsRegex", ""))

        info(f"Loaded includePathsRegex criteria size: {len(self.inc_paths)}", component="DiscoveryEngine")
        info(f"Loaded excludePathsRegex criteria size: {len(self.exc_paths)}", component="DiscoveryEngine")
        info(f"Loaded includeExtensionsRegex criteria size: {len(self.inc_exts)}", component="DiscoveryEngine")
        info(f"Loaded excludeExtensionsRegex criteria size: {len(self.exc_exts)}", component="DiscoveryEngine")

    def _compile_regex(self, name: str, pattern_str: str) -> List[re.Pattern]:
        if not pattern_str:
            return []
        patterns = [p.strip() for p in re.split(r'[\n,;]', pattern_str) if p.strip()]
        compiled = []
        for p in patterns:
            try:
                compiled.append(re.compile(p))
            except Exception as e:
                warn(f"Failed compiling regex token '{p}' under setting key '{name}': {e}", component="DiscoveryEngine")
        return compiled

    def _matches_any(self, text: str, regex_list: List[re.Pattern]) -> bool:
        if not regex_list:
            return False
        return any(r.search(text) for r in regex_list)

    def _is_allowed(self, rel_path: str, filename: str) -> bool:
        if self.inc_paths and not self._matches_any(rel_path, self.inc_paths): return False
        if self.exc_paths and self._matches_any(rel_path, self.exc_paths): return False
        if self.inc_exts and not self._matches_any(filename, self.inc_exts): return False
        if self.exc_exts and self._matches_any(filename, self.exc_exts): return False
        return True

    def generate_manifest(self) -> str:
        info("Génération du Manifeste d'Indexation (Discovery)...", component="DiscoveryEngine")
        valid_files = []

        for root, dirs, files in os.walk(self.workspace_root):
            rel_root = "./" + os.path.relpath(root, self.workspace_root).replace("\\", "/")
            if rel_root == "./.":
                rel_root = "."

            # Prune directories mutable slices in-place for optimized platform tree navigation operations
            if self.exc_paths:
                dirs[:] = [d for d in dirs if not self._matches_any(f"{rel_root}/{d}", self.exc_paths)]

            for file in files:
                rel_path = f"{rel_root}/{file}"
                if self._is_allowed(rel_path, file):
                    abs_path = normalize_path(os.path.join(root, file))
                    valid_files.append(abs_path)

        # Compute and format metrics breakdown per extension
        extension_counts = {}
        for file_path in valid_files:
            _, ext = os.path.splitext(file_path)
            ext_key = ext.lower() if ext else "no_extension"
            extension_counts[ext_key] = extension_counts.get(ext_key, 0) + 1

        breakdown_string = ", ".join([f"{ext}: {count}" for ext, count in sorted(extension_counts.items())])
        info(f"Fichiers trouvés par extension : {breakdown_string}", component="DiscoveryEngine")

        manifest_data = {
            "workspace_root": self.workspace_root,
            "total_files": len(valid_files),
            "files": valid_files
        }

        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)

        success(f"Manifeste généré : {len(valid_files)} fichiers validés pour l'analyse.", component="DiscoveryEngine")
        return self.output_path
