#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Launching all HTML Split tests..."

echo "=================================================="
echo "1️⃣ Running Standard Extraction Test..."
bash "${SCRIPT_DIR}/split-html-test.sh"

echo "=================================================="
echo "2️⃣ Running Rendering-Only Mode Test..."
bash "${SCRIPT_DIR}/split-html-rendering-test.sh"

echo "=================================================="
echo "🎉 All HTML Split tests completed successfully!"
