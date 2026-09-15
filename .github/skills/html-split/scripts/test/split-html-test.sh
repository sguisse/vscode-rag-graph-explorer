#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_SPLIT_SH="$(cd "${SCRIPT_DIR}/.." && pwd)/run-split.sh"

INPUT_FILE="${SCRIPT_DIR}/sample.html"
OUTPUT_DIR="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)/sandbox/test/split"

echo "🧪 Running HTML split test via run-split.sh..."
bash "${RUN_SPLIT_SH}" "${INPUT_FILE}" "${OUTPUT_DIR}" "$@"

echo "✅ Test completed. Output saved in '${OUTPUT_DIR}'."
