#!/usr/bin/env bash
set -e

INSTALL_FILE="scripts/install/modules/system/neo4j/install.py"

if [ ! -f "$INSTALL_FILE" ]; then
    INSTALL_FILE="/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/01-vscode/vscode-rag-graph-explorer/scripts/install/modules/system/neo4j/install.py"
fi

if [ -f "$INSTALL_FILE" ]; then
    node -e '
    const fs = require("fs");
    const filePath = process.argv[1];
    let content = fs.readFileSync(filePath, "utf8");

    if (content.includes("self.boot_neo4j_process(self.neo4j_cmd)")) {
        content = content.replace(
            "self.boot_neo4j_process(self.neo4j_cmd)",
            "self.boot_neo4j_process(self.neo4j_ctx.neo4j_cmd)"
        );
        fs.writeFileSync(filePath, content, "utf8");
    }
    ' "$INSTALL_FILE"
fi

echo "✅ Fixed SystemNeo4jInstaller attribute error by correctly referencing self.neo4j_ctx.neo4j_cmd!"
