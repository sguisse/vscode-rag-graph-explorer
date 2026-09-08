#!/usr/bin/env bash
set -e

TARGET_FILE="webview/src/services/api/vs-code-api.service.gen.ts"

if [ -f "$TARGET_FILE" ]; then
    python3 -c "
import sys

file_path = '$TARGET_FILE'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

has_options_import = any('RichNotificationOptions' in line for line in lines[:20])

if not has_options_import:
    import_statement = \"import type { RichNotificationOptions } from '@/shared/services/vscode/port-out/vscode-service.port';\n\"
    lines.insert(0, import_statement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
"
fi

echo "✅ fix(webview): Successfully imported RichNotificationOptions in vs-code-api.service.gen.ts"
