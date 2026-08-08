#!/usr/bin/env python3
"""
jqassistant_install.py

Initialise a project with the jQAssistant configuration files required by the
`rvng-jqassistant-analysis` skill.

What it does
------------
- Copies `.github/skills/rvng-jqassistant-analysis/templates/jqassistant-template.yml`

- Copies `.github/skills/rvng-jqassistant-analysis/templates/analysis-rules-template.xml`

- Copies `pom-template.xml` profile snippet
    → <project-root>/pom.xml
     (inserts the template profile with id "jqassistant" if not already present)

- Optionally: create a local Python virtual environment and install the
    requirements from
    `.github/skills/rvng-jqassistant-analysis/templates/requirements.txt`.
    This is useful to ensure the post-install verifier (`jqassistant_verify.py`)
    can run with all required Python packages.

- Runs the jqassistant_verify.py script as a post-install
    sanity check (executed inside the created virtualenv when available) and prints a summary.

Exit codes
----------
 0 — All files installed (or already present) and verifier passes.
 1 — Files installed but verifier reports warnings.
 2 — Installation or verifier failed.

Usage
-----
  python .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_install.py \\
        [--root PATH]           # project root (default: current working directory)
        [--project-name NAME]   # project name used for file/rule naming (default: root dir name)
        [--force]               # overwrite existing files
        [--skip-verify]         # skip post-install verification
        [--setup-python-env]    # create venv and install requirements from skill templates
        [--venv-dir PATH]       # virtualenv path relative to project root (default: scripts/.venv or $JQA_VENV_DIR)
"""

from __future__ import annotations

import argparse
import importlib
import importlib.util
import json
import os
import pathlib
import re
import subprocess
import sys
from typing import Any
from pathlib import Path
from jqassistant_verify import verify_installation, print_verification_results
from _common import add_mcp_server, define_project_name, load_skill_env_vars, read_template
from _common import copy_template as _copy_template, format_status as _format_status, add_profile, venv_install

from sub_modules import install_graph_rag

_env_vars = load_skill_env_vars(print_env_vars=False)
_SCRIPTS_DIR = Path(__file__).parent

# ---------------------------------------------------------------------------
# Shared venv helper — prefer package `_common.py_venv_install`, fall back
# to legacy module/file names for backwards compatibility.
# ---------------------------------------------------------------------------
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_REPO_ROOT = _SCRIPTS_DIR.parents[3]
SKILL_DIR = _SCRIPTS_DIR.parents[1]  # .github/skills/rvng-jqassistant-analysis
TEMPLATES_DIR = SKILL_DIR / "templates"
VERIFY_SCRIPT = _SCRIPTS_DIR / "jqassistant_verify.py"


# ---------------------------------------------------------------------------
# Installation orchestration logic
# ---------------------------------------------------------------------------
def install_jqassistant(project_name: str) -> str:
    print(f"\n" + "-" * 130 + "")
    print(f"📁 Project root   : {_REPO_ROOT}")
    print(f"🧾 Templates dir  : {TEMPLATES_DIR}")
    print(f"📦 Project name   : {project_name}")
    print(f"-" * 20 + "")

    print("🚀 Starting jqassistant standard installation...")

    # Run verification steps, and get json results if available, before making any changes.
    # This allows us to skip installation if the pre-checks already pass, and also ensures we have a clean baseline for comparison after installation.
    pre_check_result: dict[str, Any] = verify_installation()
    jqassistant_check_result = pre_check_result["root-check"]["🔍  jqassistant verification (nested)"]

    nb_errors = 0
    # 1) ----
    result = install_jqassistant_config_file(jqassistant_check_result["jqassistant-yml"])
    if result:
        nb_errors += 1

    # 2) ----
    result = install_jqassistant_rules_file(jqassistant_check_result["jqassistant_rules"], project_name)
    if result:
        nb_errors += 1

    # 3) ----
    result = install_pom_profile(jqassistant_check_result["pom_profile"])
    if result:
        nb_errors += 1

    # 4.1) ---- Install Python virtual environment for skill Scripts (if not already present)
    result = install_skill_python_venv(jqassistant_check_result["python_venv_skill"])
    if result:
        nb_errors += 1

    # ==========================================================================
    # GRAPH-RAG specific installation
    # ==========================================================================
    print("🚀 Starting GRAPH-RAG installation...")
    graph_rag_check_result = pre_check_result["root-check"]["🔍  graph-rag verifier results (nested)"]
    nb_errors += install_graph_rag(graph_rag_check_result)

    print("---")
    if nb_errors == 0:
        print("✅ jqassistant installation completed successfully with no errors.")
    else:
        print(f"⚠️  jqassistant installation completed with {nb_errors} errors.")

    return pre_check_result["root-check"]["_global_summary"]["ok"]


