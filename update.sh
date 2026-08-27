#!/usr/bin/env bash
set -e

# Create necessary directories
mkdir -p webview/src/_layout
mkdir -p webview/src/_layout/hooks

# 1. Create index.ts for webview/src/_layout
cat << 'EOF' > webview/src/_layout/index.ts
export * from './AppLayout';
export * from './ApplicationTitle';
export * from './ContainerPanelHeader';
export * from './Footer';
export * from './Header';
export * from './SidebarLeft';
export * from './SidebarRight';
export * from './WorkspaceLayout';
export * from './types';
EOF

# 2. Create index.ts for webview/src/_layout/hooks
cat << 'EOF' > webview/src/_layout/hooks/index.ts
export * from './use-layout-state';
EOF

echo "✅ feat: Added index.ts barrel export files to all _layout folders!"
npm run compile
