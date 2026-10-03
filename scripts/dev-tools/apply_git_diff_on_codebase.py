#!/usr/bin/env python3
"""
Applies a YAML "generation manifest" (file create/update/delete list) to the workspace.

Features:
- Full AST syntax validation via TypeScript Compiler API.
- Double-check regex gate for JSX corruption signatures (e.g. `prop="{val}"`).
- Workspace rollback on build or syntax failure.
- Smart Workspace Build Execution: runs `npm run build` and `mvn compile` (if files in `src/main/` are modified).

Usage: python dev-tools/apply_git_diff_on_codebase.py path/to/manifest.yaml
"""

import os
import sys
import re
import json
import shutil
import subprocess
import yaml

# Resolve core module import paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

possible_scripts = SCRIPT_DIR
while possible_scripts and os.path.basename(possible_scripts) != 'scripts':
    parent = os.path.dirname(possible_scripts)
    if parent == possible_scripts:
        break
    possible_scripts = parent

if os.path.basename(possible_scripts) == 'scripts':
    SCRIPTS_ROOT = possible_scripts
else:
    SCRIPTS_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

if SCRIPTS_ROOT not in sys.path:
    sys.path.insert(0, SCRIPTS_ROOT)

from core.utils import info, success, warn, error, debug, execute_tracked_command, normalize_path
from core.VsCodeSettings_gen import vsCodeSettings


def get_workspace_root() -> str:
    ws_setting = getattr(vsCodeSettings, "workspaceRoot", "")
    if ws_setting and ws_setting.strip():
        return normalize_path(ws_setting)
    if os.path.basename(SCRIPTS_ROOT) == "scripts":
        return normalize_path(os.path.abspath(os.path.join(SCRIPTS_ROOT, "..")))
    return normalize_path(os.getcwd())


WORKSPACE_ROOT = get_workspace_root()
VALID_ACTIONS = {'create', 'update', 'delete'}
SYNTAX_CHECKED_EXTENSIONS = {'ts', 'tsx', 'js', 'jsx'}

# Pattern for common LLM JSX corruption signatures
JSX_CORRUPTION_REGEX = re.compile(r'="\{|\}"|=>"\s*>')


def fail(message: str, component: str = "ApplyGitDiff"):
    error(f"❌ {message}", component=component)
    sys.exit(1)


def is_strictly_inside_workspace(target_path: str, workspace_root: str) -> bool:
    norm_target = normalize_path(target_path)
    norm_ws = normalize_path(workspace_root)
    if norm_target == norm_ws:
        return False
    return norm_target.startswith(norm_ws + '/')


def handle_wait_pause(build_name: str, component: str = "ApplyGitDiff"):
    info(f"⏸️ Pause requested via --wait. Press Enter to run {build_name}...", component=component)
    try:
        if os.isatty(sys.stdin.fileno()):
            input()
        else:
            with open('/dev/tty', 'r') as tty:
                tty.readline()
    except Exception:
        pass


def resolve_target_path(entry: dict, index: int) -> str:
    filename = entry.get('filename')
    extension = entry.get('extension')
    entry_path = entry.get('path')
    action = entry.get('action')
    content = entry.get('content')

    if not filename or not isinstance(filename, str):
        fail(f"Entry #{index}: missing 'filename'.")
    if not extension or not isinstance(extension, str):
        fail(f"Entry #{index}: missing 'extension'.")
    if not entry_path or not isinstance(entry_path, str):
        fail(f"Entry #{index}: missing 'path'.")
    if action not in VALID_ACTIONS:
        fail(f"Entry #{index}: 'action' must be one of create|update|delete.")
    if action != 'delete' and not isinstance(content, str):
        fail(f"Entry #{index} ({filename}.{extension}): 'content' is required for action '{action}'.")

    ext_clean = extension.lstrip('.')
    target_dir = os.path.abspath(os.path.join(WORKSPACE_ROOT, entry_path))
    target_file = normalize_path(os.path.join(target_dir, f"{filename}.{ext_clean}"))

    relative = os.path.relpath(target_file, WORKSPACE_ROOT)
    if relative.startswith('..') or os.path.isabs(relative) or not is_strictly_inside_workspace(target_file, WORKSPACE_ROOT):
        fail(f"Entry #{index} ({filename}.{extension}): path escapes or lies outside workspace root '{WORKSPACE_ROOT}'.")

    return target_file


