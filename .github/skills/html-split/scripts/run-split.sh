#!/usr/bin/env bash
set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: bash run-split.sh <inputFile> <outputDir> [--rendering-only]"
  exit 1
fi

# Convert relative paths to absolute paths before changing directory to script location
INPUT_FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
mkdir -p "$2"
OUTPUT_DIR="$(cd "$2" && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

shift 2

cleanup() {
  echo "🧹 Cleaning up temporary Node modules..."
  rm -rf "$SCRIPT_DIR/node_modules" "$SCRIPT_DIR/package.json" "$SCRIPT_DIR/package-lock.json"
}
trap cleanup EXIT

echo "📦 Installing isolated dependencies..."
cd "$SCRIPT_DIR"
npm init -y > /dev/null 2>&1
npm install jsdom --no-audit --no-fund > /dev/null 2>&1

echo "⚡ Executing HTML Split extraction..."
node split-html.js "$INPUT_FILE" "$OUTPUT_DIR" "$@"

echo "✅ HTML Split execution completed."
