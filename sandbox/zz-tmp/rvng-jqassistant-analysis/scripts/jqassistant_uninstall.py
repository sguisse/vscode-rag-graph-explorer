#!/usr/bin/env python3
"""
jqassistant_uninstall.py

Inverse of ``jqassistant_install.py``.

Removes every artefact created by the jQAssistant installer when it is still
present in the repository:

  Standard jQAssistant artefacts
  ────────────────────────────────
  1. ``.jqassistant.yml``
  2. ``jqassistant/rules/<project-name>-rules.xml`` (and directory if empty)
  3. Maven profile with id ``jqassistant`` from ``pom.xml``
  4. Skill-scripts Python virtual environment (``.venv``)

  Graph-RAG specific artefacts
  ────────────────────────────────
  5. Graph-RAG Python virtual environment (inside ``tool-graph-rag/git-clone/.venv``)
  6. Graph-RAG sentence-transformer model directory (``tool-graph-rag/git-clone/models/``)
  7. ``jqassistant-graph-rag`` entry in ``.vscode/mcp.json``

Exit codes
----------
 0 — All found artefacts removed successfully (or nothing to remove).
 1 — One or more removals failed.
 2 — Fatal error (e.g. project root not found).

Usage
-----
  python .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_uninstall.py \\
        [--root PATH]           # project root (default: current working directory)
        [--project-name NAME]   # project name used for rule file naming
        [--dry-run]             # preview what would be removed without touching files
        [--skip-graph-rag]      # skip graph-RAG specific uninstall steps
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path
from typing import Any

from jqassistant_verify import verify_installation, print_verification_results
from _common import (
    define_project_name,
    load_skill_env_vars,
    remove_profile,
    remove_mcp_server,
    format_status as _format_status,
)
from sub_modules import uninstall_graph_rag

_env_vars = load_skill_env_vars(print_env_vars=False)
_SCRIPTS_DIR = Path(__file__).parent

# ---------------------------------------------------------------------------
# Paths (mirror jqassistant_install.py)
# ---------------------------------------------------------------------------
_REPO_ROOT = _SCRIPTS_DIR.parents[3]


# ---------------------------------------------------------------------------
# Main uninstallation orchestrator  (mirrors install_jqassistant())
# ---------------------------------------------------------------------------


def uninstall_jqassistant(project_name: str, dry_run: bool = False, skip_graph_rag: bool = False) -> int:
    """Remove all jQAssistant (and optionally graph-RAG) artefacts.

    Returns the total number of failed removals (0 = full success).
    """
    print(f"\n" + "-" * 130)
    print(f"📁 Project root   : {_REPO_ROOT}")
    print(f"📦 Project name   : {project_name}")
    if dry_run:
        print("🛈  DRY-RUN mode — no files will be modified.")
    print("-" * 20)

    print("🚀 Starting jqassistant uninstall …")

    # Snapshot the current installation state so every helper receives
    # pre-computed paths (same pattern as jqassistant_install.py).
    pre_check_result: dict[str, Any] = verify_installation()
    jqa_results = pre_check_result["root-check"]["🔍  jqassistant verification (nested)"]

    nb_errors = 0

    # 1) .jqassistant.yml
    result = uninstall_jqassistant_config_file(jqa_results["jqassistant-yml"], dry_run)
    if result:
        nb_errors += 1

    # 2) jqassistant rules XML (and parent dirs when empty)
    result = uninstall_jqassistant_rules_file(jqa_results["jqassistant_rules"], project_name, dry_run)
    if result:
        nb_errors += 1

    # 3) Maven profile in pom.xml
    result = uninstall_pom_profile(jqa_results["pom_profile"], dry_run)
    if result:
        nb_errors += 1

    # 4) Skill-scripts Python virtual environment
    result = uninstall_skill_python_venv(jqa_results["python_venv_skill"], dry_run)
    if result:
        nb_errors += 1

    # ===========================================================================
    # GRAPH-RAG specific uninstall steps
    # ===========================================================================
    if not skip_graph_rag:
        print("🚀 Starting graph-RAG uninstall …")
        gr_results = pre_check_result["root-check"]["🔍  graph-rag verifier results (nested)"]
        graph_rag_errors = uninstall_graph_rag(gr_results, dry_run=dry_run)
        nb_errors += graph_rag_errors
    else:
        print("⏭️  Skipping graph-RAG uninstall (--skip-graph-rag).")

    print("---")
    if dry_run:
        print("💦  Dry-run complete — no files were deleted.")
    elif nb_errors == 0:
        print("✅  jqassistant uninstall completed successfully with no errors.")
    else:
        print(f"⚠️  jqassistant uninstall completed with {nb_errors} error(s).")

    return nb_errors


# ---------------------------------------------------------------------------
# Individual uninstall helpers  (mirrors each install_* function)
# ---------------------------------------------------------------------------


def uninstall_jqassistant_config_file(check_result: dict[str, Any], dry_run: bool = False) -> bool:
    """Remove ``.jqassistant.yml``.  Returns True on error."""
    had_errors = False
    expected_path = check_result.get("details", {}).get("path")

    if not check_result.get("ok"):
        print(f"  ⏭️  .jqassistant.yml not found at {expected_path}, skipping removal.")
        return had_errors

    target = Path(expected_path)
    print(f"  🗑️  Removing: {target}")
    if not dry_run:
        try:
            target.unlink()
            print(f"{_format_status('OK')} {target.name} — removed.")
        except Exception as exc:
            print(f"{_format_status('ERROR')} {target.name} — {exc}")
            had_errors = True
    else:
        print(f"{_format_status('OK')} [dry-run] Would remove: {target}")

    return had_errors


def uninstall_jqassistant_rules_file(
    check_result: dict[str, Any],
    project_name: str,
    dry_run: bool = False,
) -> bool:
    """Remove ``<rules-dir>/<project>-rules.xml`` and the dir when empty.

    Returns True on error.
    """
    had_errors = False
    expected_path = check_result.get("details", {}).get("path")

    if not check_result.get("ok"):
        print(f"  ⏭️  Rules directory has no XML files at {expected_path}, skipping removal.")
        return had_errors

    rules_dir = Path(expected_path)
    rules_file = rules_dir / f"{project_name}-rules.xml"

    # Remove the specific rules XML
    if rules_file.exists():
        print(f"  🗑️  Removing: {rules_file}")
        if not dry_run:
            try:
                rules_file.unlink()
                print(f"{_format_status('OK')} {rules_file.name} — removed.")
            except Exception as exc:
                print(f"{_format_status('ERROR')} {rules_file.name} — {exc}")
                had_errors = True
        else:
            print(f"{_format_status('OK')} [dry-run] Would remove: {rules_file}")
    else:
        print(f"  ⏭️  Rules file not found: {rules_file}, skipping.")

    # Remove rules dir if now empty
    # _remove_dir_if_empty(rules_dir, dry_run)

    # Remove parent jqassistant/ dir if now empty
    # jqa_dir = rules_dir.parent
    # _remove_dir_if_empty(jqa_dir, dry_run)

    return had_errors


def uninstall_pom_profile(check_result: dict[str, Any], dry_run: bool = False) -> bool:
    """Strip the jqassistant Maven profile from ``pom.xml``.  Returns True on error."""
    had_errors = False
    expected_path = check_result.get("details", {}).get("path")
    profile_id = check_result.get("details", {}).get("profile_id", "jqassistant")

    if not check_result.get("ok"):
        print(f"  ⏭️  Maven profile '{profile_id}' not found in {expected_path}, skipping removal.")
        return had_errors

    pom = Path(expected_path)
    print(f"  🗑️  Removing Maven profile: {profile_id} from {pom}")
    if not dry_run:
        removed = remove_profile(pom, profile_id, dry_run=False)
        if removed:
            print(f"{_format_status('OK')} pom.xml profile '{profile_id}' — removed.")
        else:
            print(f"{_format_status('ERROR')} pom.xml profile '{profile_id}' — removal failed.")
            had_errors = True
    else:
        print(f"{_format_status('OK')} [dry-run] Would remove profile '{profile_id}' from {pom}")

    return had_errors


def uninstall_skill_python_venv(check_result: dict[str, Any], dry_run: bool = False) -> bool:
    """Remove the skill-scripts Python virtual environment.  Returns True on error."""
    had_errors = False
    expected_venv_path = check_result.get("details", {}).get("path")

    if not check_result.get("ok"):
        print(f"  ⏭️  Skill Python venv not found at {expected_venv_path}, skipping removal.")
        return had_errors

    venv = Path(expected_venv_path)
    print(f"  🗑️  Removing skill Python venv: {venv}")
    if not dry_run:
        try:
            shutil.rmtree(venv)
            print(f"{_format_status('OK')} Python virtual environment — removed.")
        except Exception as exc:
            print(f"{_format_status('ERROR')} Python virtual environment — {exc}")
            had_errors = True
    else:
        print(f"{_format_status('OK')} [dry-run] Would remove: {venv}")

    return had_errors


# ---------------------------------------------------------------------------
# Internal utilities
# ---------------------------------------------------------------------------


def _remove_dir_if_empty(path: Path, dry_run: bool) -> None:
    if not path.exists():
        return
    try:
        contents = list(path.iterdir())
    except Exception:
        return
    if contents:
        print(f"  ⏭️  Directory not empty, keeping: {path}")
        return
    print(f"  🗑️  Removing empty directory: {path}")
    if not dry_run:
        try:
            path.rmdir()
        except Exception as exc:
            print(f"  ⚠️  Could not remove {path}: {exc}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove jQAssistant configuration artefacts installed by jqassistant_install.py.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--root", default=None, help="Project root directory (default: cwd).")
    parser.add_argument(
        "--project-name",
        default=None,
        help="Project name used for rule file naming (default: derived from root dir name).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be removed without making any changes.",
    )
    parser.add_argument(
        "--skip-graph-rag",
        action="store_true",
        help="Skip graph-RAG specific uninstall steps.",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()

    project_name = args.project_name
    if not project_name:
        project_name = _env_vars.get("PROJECT_NAME") or define_project_name(_REPO_ROOT)
    _env_vars["PROJECT_NAME"] = project_name

    nb_errors = uninstall_jqassistant(
        project_name,
        dry_run=args.dry_run,
        skip_graph_rag=args.skip_graph_rag,
    )

    return 0 if nb_errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