def check_syntax(entry: dict, target_file: str) -> list:
    errors = []
    content = entry.get('content', '')

    lines = content.split('\n')
    for idx, line_text in enumerate(lines):
        if JSX_CORRUPTION_REGEX.search(line_text):
            errors.append(f'line {idx + 1}: JSX corruption signature detected (quoted brace or truncated callback): "{line_text.strip()}"')

    node_script = """
const ts = require('typescript');
const content = process.argv[1];
const fileName = process.argv[2];
const isJsx = fileName.endsWith('.tsx') || fileName.endsWith('.jsx');
try {
    const result = ts.transpileModule(content, {
        compilerOptions: {
            target: ts.ScriptTarget.Latest,
            module: ts.ModuleKind.ESNext,
            jsx: isJsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
        },
        reportDiagnostics: true,
        fileName: fileName,
    });
    const errors = [];
    (result.diagnostics || []).forEach((d) => {
        const message = ts.flattenDiagnosticMessageText(d.messageText, '\\n');
        if (d.file && d.start !== undefined) {
            const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
            errors.push(`line ${line + 1}, col ${character + 1}: ${message}`);
        } else {
            errors.push(message);
        }
    });
    console.log(JSON.stringify(errors));
} catch (e) {
    console.log(JSON.stringify([e.message]));
}
"""
    try:
        res = subprocess.run(
            ['node', '-e', node_script, content, target_file],
            capture_output=True,
            text=True,
            cwd=WORKSPACE_ROOT,
            check=False
        )
        if res.returncode == 0 and res.stdout.strip():
            ts_errors = json.loads(res.stdout.strip())
            errors.extend(ts_errors)
    except Exception as e:
        debug(f"TypeScript compiler check fallback: {e}", component="ApplyGitDiff")

    return errors


