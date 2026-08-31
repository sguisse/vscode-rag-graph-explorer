#!/usr/bin/env bash
set -e

echo "Creating ambient TypeScript declarations for Cytoscape plugin modules..."

# Ensure types directory exists
mkdir -p webview/src/types

# Create declaration file for cytoscape-fcose and cytoscape-dagre
cat << 'EOF' > webview/src/types/cytoscape-modules.d.ts
declare module 'cytoscape-fcose';
declare module 'cytoscape-dagre';
EOF

echo "✅ fix: Added ambient module declarations for cytoscape-fcose and cytoscape-dagre to fix TS7016 compilation error!"
