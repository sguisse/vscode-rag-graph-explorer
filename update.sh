#!/usr/bin/env bash
# Production-ready patch to transition the installation status folder name from install_outputs to install_reports.

# 1. Rename the existing tracking layout directory if present on disk
if [ -d ".graph-rag-explorer/target/install_outputs" ]; then
    mv ".graph-rag-explorer/target/install_outputs" ".graph-rag-explorer/target/install_reports"
fi

# 2. Automatically propagate structural path renames recursively across codebase artifacts
python3 -c "
import os

target_directories = ['scripts', 'scripts copy', 'src']
for directory in target_directories:
    if not os.path.exists(directory):
        continue
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.py', '.ts', '.tsx', '.json', '.js')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    if 'install_outputs' in content:
                        updated_content = content.replace('install_outputs', 'install_reports')
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(updated_content)
                except Exception:
                    pass
"

# 3. Rebuild the visual presentation bundle layouts securely
npm run package

echo "✅ refactor/core: Migrated all environmental asset check storage traces from install_outputs to install_reports!"
