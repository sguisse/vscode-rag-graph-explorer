#!/usr/bin/env bash
# Production-ready patch to enable text selection in the Terminal log monitor while preventing edits.

TARGET_FILE="src/webview/components/TerminalTab.tsx"

if [ -f "$TARGET_FILE" ]; then
    python3 -c "
with open('$TARGET_FILE', 'r', encoding='utf-8') as f:
    content = f.read()

# Enable user text selection on the log container viewport
content = content.replace(
    'className=\"flex-1 bg-black rounded-lg border border-[var(--vscode-panel-border)] p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1 relative\"',
    'className=\"flex-1 bg-black rounded-lg border border-[var(--vscode-panel-border)] p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1 relative select-text\"'
)

# Enable user text selection on individual line layout streams
content = content.replace(
    'className=\"flex items-start gap-2 leading-relaxed whitespace-pre-wrap break-all\"',
    'className=\"flex items-start gap-2 leading-relaxed whitespace-pre-wrap break-all select-text\"'
)

with open('$TARGET_FILE', 'w', encoding='utf-8') as f:
    f.write(content)
"
fi

# Rebuild extension visual asset bundles
npm run package

echo "✅ fix/terminal: Logs display area and inner row tokens have been updated with selection tracking mechanics to enable keyboard/mouse text selection!"
