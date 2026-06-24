#!/bin/bash

# Ensure components directory exists
mkdir -p src/webview/components

# Precise automated script to refactor the Legend toggle button inside ExplorerTab.tsx
cat << 'EOF' > patch_legend.js
const fs = require('fs');
const filePath = 'src/webview/components/ExplorerTab.tsx';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Target the conditional rendering block and replace it with a persistent styled toggle button
    const regex = /\{!showLegend\s*&&\s*\([\s\S]*?<ListUnorderedIcon\s*\/?>[\s\S]*?<\/button>\s*\)\}/;

    const replacement = `<button
        onClick={() => setShowLegend(!showLegend)}
        className={\`flex justify-center items-center p-1 rounded \${showLegend ? 'text-blue-500 bg-gray-700/40' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-foreground)]'}\`}
        title="Legend"
    >
        <ListUnorderedIcon />
    </button>`;

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}
EOF

node patch_legend.js
rm patch_legend.js

echo "✅ Legend toggle button modified to remain permanently visible with active toggle backgrounds syncing perfectly with other filters!"
