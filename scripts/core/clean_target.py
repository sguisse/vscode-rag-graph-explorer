#!/usr/bin/env python3
import os
import shutil
import sys

# Ensure core modules can be resolved
script_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, script_dir)
sys.path.insert(0, os.path.abspath(os.path.join(script_dir, "..")))

from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info, success, warn

# Key folders/keywords to PRESERVE from deletion
PRESERVED_KEYWORDS = [
    "tools",
    "system/neo4j",
    "neo4j",
    "jqassistant",
    "jqassistant-graph-rag",
    ".venv",
    "venv",
    "models",
    "data",
    "databases",
    "git-clone"
]

# Transient folders to remove
CLEANABLE_DIR_NAMES = [
    "logs",
    "pids",
    "reports",
    "install_reports",
    "raw_outputs",
    "tmp"
]

# Extensions of files to delete outside preserved paths
CLEANABLE_FILE_EXTENSIONS = [
    ".log",
    ".pid",
    ".json",
    ".yaml",
    ".yml",
    ".tmp"
]


def is_preserved_path(path: str) -> bool:
    """Checks if the given path contains any keyword that should be preserved."""
    norm_path = path.replace("\\", "/").lower()
    path_segments = [seg for seg in norm_path.split("/") if seg]

    for keyword in PRESERVED_KEYWORDS:
        if keyword in path_segments or any(keyword in seg for seg in path_segments):
            return True
    return False


def is_valid_target_path(path: str, backend_rel_path: str) -> bool:
    """Verifies that 'target' and the backend workspace folder both exist in the path."""
    norm_path = path.replace("\\", "/").lower()
    segments = [seg for seg in norm_path.split("/") if seg]

    # Extract normalized backend directory segment (e.g., '.token-razor')
    backend_seg = os.path.basename(backend_rel_path.strip("/\\")).lower() or ".token-razor"

    has_target = "target" in segments
    has_backend = backend_seg in segments or backend_seg in norm_path

    return has_target and has_backend


def clean_target_workspace():
    workspace_root = vsCodeSettings.workspaceRoot or os.getcwd()
    backend_rel_path = vsCodeSettings.backendWorkspacePath or ".token-razor"

    target_base = os.path.abspath(os.path.join(workspace_root, backend_rel_path)).replace("\\", "/")

    if not os.path.exists(target_base):
        info(f"Target directory '{target_base}' does not exist. Nothing to clean.", component="CleanTarget")
        return

    info(f"🧹 Starting target workspace cleanup at: {target_base}", component="CleanTarget")

    cleaned_bytes = 0
    cleaned_files_count = 0
    cleaned_dirs_count = 0

    for root, dirs, files in os.walk(target_base, topdown=True):
        norm_root = root.replace("\\", "/")

        # Skip scanning inside preserved directories
        if is_preserved_path(norm_root):
            dirs.clear()
            continue

        # Check and remove cleanable subdirectories
        dirs_to_remove = []
        for d in dirs:
            dir_path = os.path.join(root, d).replace("\\", "/")

            # Safety check: Skip deletion if 'target' or backend workspace path is missing from path
            if not is_valid_target_path(dir_path, backend_rel_path):
                continue

            if d.lower() in CLEANABLE_DIR_NAMES and not is_preserved_path(dir_path):
                dirs_to_remove.append(d)
                try:
                    shutil.rmtree(dir_path)
                    cleaned_dirs_count += 1
                    info(f"  🗑️ Removed directory: {dir_path}", component="CleanTarget")
                except Exception as e:
                    warn(f"  ⚠️ Could not remove directory {dir_path}: {e}", component="CleanTarget")

        # Do not descend into removed directories
        for d in dirs_to_remove:
            dirs.remove(d)

        # Delete matching transient files
        for f in files:
            file_path = os.path.join(root, f).replace("\\", "/")

            # Safety checks: Skip if preserved or if target/backend validation fails
            if is_preserved_path(file_path) or not is_valid_target_path(file_path, backend_rel_path):
                continue

            _, ext = os.path.splitext(f)
            if ext.lower() in CLEANABLE_FILE_EXTENSIONS:
                try:
                    sz = os.path.getsize(file_path)
                    os.remove(file_path)
                    cleaned_files_count += 1
                    cleaned_bytes += sz
                    info(f"  📄 Removed file: {f}", component="CleanTarget")
                except Exception as e:
                    warn(f"  ⚠️ Could not remove file {file_path}: {e}", component="CleanTarget")

    formatted_size = f"{cleaned_bytes / (1024 * 1024):.2f} MB" if cleaned_bytes >= 1024 * 1024 else f"{cleaned_bytes / 1024:.2f} KB"
    success(
        f"✨ Target cleanup complete! Removed {cleaned_dirs_count} directories, "
        f"{cleaned_files_count} files ({formatted_size} freed). Installed tools preserved.",
        component="CleanTarget"
    )


if __name__ == "__main__":
    clean_target_workspace()
