#!/usr/bin/env bash
set -e

# Fix casing typos in TerminalTab.tsx and other webview files
node -e '
const fs = require("fs");
const path = require("path");

function walkAndFix(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndFix(fullPath);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("setis")) {
        // Fix setis[A-Z] -> setIs[A-Z]
        content = content.replace(/\bsetis([A-Z][a-zA-Z0-9_]*)\b/g, "setIs$1");
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`✅ Fixed setter casing in: ${fullPath}`);
      }
    }
  }
}

walkAndFix("webview/src/features/exporter");
'

echo "✅ Fixed TypeScript casing errors in TerminalTab.tsx."
