#!/bin/bash

# ==============================================================================
# Token Razor SDLC - Hotfix 5.16
# Fixes Base UI nativeButton warning on PopoverTrigger in WorkflowPopup.
# ==============================================================================

echo "🩹 Applying Hotfix 5.16..."

python3 - << 'EOF'
import os, re

for root, dirs, files in os.walk('webview/src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()

            if 'PopoverTrigger' in content:
                # Add nativeButton={false} to PopoverTrigger elements missing it
                new_content = re.sub(
                    r'<PopoverTrigger(?![^>]*nativeButton)',
                    r'<PopoverTrigger nativeButton={false}',
                    content
                )
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    print(f"Patched nativeButton={'{false}'} in {path}")

EOF

echo "✅ Hotfix 5.16 applied! Rebuilding..."
npm run build
