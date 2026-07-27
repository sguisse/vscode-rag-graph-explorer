#!/usr/bin/env bash
set -e

# Ensure required target directories exist
mkdir -p src/webview/constants src/constants

# 1. Create layout constants file in src/webview/constants/layout.ts
cat << 'EOF' > src/webview/constants/layout.ts
export const DefaultContainersSize = {
  workspaceTopHeight: 300,
  workspaceLeftWidth: 280,
  workspaceRightWidth: 320,
  workspaceBottomHeight: 220,
  sidebarWidth: 260,
  inspectorWidth: 320,
  terminalHeight: 200,
  minContainerSize: 100,
} as const;

export type DefaultContainersSizeType = typeof DefaultContainersSize;
EOF

# 2. Create re-export barrel in src/constants/layout.ts for global alias compatibility
cat << 'EOF' > src/constants/layout.ts
export * from '../webview/constants/layout';
EOF

# 3. Update any stores or components that reference container sizes to use DefaultContainersSize
node -e '
const fs = require("fs");
const path = require("path");

function scanAndUpdate(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanAndUpdate(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name) && !fullPath.includes("/constants/")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let original = content;

      // Inject import if DefaultContainersSize is referenced or can replace hardcoded container size defaults
      if (content.includes("workspaceTopHeight") || content.includes("workspaceLeftWidth")) {
        if (!content.includes("DefaultContainersSize")) {
          content = `import { DefaultContainersSize } from "@/constants/layout";\n` + content;
        }
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf8");
        console.log("Updated container size references in: " + fullPath);
      }
    }
  }
}

scanAndUpdate(path.resolve("src"));
'

# 4. Recompile the project
if command -v npm >/dev/null 2>&1; then
  npm run compile
fi

echo "✅ refactor: Externalized container size defaults into 'DefaultContainersSize' constant in src/webview/constants/layout.ts."
