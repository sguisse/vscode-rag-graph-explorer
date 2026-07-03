import os
import re
import json

from core.vscode_settings_4_backend import vsCodeSettings

from core.utils import info

def discover_workspace_sources(workspace_root: str):
    excludePathsRegex = vsCodeSettings.get("excludePathsRegex")
    info(f"Starting workspace source discovery in: {workspace_root} with exclusion pattern: {excludePathsRegex}", component="SourceDiscovery")
    exclude_pattern = re.compile(excludePathsRegex, re.IGNORECASE)

    discovered = {
        "java_src": set(),
        "java_classes": set(),
        "typescript_src": set(),
        "javascript_src": set()
    }

    # Normalisation du chemin racine
    workspace_root = workspace_root.replace("\\", "/")

    for root, dirs, files in os.walk(workspace_root):
        norm_root = root.replace("\\", "/")

        # 💡 FIX 1 : Filtrage de os.walk en reconstruisant le chemin complet simulé.
        # On teste le chemin complet (ex: "/mon_projet/.history") et non juste le nom brut (ex: ".history").
        if exclude_pattern:
            dirs[:] = [
                d for d in dirs
                if not exclude_pattern.search(f"{norm_root}/{d}")
            ]

        # 💡 FIX 2 : Sécurité défensive. Si le dossier courant est censé être exclu,
        # on passe immédiatement au suivant sans analyser ses fichiers.
        if exclude_pattern and exclude_pattern.search(norm_root):
            continue

        # Heuristiques standards de découverte des dossiers de sources
        if norm_root.endswith("src/main/java"):
            discovered["java_src"].add(norm_root)

        elif norm_root.endswith("src") or norm_root.endswith("src/main/ts"):
            if any(f.endswith(".ts") for f in files):
                discovered["typescript_src"].add(norm_root)
            if any(f.endswith(".js") for f in files):
                discovered["javascript_src"].add(norm_root)

    # Conversion des sets en listes pour la sérialisation JSON
    final_payload = {k: sorted(list(v)) for k, v in discovered.items()}

    info(f"Completed workspace source discovery, found: {final_payload}", component="SourceDiscovery")

    return final_payload