# ---------------------------------------------------------------------------
def install_jqassistant_config_file(check_result: dict[str, Any]) -> bool:
    had_errors = False
    expected_path = check_result.get("details", {}).get("path")
    template_path = check_result.get("details", {}).get("template")

    if check_result.get("ok"):
        print(f"  ⏭️  .jqassistant.yml already exists at {expected_path}, skipping copy.")
    else:
        status, msg = _copy_template(Path(template_path), Path(expected_path), _env_vars, False)
        print(f"{_format_status(status)} {expected_path} — {msg}")
        if status == "ERROR":
            had_errors = True

    return had_errors


# ---------------------------------------------------------------------------
def install_jqassistant_rules_file(check_result: dict[str, Any], project_name: str) -> bool:
    had_errors = False
    expected_path = check_result.get("details", {}).get("path")
    template_path = check_result.get("details", {}).get("template")

    if check_result.get("ok"):
        print(f"  ⏭️  Rules file already exists at {expected_path}, skipping copy.")
    else:
        # --- First Manage directory creation if needed ---
        rules_dir = Path(expected_path)
        if not rules_dir.exists():
            try:
                rules_dir.mkdir(parents=True, exist_ok=True)
                print(f"{_format_status('OK')} Created directory: {rules_dir}")
            except Exception as exc:
                print(f"{_format_status('ERROR')} Could not create {rules_dir}: {exc}")
                had_errors = True
        else:
            print(f"{_format_status('SKIP')} Directory already exists: {rules_dir}")

        # --- Then copy the template file ---
        rules_filename = f"{project_name}-rules.xml"
        dst_xml = Path(expected_path) / rules_filename
        status, msg = _copy_template(Path(template_path), dst_xml, _env_vars, True)
        print(f"{_format_status(status)} {dst_xml.name} — {msg}")
        if status == "ERROR":
            had_errors = True
        else:
            print(f"   ⚙️  --> Customize rules for your needs !")

    return had_errors


# ---------------------------------------------------------------------------
def install_pom_profile(check_result: dict[str, Any]) -> bool:
    had_errors = False
    expected_path = check_result.get("details", {}).get("path")
    template_path = check_result.get("details", {}).get("template")
    profile_id = check_result.get("details", {}).get("profile_id")

    if check_result.get("ok"):
        print(f"  ⏭️  Maven profile '{profile_id}' already exists at {expected_path}, skipping copy.")
    else:
        status, msg = add_profile(Path(expected_path), profile_id, template_path=Path(template_path))
        print(f"{_format_status(status)} pom.xml profile — {msg}")
        if status == "ERROR":
            had_errors = True

    return had_errors


def install_skill_python_venv(check_result: dict[str, Any]) -> bool:
    had_errors = False
    expected_venv_path = check_result.get("details", {}).get("path")

    if check_result.get("ok"):
        print(f"  ⏭️  Python virtual environment already exists at {expected_venv_path}, skipping setup.")
    else:
        status, msg = venv_install(Path(expected_venv_path).parent)
        print(f"{_format_status(status)} Python virtual environment — {msg}")
        if status == "ERROR":
            had_errors = True

    return had_errors


# ============================================================================
# Main entry point to use as a standalone script.
# ============================================================================
def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install jQAssistant configuration files from skill templates.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--root", default=None, help="Project root directory (default: cwd).")
    parser.add_argument(
        "--project-name",
        default=None,
        help="Project name used for rule file naming and placeholder substitution (default: derived from root name).",
    )

    return parser.parse_args()


# ---
def main() -> int:
    # --- Manage project name and ensure it's available in env vars for template substitution ---
    args = _parse_args()
    project_name = args.project_name
    if not project_name:
        project_name = _env_vars.get("PROJECT_NAME") or define_project_name(_REPO_ROOT)
    _env_vars["PROJECT_NAME"] = project_name  # ensure it's available for template substitution

    global_result = install_jqassistant(project_name)

    if global_result == "🎯 true":
        return 0
    elif global_result == "⚠️ false":
        return 1
    else:
        return 2


if __name__ == "__main__":
    sys.exit(main())