def main():
    cli_args = sys.argv[1:]

    skip_check_syntax = any(arg in ('--skipCheckSyntax', 'skipCheckSyntax') for arg in cli_args)
    skip_node_build = any(arg in ('--skipNodeBuild', 'skipNodeBuild', '—skipNodeBuild') for arg in cli_args)
    skip_java_build = any(arg in ('--skipJavaBuild', 'skipJavaBuild', '—skipJavaBuild') for arg in cli_args)
    wait_flag = any('wait' in arg.lower() for arg in cli_args)

    flag_tokens = {
        '--skipCheckSyntax', 'skipCheckSyntax',
        '--skipNodeBuild', 'skipNodeBuild', '—skipNodeBuild',
        '--skipJavaBuild', 'skipJavaBuild', '—skipJavaBuild',
        '--wait', 'wait', '—wait'
    }
    manifest_arg = next((arg for arg in cli_args if not arg.startswith('--') and not arg.startswith('—') and arg not in flag_tokens), None)

    if not manifest_arg:
        fail("Usage: python dev-tools/apply_git_diff_on_codebase.py path/to/manifest.yaml [--skipCheckSyntax] [--skipNodeBuild] [--skipJavaBuild] [--wait]")

    manifest_path = os.path.abspath(os.path.join(WORKSPACE_ROOT, manifest_arg)) if not os.path.isabs(manifest_arg) else manifest_arg
    if not os.path.exists(manifest_path):
        fail(f"Manifest not found: {manifest_path}")

    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = yaml.safe_load(f)
    except Exception as err:
        fail(f"Failed to parse YAML manifest: {err}")

    files = manifest.get('generation', {}).get('files') if isinstance(manifest, dict) else None
    if not isinstance(files, list) or len(files) == 0:
        fail("Manifest must define 'generation.files' as a non-empty array.")

    info(f"🚀 Validating {len(files)} manifest entr{'ies' if len(files) != 1 else 'y'}...", component="ApplyGitDiff")

    resolved_entries = []
    validation_errors = []
    has_java_files = False

    for index, entry in enumerate(files):
        target_file = resolve_target_path(entry, index)
        resolved_entries.append({'entry': entry, 'target_file': target_file})

        rel_target = os.path.relpath(target_file, WORKSPACE_ROOT).replace('\\', '/')
        if 'src/main/' in rel_target or rel_target.startswith('src/main/'):
            has_java_files = True

        if entry.get('action') == 'delete':
            continue

        ext = str(entry.get('extension') or '').lstrip('.')
        if ext in SYNTAX_CHECKED_EXTENSIONS:
            errors = check_syntax(entry, target_file)
            if errors:
                validation_errors.append({'target_file': target_file, 'errors': errors})

    if validation_errors:
        error(f"❌ Syntax validation failed for {len(validation_errors)} file(s). Zero disk writes performed.", component="ApplyGitDiff")
        for item in validation_errors:
            tf = item['target_file']
            errs = item['errors']
            rel_p = os.path.relpath(tf, WORKSPACE_ROOT)
            print(f"\n  {rel_p}", file=sys.stderr)
            for e in errs:
                print(f"    - {e}", file=sys.stderr)
        sys.exit(1)

    info("✅ All entries passed syntax validation. Creating backups and applying to disk...", component="ApplyGitDiff")

    backups = {}
    for item in resolved_entries:
        tf = item['target_file']
        if os.path.exists(tf):
            with open(tf, 'rb') as bf:
                backups[tf] = bf.read()
        else:
            backups[tf] = None

    try:
        for item in resolved_entries:
            entry = item['entry']
            tf = item['target_file']
            relative_display = os.path.relpath(tf, WORKSPACE_ROOT)

            if entry.get('action') == 'delete':
                if not is_strictly_inside_workspace(tf, WORKSPACE_ROOT):
                    fail(f"Suppression forbidden: Target path '{tf}' is outside workspace root '{WORKSPACE_ROOT}'.")
                if os.path.exists(tf):
                    os.remove(tf)
                    info(f"🗑️ Removed existing file: '{relative_display}'", component="ApplyGitDiff")
                continue

            os.makedirs(os.path.dirname(tf), exist_ok=True)
            icon = "➕ Creating new file" if entry.get('action') == 'create' else "✏️ Modifying existing file"
            info(f"{icon}: '{relative_display}'", component="ApplyGitDiff")
            with open(tf, 'w', encoding='utf-8') as wf:
                wf.write(entry.get('content', ''))

        if skip_node_build:
            warn("⚠️ Node build verification has been skipped.", component="ApplyGitDiff")
        else:
            if wait_flag:
                handle_wait_pause("Node build (npm run build)", component="ApplyGitDiff")
            info("🧪 Running workspace Node build verification...", component="ApplyGitDiff")
            ret = execute_tracked_command(['npm', 'run', 'build'], tool_name="npm_build", cwd=WORKSPACE_ROOT)
            if ret != 0:
                raise RuntimeError("Node build command failed")

        if has_java_files:
            if skip_java_build:
                warn("⚠️ Java build verification has been skipped (--skipJavaBuild).", component="ApplyGitDiff")
            else:
                if wait_flag:
                    handle_wait_pause("Maven build (mvn compile)", component="ApplyGitDiff")
                info("🧪 Running workspace Java build verification (mvn compile)...", component="ApplyGitDiff")
                ret = execute_tracked_command(['mvn', 'compile'], tool_name="mvn_compile", cwd=WORKSPACE_ROOT)
                if ret != 0:
                    raise RuntimeError("Maven compile command failed")

    except Exception as err:
        error(f"\n❌ Workspace build verification failed! ({err}) Rolling back disk changes...", component="ApplyGitDiff")
        for file_path, content in backups.items():
            if content is None:
                if os.path.exists(file_path):
                    if not is_strictly_inside_workspace(file_path, WORKSPACE_ROOT):
                        error(f"Suppression forbidden during rollback: Target path '{file_path}' is outside workspace root '{WORKSPACE_ROOT}'. Skipping.", component="ApplyGitDiff")
                        continue
                    os.remove(file_path)
            else:
                with open(file_path, 'wb') as wf:
                    wf.write(content)
        fail("Rollback complete. Workspace restored to clean state.")

    commit_message = manifest.get('commit', {}).get('message') if isinstance(manifest, dict) else None
    if commit_message:
        print(f"\n{commit_message}")


if __name__ == '__main__':
    main()
