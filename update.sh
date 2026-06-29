#!/usr/bin/env bash
# =============================================================================
# fix-subprocess-encoding.sh
# Run from workspace root. Fixes two cross-platform bugs in .graph-rag-explorer
# =============================================================================
set -euo pipefail

GRE_SCRIPTS="scripts"

# ─── Portable In-Place Sed ────────────────────────────────────────────────────
# macOS (BSD sed) needs: -i ''   |   Linux/GitBash (GNU sed) needs: -i
_sed_i() {
    if sed --version 2>/dev/null | grep -q GNU; then
        sed -i "$@"
    else
        sed -i '' "$@"
    fi
}

# ─── Portable import injector (avoids sed \n portability issue) ───────────────
# Inserts 'import sys' after first 'import os' line, only if not already present
_inject_import_sys() {
    local file="$1"
    if ! grep -q "^import sys$" "$file"; then
        awk '/^import os$/ && !done { print; print "import sys"; done=1; next } 1' \
            "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
        echo "    + injected: import sys -> ${file}"
    fi
}

# =============================================================================
# FIX 1 — snapshot_environment(): add encoding="utf-8" to subprocess.run()
# WHY:  text=True without encoding= defaults to cp1252 on Windows.
#       utils.py emits UTF-8 emoji bytes (✅ ❌ ⚠️) that cp1252 cannot decode.
#       _readerthread crashes → res.stdout is None → AttributeError: splitlines.
# HOW:  encoding="utf-8", errors="replace" ensures correct decoding on all OS.
#       The pattern "text=True, check=True" is unique to these subprocess calls.
# =============================================================================
echo ""
echo "[1/4] Patching snapshot_environment() subprocess encoding in all install.py files..."

INSTALL_FILES=(
    "${GRE_SCRIPTS}/core/install.py"
    "${GRE_SCRIPTS}/analyzers/java/code_graph/install.py"
    "${GRE_SCRIPTS}/analyzers/java/graphify/install.py"
    "${GRE_SCRIPTS}/analyzers/node/dependency_cruiser/install.py"
    "${GRE_SCRIPTS}/analyzers/node/swc/install.py"
)

for f in "${INSTALL_FILES[@]}"; do
    if [ ! -f "$f" ]; then
        echo "  [SKIP] Not found: $f"
        continue
    fi
    # Replace:  text=True, check=True
    # With:     text=True, encoding="utf-8", errors="replace", check=True
    _sed_i 's/text=True, check=True/text=True, encoding="utf-8", errors="replace", check=True/g' "$f"
    echo "  [OK]   $f"
done

# =============================================================================
# FIX 2 — Replace hardcoded "python3" with sys.executable
# WHY:  On Windows, "python3" is not in PATH. sys.executable always resolves
#       to the exact Python interpreter running the extension, on all platforms.
# =============================================================================

echo ""
echo "[2/4] Patching run_analyze_codegraph.py (python3 → sys.executable)..."

CODEGRAPH="${GRE_SCRIPTS}/analyzers/java/code_graph/run_analyze_codegraph.py"
if [ -f "$CODEGRAPH" ]; then
    # This file imports os/subprocess/signal/json but NOT sys — inject it
    _inject_import_sys "$CODEGRAPH"
    _sed_i 's/"python3", install_script/sys.executable, install_script/g' "$CODEGRAPH"
    echo "  [OK]   $CODEGRAPH"
else
    echo "  [SKIP] Not found: $CODEGRAPH"
fi

echo ""
echo "[3/4] Patching run_analyze_graphify.py (python3 → sys.executable)..."

GRAPHIFY="${GRE_SCRIPTS}/analyzers/java/graphify/run_analyze_graphify.py"
if [ -f "$GRAPHIFY" ]; then
    # This file already imports sys — no injection needed
    _sed_i 's/"python3", install_script/sys.executable, install_script/g' "$GRAPHIFY"
    echo "  [OK]   $GRAPHIFY"
else
    echo "  [SKIP] Not found: $GRAPHIFY"
fi

echo ""
echo "[4/4] Patching orchestrator.py (python3 → sys.executable)..."

ORCHESTRATOR="${GRE_SCRIPTS}/core/orchestrator.py"
if [ -f "$ORCHESTRATOR" ]; then
    # orchestrator.py imports os/signal/subprocess but NOT sys — inject it
    _inject_import_sys "$ORCHESTRATOR"
    _sed_i 's/"python3", java_analyzer_py/sys.executable, java_analyzer_py/g' "$ORCHESTRATOR"
    echo "  [OK]   $ORCHESTRATOR"
else
    echo "  [SKIP] Not found: $ORCHESTRATOR"
fi

# =============================================================================
# Done
# =============================================================================
echo ""
echo "✅ fix(subprocess/cross-platform): snapshot_environment() now uses encoding=\"utf-8\" on all install.py files (fixes UnicodeDecodeError/cp1252 crash on Windows); \"python3\" replaced with sys.executable in run_analyze + orchestrator for macOS/Windows/Linux portability."