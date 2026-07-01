import os
import re
import json

def discover_workspace_sources(workspace_root: str, exclude_regex: str, output_path: str):
    exclude_pattern = re.compile(exclude_regex, re.IGNORECASE) if exclude_regex else None

    discovered = {
        "java_src": set(),
        "java_classes": set(),
        "typescript_src": set(),
        "javascript_src": set()
    }

    for root, dirs, files in os.walk(workspace_root):
        norm_root = root.replace("\\", "/")

        # Apply regex exclusion filter from config/package.json
        if exclude_pattern and exclude_pattern.search(norm_root):
            dirs[:] = []  # Stop traversing this branch
            continue

        # Standard heuristics for folder discovery
        if norm_root.endswith("src/main/java"):
            discovered["java_src"].add(norm_root)
        elif norm_root.endswith("target/classes") or norm_root.endswith("build/classes"):
            discovered["java_classes"].add(norm_root)
        elif norm_root.endswith("src") or norm_root.endswith("src/main/ts"):
            if any(f.endswith(".ts") for f in files):
                discovered["typescript_src"].add(norm_root)
            if any(f.endswith(".js") for f in files):
                discovered["javascript_src"].add(norm_root)

        # Fallback: Catch raw Java files outside standard layouts
        if any(f.endswith(".java") for f in files) and not norm_root.endswith("src/main/java"):
            discovered["java_src"].add(norm_root)

    # Convert sets to lists for JSON serialization
    final_payload = {k: list(v) for k, v in discovered.items()}

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2)

    return final_payload
