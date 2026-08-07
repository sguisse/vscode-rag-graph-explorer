import os
import re
import json
from typing import List, Set, Dict
from core.utils import info

def _process_java_src(norm_root: str, discovered_set: Set[str]) -> None:
    """Identifies and registers Java source code roots."""
    if norm_root.endswith("src/main/java"):
        discovered_set.add(norm_root)

def _process_java_classes(norm_root: str, discovered_set: Set[str]) -> None:
    """Identifies compiled bytecode targets and formats them for the jQAssistant CLI."""
    if norm_root.endswith("target/classes"):
        # Explicitly prepend the jQAssistant classpath scanner protocol prefix
        jqa_classpath_target = f"java:classpath::{norm_root}"
        discovered_set.add(jqa_classpath_target)

def _process_web_src(norm_root: str, files: List[str], discovered: Dict[str, Set[str]]) -> None:
    """Identifies and registers JavaScript and TypeScript UI layers."""
    if norm_root.endswith("src") or norm_root.endswith("src/main/ts"):
        if any(f.endswith(".ts") or f.endswith(".tsx") for f in files):
            discovered["typescript_src"].add(norm_root)
        if any(f.endswith(".js") or f.endswith(".jsx") for f in files):
            discovered["javascript_src"].add(norm_root)

def discover_workspace_sources(workspace_root: str, exclude_paths_regex: str) -> dict:
    info(f"Starting workspace source discovery in: {workspace_root} with exclusion pattern: {exclude_paths_regex}", component="SourceDiscovery")
    exclude_pattern = re.compile(exclude_paths_regex, re.IGNORECASE) if exclude_paths_regex else None

    discovered = {
        "java_src": set(),
        "java_classes": set(),
        "typescript_src": set(),
        "javascript_src": set()
    }

    # Normalize root path
    workspace_root = workspace_root.replace("\\", "/")

    for root, dirs, files in os.walk(workspace_root):
        norm_root = root.replace("\\", "/")

        # FIX 1: Filter os.walk directories by building mock relative check lines
        if exclude_pattern:
            dirs[:] = [
                d for d in dirs
                if not exclude_pattern.search(f"{norm_root}/{d}")
            ]

        # FIX 2: Defensive check. Skip tracking entirely if current path is explicitly ignored
        if exclude_pattern and exclude_pattern.search(norm_root):
            continue

        # Delegate concerns to dedicated submethods
        _process_java_src(norm_root, discovered["java_src"])
        _process_java_classes(norm_root, discovered["java_classes"])
        _process_web_src(norm_root, files, discovered)

    # Convert sets to sorted lists for clean JSON serialization payloads
    final_payload = {k: sorted(list(v)) for k, v in discovered.items()}

    info(f"Completed workspace source discovery, found: {final_payload}", component="SourceDiscovery")

    return final_payload
