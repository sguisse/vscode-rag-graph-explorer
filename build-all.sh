#!/usr/bin/env bash
set -e

# Check for --clean or -c parameter
if [[ "$1" == "--clean" ]] || [[ "$1" == "-c" ]]; then
    rm -rf dist-backend
    rm -rf dist-webview
    rm -rf node_modules webview/node_modules
    rm -rf exported-files
fi

npm install
npm run build

echo "✅ Build completed successfully."
echo "You can now run the extension in VS Code in DEBUG mode : Cmd + F5 (Mac) or Ctrl + F5 (Windows/Linux)."
echo "Open the project you want analyze in the new VS Code instance"
echo "In the Explorer view, right click on a file and select 'Token Razor --> 🪒 Open UI' to start the analysis in background and display the Tool."
echo "Open the debug output console named 'token-razor' to see the logs and progress of the analysis."
