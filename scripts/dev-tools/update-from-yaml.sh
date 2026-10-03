#!/bin/bash
set -euo pipefail

# Thin, hand-maintained trigger for the YAML-manifest generation pipeline.
# All generated file content lives in update.yaml (validated before any disk write by
# dev-tools/apply_yaml_on_codebase.py), never inline bash heredocs.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
fi

PY_SCRIPT=""
SEARCH_SCRIPT_PATHS=(
    "${SCRIPT_DIR}/apply_yaml_on_codebase.py"
    "${SCRIPT_DIR}/apply-yaml-on-codebase.py"
    "${SCRIPT_DIR}/scripts/dev-tools/apply_yaml_on_codebase.py"
    "${SCRIPT_DIR}/scripts/dev-tools/apply-yaml-on-codebase.py"
    "${SCRIPT_DIR}/dev-tools/apply_yaml_on_codebase.py"
    "${SCRIPT_DIR}/dev-tools/apply-yaml-on-codebase.py"
    "$(pwd)/scripts/dev-tools/apply_yaml_on_codebase.py"
    "$(pwd)/scripts/dev-tools/apply-yaml-on-codebase.py"
    "$(pwd)/dev-tools/apply_yaml_on_codebase.py"
    "$(pwd)/dev-tools/apply-yaml-on-codebase.py"
    "$(pwd)/apply_yaml_on_codebase.py"
    "$(pwd)/apply-yaml-on-codebase.py"
)

for p in "${SEARCH_SCRIPT_PATHS[@]}"; do
    if [ -f "$p" ]; then
        PY_SCRIPT="$p"
        break
    fi
done

if [ -z "$PY_SCRIPT" ]; then
    echo "❌ Engine script (apply_yaml_on_codebase.py or apply-yaml-on-codebase.py) not found!"
    echo "ℹ️ Ensure the converted Python script exists in scripts/dev-tools/"
    exit 1
fi

echo "🚀 Invoking generation manifest pipeline..."
"$PYTHON_CMD" "$PY_SCRIPT" "$@"
