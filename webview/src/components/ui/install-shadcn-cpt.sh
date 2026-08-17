#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Find the repository/project root directory relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBVIEW_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

echo "📂 Navigating to webview root directory: ${WEBVIEW_DIR}"
cd "${WEBVIEW_DIR}"

# Ensure package.json exists in this folder before running npx
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found in ${WEBVIEW_DIR}."
  exit 1
fi

echo "🚀 Installing Shadcn components..."

# Install basic form components
npx shadcn@latest add @reui/rating -y

echo "✅ Installation completed successfully!"
