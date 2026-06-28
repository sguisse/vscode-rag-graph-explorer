#!/usr/bin/env bash
set -euo pipefail

TARGET="scripts/copy-files-to-clipboard.py"

mkdir -p scripts

if [ ! -f "$TARGET" ]; then
  echo "error: $TARGET not found. Run this script from the workspace root." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required to apply this robust line-matching patch." >&2
  exit 1
fi

node <<'NODE'
const fs = require("fs");

const target = "scripts/copy-files-to-clipboard.py";
let text = fs.readFileSync(target, "utf8");
const original = text;
const newline = text.includes("\r\n") ? "\r\n" : "\n";
const nl = (value) => value.replace(/\n/g, newline);

if (!text.includes("def configureOutputEncoding():")) {
  const importNeedle = "import subprocess";
  if (!text.includes(importNeedle)) {
    throw new Error("Could not find the expected import block in " + target);
  }

  const encodingBlock = nl(`

def configureOutputEncoding():
    """Force UTF-8 output for Windows pipes and terminals."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


configureOutputEncoding()
`);
  text = text.replace(importNeedle, importNeedle + encodingBlock);
}

const successPattern = /print\(f"[^\r\n]*Successfully copied \{len\(file_paths\)\} file\(s\) to the OS clipboard\."\)/;
if (!successPattern.test(text)) {
  throw new Error("Could not find the clipboard success print statement in " + target);
}

text = text.replace(
  successPattern,
  'print(f"[SUCCESS] Successfully copied {len(file_paths)} file(s) to the OS clipboard.")'
);

if (text !== original) {
  fs.writeFileSync(target, text, "utf8");
  console.log("Patched " + target);
} else {
  console.log("No changes required in " + target);
}
NODE

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
elif command -v py >/dev/null 2>&1; then
  PYTHON_CMD=(py -3)
else
  echo "error: Python 3 is required to verify the clipboard script syntax." >&2
  exit 1
fi

"${PYTHON_CMD[@]}" -m py_compile "$TARGET"

"${PYTHON_CMD[@]}" - <<'PY'
from pathlib import Path

target = Path("scripts/copy-files-to-clipboard.py")
text = target.read_text(encoding="utf-8")

required = [
    "def configureOutputEncoding():",
    'stream.reconfigure(encoding="utf-8", errors="replace")',
    'print(f"[SUCCESS] Successfully copied {len(file_paths)} file(s) to the OS clipboard.")',
]
missing = [item for item in required if item not in text]

if missing:
    raise SystemExit("Clipboard patch verification failed: " + ", ".join(missing))

if 'print(f"✅ Successfully copied' in text:
    raise SystemExit("Clipboard patch verification failed: Unicode success marker remains in stdout.")

print("Clipboard patch verification passed.")
PY

if [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  npm run compile
fi

echo "fix(clipboard): ✅ Windows clipboard verification no longer fails when Python stdout uses a legacy charmap codec."