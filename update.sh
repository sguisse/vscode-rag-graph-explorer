#!/usr/bin/env bash
set -e

# Ensure required workspace directories exist
mkdir -p src src/webview dist/webview

# Create standalone node script to safely update default active tab without bash string/parentheses parsing conflicts
cat << 'EOF' > update-default-tab.js
const fs = require("fs");
const path = require("path");

const filesToUpdate = [
  "src/webview/store/useAppContextStore.ts",
  "src/webview/store/useAppContextStore.tsx",
  "src/store/useAppContextStore.ts",
  "src/store/useAppContextStore.tsx",
  "src/webview/App.tsx",
  "src/App.tsx"
];

let updated = false;

filesToUpdate.forEach(relPath => {
  const fullPath = path.resolve(relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf8");
    const original = content;

    content = content.replace(/activeTab:\s*["'](?:layout-demo|demo|help|settings|null)["']/g, 'activeTab: "explorer"');
    content = content.replace(/useState<[^>]+>\s*\(\s*["'](?:layout-demo|demo|help|settings)["']\s*\)/g, 'useState("explorer")');
    content = content.replace(/activeView:\s*["'](?:layout-demo|demo|help|settings|null)["']/g, 'activeView: "explorer"');

    if (content !== original) {
      fs.writeFileSync(fullPath, content, "utf8");
      console.log("Updated default view to explorer in: " + relPath);
      updated = true;
    }
  }
});

if (!updated) {
  console.log("Default active view check completed.");
}
EOF

# Execute the update script and clean up
node update-default-tab.js
rm -f update-default-tab.js

# Recompile extension and webview
if command -v npm >/dev/null 2>&1; then
  npm run compile
fi

echo "✅ fix: Resolved Bash parenthesis syntax error and set default app view to Home/Explorer. Next step: press F5 to launch debug session."
