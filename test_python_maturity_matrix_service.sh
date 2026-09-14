#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="${SCRIPT_DIR}/scripts/architecture/maturity-matrix/maturity_matrix.py"

echo "=========================================================="
echo "🧪 Testing IMaturityMatrixServicePort Services via Python"
echo "=========================================================="

echo ""
echo "1️⃣ Testing refreshAssessments() [action: refresh-assessments]..."
REFRESH_OUTPUT=$(PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}" python3 "${PYTHON_SCRIPT}" --action refresh-assessments)
echo "${REFRESH_OUTPUT}"

echo ""
echo "2️⃣ Testing getAssessmentsAvailable() [action: get-assessments-available]..."
AVAILABLE_OUTPUT=$(PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}" python3 "${PYTHON_SCRIPT}" --action get-assessments-available)
echo "${AVAILABLE_OUTPUT}"

LATEST_TS=$(echo "${AVAILABLE_OUTPUT}" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0] if data else '')")

if [ -z "${LATEST_TS}" ]; then
  echo "❌ Error: No datetimeExtract folder found in getAssessmentsAvailable output."
  exit 1
fi

echo ""
echo "3️⃣ Testing getLastAssessments() [action: get-last-assessments]..."
LAST_OUTPUT=$(PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}" python3 "${PYTHON_SCRIPT}" --action get-last-assessments)
echo "${LAST_OUTPUT}"

echo ""
echo "4️⃣ Testing getAssessmentsAt('${LATEST_TS}') [action: get-assessments-at]..."
AT_OUTPUT=$(PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}" python3 "${PYTHON_SCRIPT}" --action get-assessments-at --assessment-datetime "${LATEST_TS}")
echo "${AT_OUTPUT}"

echo ""
echo "=========================================================="
echo "✅ All IMaturityMatrixServicePort operations tested successfully!"
echo "=========================================================="
