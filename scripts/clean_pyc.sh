#!/usr/bin/env bash
# Script to recursively remove Python compiled bytecode (.pyc) files and __pycache__ directories.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validation check: Ensure SCRIPT_DIR contains '/scripts' folder
if [[ "${SCRIPT_DIR}" != *"/scripts"* && "${SCRIPT_DIR}" != *"/scripts" ]]; then
    echo "❌ ERROR: Target path '${SCRIPT_DIR}' does not contain '/scripts' directory." >&2
    echo "Operation aborted for safety reasons." >&2
    exit 1
fi

echo "🧹 Recursively removing all .pyc files in ${SCRIPT_DIR}..."

# Count items before deletion
PYC_COUNT=$(find "${SCRIPT_DIR}" -type f -name "*.pyc" | wc -l | tr -d ' ')
PYCACHE_COUNT=$(find "${SCRIPT_DIR}" -type d -name "__pycache__" | wc -l | tr -d ' ')

# Find and delete all .pyc files
find "${SCRIPT_DIR}" -type f -name "*.pyc" -delete

# Find, log, and remove all __pycache__ directories
find "${SCRIPT_DIR}" -type d -name "__pycache__" -exec echo "🗑️ Removing folder: {}" \; -exec rm -rf {} + 2>/dev/null

echo "✨ Python bytecode cleanup completed successfully!"
echo "📊 Summary: Removed ${PYC_COUNT} .pyc file(s) and${PYCACHE_COUNT} __pycache__ folder(s)."