import os
import re
import json
from typing import Dict, Any
from core.utils import info, success, normalize_path

class DiscoveryEngine:
    def __init__(self, workspace_root: str, config: Dict[str, Any]):
        self.workspace_root = normalize_path(workspace_root)
        self.output_path = f"{self.workspace_root}/.graph-rag-explorer/target/discovery_manifest.json"

        exclude_regex_str = config.get("excludePathsRegex", r"\.git|node_modules|dist|target")
        self.exclude_paths = re.compile(exclude_regex_str, re.IGNORECASE)
        self.include_extensions = config.get("includeExtensions", [".java", ".ts", ".js", ".py", ".md"])

    def generate_manifest(self) -> str:
        info("Crawling workspace filesystem structural boundaries...", component="DiscoveryEngine")
        valid_files = []

        for root, _, files in os.walk(self.workspace_root):
            norm_root = normalize_path(root)
            if self.exclude_paths.search(norm_root):
                continue

            for file in files:
                _, ext = os.path.splitext(file)
                if ext.lower() in self.include_extensions:
                    full_path = normalize_path(os.path.join(norm_root, file))
                    valid_files.append(full_path)

        manifest_data = {
            "workspace_root": self.workspace_root,
            "total_files": len(valid_files),
            "files": valid_files
        }

        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)

        return self.output_path
