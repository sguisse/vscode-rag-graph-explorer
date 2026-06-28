#!/usr/bin/env python3
import os
import sys
import json
import signal
import importlib.util
import concurrent.futures

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info, warn, error, success

REGISTERED_TOOLS = []

def cleanup_and_exit(signum, frame):
    """Graceful event listener clearing orphan background worker sub-processes upon termination."""
    warn("Interrupt signal intercepted. Purging active AST wrappers...", component="JavaAnalyzer")
    for tool_entry in REGISTERED_TOOLS:
        tool = tool_entry.get("instance")
        if tool and hasattr(tool, 'kill'):
            tool.kill()
    sys.exit(1)

signal.signal(signal.SIGINT, cleanup_and_exit)
signal.signal(signal.SIGTERM, cleanup_and_exit)

def discover_strategies(base_dir: str):
    """Scans subdirectories and dynamically binds strategy files starting with run_analyze_ prefix."""
    tools = []
    for item in os.listdir(base_dir):
        item_path = os.path.join(base_dir, item)
        if os.path.isdir(item_path):
            for file in os.listdir(item_path):
                if file.startswith("run_analyze_") and file.endswith(".py"):
                    strategy_file = os.path.join(item_path, file)
                    try:
                        spec = importlib.util.spec_from_file_location(f"{item}_strategy", strategy_file)
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)

                        for attr_name in dir(module):
                            attr = getattr(module, attr_name)
                            if isinstance(attr, type) and hasattr(attr, 'execute') and hasattr(attr, 'kill'):
                                tools.append({"instance": attr(), "folder": item})
                    except Exception as e:
                        error(f"Failed loading strategy plugin from {strategy_file}: {e}", component="JavaAnalyzer")
    return tools

def main():
    if len(sys.argv) < 3:
        error("Usage: python java_analyzer.py <manifest_path> <output_dir>", component="JavaAnalyzer")
        sys.exit(1)

    manifest_path = os.path.abspath(sys.argv[1])
    output_dir = os.path.abspath(sys.argv[2])

    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    except Exception as e:
        error(f"Corrupted or missing Discovery Manifest: {e}", component="JavaAnalyzer")
        sys.exit(1)

    java_files = [f for f in manifest.get("files", []) if f.lower().endswith(".java")]
    if not java_files:
        info("No Java artifacts detected in current scope boundary. Bypassing engine.", component="JavaAnalyzer")
        os.makedirs(output_dir, exist_ok=True)
        sys.exit(0)

    info(f"Initializing Java Analysis Loop on {len(java_files)} verified artifacts from manifest...", component="JavaAnalyzer")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)

    pids_dir = os.path.join(os.path.dirname(manifest_path), "pids")
    os.makedirs(pids_dir, exist_ok=True)

    global REGISTERED_TOOLS
    REGISTERED_TOOLS = discover_strategies(base_dir)

    if not REGISTERED_TOOLS:
        error("No operational plugin parser strategies discovered.", component="JavaAnalyzer")
        sys.exit(1)

    tool_outputs = [
        os.path.join(output_dir, tool_entry["folder"], "graph.json")
        for tool_entry in REGISTERED_TOOLS
    ]

    # Execute all registered strategies concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(REGISTERED_TOOLS)) as executor:
        futures = {
            executor.submit(tool_entry["instance"].execute, manifest_path, out_path, pids_dir): tool_entry
            for tool_entry, out_path in zip(REGISTERED_TOOLS, tool_outputs)
        }
        concurrent.futures.wait(futures.keys())

    # Note: We let GraphEngine natively scan the structured isolated subdirectories recursively.
    # We deliberately do not write a global duplicate graph.json at the root of raw_outputs/java/ to avoid double counting metrics.
    success(f"Java Multi-Engine pipeline complete. Isolated graphs successfully saved into tool target paths.", component="JavaAnalyzer")

if __name__ == "__main__":
    main()
