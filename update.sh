#!/usr/bin/env bash
set -e

UTILS_FILES="backend/src/utils/utils-files.ts"
MANAGER_FILE="backend/src/managers/WorkspaceInstallation.manager.ts"

if [ ! -f "$UTILS_FILES" ]; then
    UTILS_FILES="/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/01-vscode/vscode-rag-graph-explorer/backend/src/utils/utils-files.ts"
fi

if [ ! -f "$MANAGER_FILE" ]; then
    MANAGER_FILE="/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/01-vscode/vscode-rag-graph-explorer/backend/src/managers/WorkspaceInstallation.manager.ts"
fi

node -e '
const fs = require("fs");
const utilsPath = process.argv[1];
const managerPath = process.argv[2];

if (fs.existsSync(utilsPath)) {
    let content = fs.readFileSync(utilsPath, "utf8");
    if (!content.includes("computeRecursivelyMD5")) {
        if (!content.includes("import * as crypto")) {
            content = "import * as crypto from \x27crypto\x27;\n" + content;
        }
        const computeFn = `
export function computeRecursivelyMD5(dirPath: string): string {
    if (!fs.existsSync(dirPath)) {
        return "";
    }
    const hash = crypto.createHash("md5");
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
        hash.update(fs.readFileSync(dirPath));
        return hash.digest("hex");
    }

    const entries = fs.readdirSync(dirPath).sort();
    for (const entry of entries) {
        if (shouldSkipScriptSyncEntry(entry)) continue;
        const fullPath = path.join(dirPath, entry);
        const entryStats = fs.statSync(fullPath);
        if (entryStats.isDirectory()) {
            hash.update(entry + ":" + computeRecursivelyMD5(fullPath));
        } else {
            const fileHash = crypto.createHash("md5").update(fs.readFileSync(fullPath)).digest("hex");
            hash.update(entry + ":" + fileHash);
        }
    }
    return hash.digest("hex");
}
`;
        content += "\n" + computeFn;
        fs.writeFileSync(utilsPath, content, "utf8");
    }
}

if (fs.existsSync(managerPath)) {
    let content = fs.readFileSync(managerPath, "utf8");
    if (!content.includes("computeRecursivelyMD5")) {
        content = content.replace(
            "import { copyFolderRecursiveSync } from \x27../utils/utils-files\x27;",
            "import { copyFolderRecursiveSync, computeRecursivelyMD5 } from \x27../utils/utils-files\x27;"
        );
    }

    const targetOld = `        const currentScriptsMD5 = "";
        const workspaceScriptsMD5 = "";`;

    const targetNew = `        const currentScriptsMD5 = computeRecursivelyMD5(this.getScriptSourceDir());
        const workspaceScriptsMD5 = computeRecursivelyMD5(this.getScriptTargetDir());`;

    if (content.includes(targetOld)) {
        content = content.replace(targetOld, targetNew);
    } else {
        content = content.replace(
            /const currentScriptsMD5 = ""[\s\S]*?const workspaceScriptsMD5 = "";/,
            "const currentScriptsMD5 = computeRecursivelyMD5(this.getScriptSourceDir());\n        const workspaceScriptsMD5 = computeRecursivelyMD5(this.getScriptTargetDir());"
        );
    }

    fs.writeFileSync(managerPath, content, "utf8");
}
' "$UTILS_FILES" "$MANAGER_FILE"

echo "✅ Script created/modified. WorkspaceInstallationManager now computes recursive MD5 hashes for source and target scripts!"
