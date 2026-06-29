#!/usr/bin/env bash
# =============================================================================
# fix-discovery-engine.sh
# Run from workspace root. Fixes 3 bugs in discovery_engine.py and main.py.
# =============================================================================
set -euo pipefail

GRE_SCRIPTS="scripts"

# ─── Portable In-Place Sed ────────────────────────────────────────────────────
_sed_i() {
    if sed --version 2>/dev/null | grep -q GNU; then
        sed -i "$@"
    else
        sed -i '' "$@"
    fi
}

# =============================================================================
# FIX A — Add __main__ block to discovery_engine.py
# WHY:  main.py calls:
#         subprocess.run([sys.executable, discovery_script, workspace_root, manifest_path])
#       But discovery_engine.py has NO __main__ block. Python executes it as
#       a module, defines the class, and exits 0 — without writing any file.
#       main.py logs "success" immediately after exit(0), then crashes when it
#       tries to open the non-existent manifest → FileNotFoundError.
# HOW:  Append a __main__ block that:
#         1. Creates the DiscoveryEngine with default config (scan everything)
#         2. Overrides self.manifest_path with the path from sys.argv[2]
#            (instead of the hardcoded .graph-rag-explorer/target/ default)
#         3. Ensures the parent directory exists
#         4. Calls generate_manifest() which writes to the overridden path
# =============================================================================
echo ""
echo "[1/3] Adding __main__ block to discovery_engine.py..."

DISCOVERY_ENGINE="${GRE_SCRIPTS}/core/discovery_engine.py"

if [ ! -f "$DISCOVERY_ENGINE" ]; then
    echo "  [SKIP] Not found: $DISCOVERY_ENGINE"
else
    # Guard: don't add the block twice
    if grep -q "__name__ == \"__main__\"" "$DISCOVERY_ENGINE"; then
        echo "  [SKIP] __main__ block already present in $DISCOVERY_ENGINE"
    else
        cat >> "$DISCOVERY_ENGINE" << 'EOF'

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
EOF
        echo "  [OK]   $DISCOVERY_ENGINE"
    fi
fi

# =============================================================================
# FIX B — Fix ParallelOrchestrator argument order in main.py
# WHY:  Current code:
#         orchestrator = ParallelOrchestrator(workspace_root, manifest_data, raw_outputs_dir)
#       manifest_data is a dict (JSON content) but ParallelOrchestrator.__init__
#       expects output_dir: str as arg 2.  os.path.abspath(dict) → TypeError.
#       raw_outputs_dir is a str path but config: dict is expected → .get() crash.
# HOW:  Pass output_dir (the consolidated path string already in scope) and {}
#       (empty config — main.py has no orchestrator-specific config to forward).
# =============================================================================
echo ""
echo "[2/3] Fixing ParallelOrchestrator argument order in main.py..."

MAIN_PY="${GRE_SCRIPTS}/core/main.py"

if [ ! -f "$MAIN_PY" ]; then
    echo "  [SKIP] Not found: $MAIN_PY"
else
    # Uses | as delimiter to avoid conflicts with () characters in the pattern
    _sed_i 's|orchestrator = ParallelOrchestrator(workspace_root, manifest_data, raw_outputs_dir)|orchestrator = ParallelOrchestrator(workspace_root, output_dir, {})|g' "$MAIN_PY"
    echo "  [OK]   $MAIN_PY"
fi

# =============================================================================
# FIX C — Fix raw_outputs_dir path in main.py
# WHY:  Current code:
#         raw_outputs_dir = os.path.join(output_dir, "raw_outputs")
#       output_dir is .graph-rag-explorer/code-graph, so raw_outputs_dir
#       resolves to code-graph/raw_outputs — but ParallelOrchestrator writes
#       node/java analysis results to target/raw_outputs (hardcoded via
#       self.target_dir = workspace/.graph-rag-explorer/target).
#       After execute_analysis_pool() saves the good consolidated graph to
#       code-graph/, main.py then creates a second GraphEngine, loads from the
#       empty code-graph/raw_outputs, and silently OVERWRITES the correct graph
#       with an empty one.
# HOW:  Point raw_outputs_dir at the actual output location of the analyzers:
#       workspace_root/.graph-rag-explorer/target/raw_outputs
# =============================================================================
echo ""
echo "[3/3] Fixing raw_outputs_dir path in main.py..."

if [ ! -f "$MAIN_PY" ]; then
    echo "  [SKIP] Not found: $MAIN_PY"
else
    _sed_i 's|raw_outputs_dir = os\.path\.join(output_dir, "raw_outputs")|raw_outputs_dir = os.path.join(workspace_root, ".graph-rag-explorer", "target", "raw_outputs")|g' "$MAIN_PY"
    echo "  [OK]   $MAIN_PY"
fi

# =============================================================================
# Done
# =============================================================================
echo ""
echo "✅ fix(discovery/main): discovery_engine.py now has a __main__ block that writes to the correct manifest path; ParallelOrchestrator receives proper (output_dir, {}) args; raw_outputs_dir now resolves to target/raw_outputs where analyzers actually write — prevents empty-graph overwrite."
