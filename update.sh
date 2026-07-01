#!/usr/bin/env bash
set -e

# Ensure core script directories exist
mkdir -p scripts/core
mkdir -p scripts/install/modules/system/neo4j

# Modern static type checkers (like Pylance/Pyright) and non-Windows runtimes flag
# subprocess.CREATE_NEW_PROCESS_GROUP as an AttributeError because it is conditionally defined on Windows only.
# Replacing it with a safe getattr fallback solves both runtime platform leaks and static analysis validation blocks.

# 1. Update existing utils.py file
UTILS_SCRIPT="scripts/core/utils.py"
if [ -f "$UTILS_SCRIPT" ]; then
    sed -i.bak 's/subprocess\.CREATE_NEW_PROCESS_GROUP/getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 512)/g' "$UTILS_SCRIPT"
    rm -f "${UTILS_SCRIPT}.bak"
fi

# 2. Update existing system neo4j install.py file
INSTALL_SCRIPT="scripts/install/modules/system/neo4j/install.py"
if [ -f "$INSTALL_SCRIPT" ]; then
    sed -i.bak 's/subprocess\.CREATE_NEW_PROCESS_GROUP/getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 512)/g' "$INSTALL_SCRIPT"
    rm -f "${INSTALL_SCRIPT}.bak"
fi

# Recompile the VS Code webview asset bundle
npm run compile

echo "✅ fix: Protected 'CREATE_NEW_PROCESS_GROUP' references with cross-platform 'getattr' defaults to clear static linting blocks and runtime attribute failures."
