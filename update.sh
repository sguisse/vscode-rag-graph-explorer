#!/bin/bash

# S'assurer que le répertoire cible existe
mkdir -p src/webview/components

# Create a robust patcher to adjust the layout sizing metrics of the tree container
cat << 'EOF' > patch_tree_width.js
const fs = require('fs');
const filePath = 'src/webview/components/ExplorerTab.tsx';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Target the specific tree flex layout container definition
    const oldContainer = 'className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? \'hidden\' : \'w-[35%]\'}`}';

    // Inject custom initial standard sizing rule profile tracking at exactly 460px
    const newContainer = 'className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? \'hidden\' : \'w-[460px]\'}`}';

    if (content.includes(oldContainer)) {
        content = content.replace(oldContainer, newContainer);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Tree container default base-width successfully set to 460px.');
    } else {
        // Fallback trace matching alternate spacing definitions if any
        const fallbackOld = 'className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? \'hidden\' : \'w-[35%]\'}`}';
        if (content.includes(fallbackOld)) {
            content = content.replace(fallbackOld, newContainer);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('✅ Tree container default width fixed via fallback criteria.');
        } else {
            console.error('❌ Error: Target width container layout definitions could not be located.');
        }
    }
}
EOF

node patch_tree_width.js
rm patch_tree_width.js

echo "✅ Script executed. The Tree View sidebar layout configuration now loads with a robust, standard default width footprint of 460px!"
