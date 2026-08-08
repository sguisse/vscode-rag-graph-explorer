#!/usr/bin/env python3
"""
jqassistant_verify.py

Simplified jqassistant verifier that performs only file/folder checks and
optionally invokes `graph_rag_verify.py` to merge its results. Final logging
is delegated to `util-verify-install.py::print_verification_results` when
available; otherwise the script emits raw JSON at the end.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import sys
import importlib.util
from typing import Any
from _common import check_file_contains, load_skill_env_vars
from _common import (
    check_file_exists,
    check_folder_exists,
    check_folder_has_files,
    print_verification_results,
    check_profile_exists,
    add_profile,
    remove_profile,
    check_icon as _check_icon,
    check_result as _check_result,
)
from sub_modules import verify_installation as graph_rag_verify_installation

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
_SCRIPTS_DIR = pathlib.Path(__file__).parent
_TEMPLATES_DIR = _SCRIPTS_DIR.parent / "templates"
_SKILL_VENV_DIR = _SCRIPTS_DIR / ".venv"

_GRAPH_RAG_DIR = _SCRIPTS_DIR.parent / "tool-graph-rag" / "git-clone"
_GRAPH_RAG_VENV_DIR = _GRAPH_RAG_DIR / ".venv"

TEMPLATE_JQASSISTANT_YML = _TEMPLATES_DIR / ".jqassistant-template.yml"
TEMPLATE_ANALYSIS_RULES_XML = _TEMPLATES_DIR / "analysis-rules-template.xml"
TEMPLATE_POM_XML = _TEMPLATES_DIR / "pom-template.xml"
TEMPLATE_MCP_SERVER_JSON = _TEMPLATES_DIR / "mcp-server-template.json"

_VSCODE_MCP_JSON = _REPO_ROOT / ".vscode" / "mcp.json"

# Load of skill environment variables (keeps behavior consistent when used from skill)
load_skill_env_vars(print_env_vars=False)


def verify_installation() -> dict[str, Any]:
    """
    Perform verification checks for jqassistant installation.

    Returns:
        A dictionary containing the verification results.
    """
    # Build jqassistant group checks
    jq_group: dict[str, Any] = {}

    # -------
    # check .jqassistant.yml is present in the expected location
    cfg = _SCRIPTS_DIR / "config" / ".jqassistant.yml"
    check_result = check_file_exists(cfg, True)
    check_result["details"]["template"] = str(TEMPLATE_JQASSISTANT_YML)
    jq_group["jqassistant-yml"] = check_result

    # -------
    # jqassistant rules folder: search a few common candidate locations
    rules_candidates = [
        _SCRIPTS_DIR / "config" / "jqassistant-rules",
    ]
    check_result = check_folder_has_files(rules_candidates[0], "*.xml", True)
    check_result["details"]["template"] = str(TEMPLATE_ANALYSIS_RULES_XML)
    jq_group["jqassistant_rules"] = check_result

    # -------
    # Project pom.xml (optional check)
    pom_dir = _REPO_ROOT / "pom.xml"
    profile_id = "jqassistant"
    is_profile_exists = check_profile_exists(pom_dir, profile_id)
    message = (
        f"{_check_icon(is_profile_exists)}  OK: Profile '{profile_id}' found in pom.xml"
        if is_profile_exists
        else f"{_check_icon(is_profile_exists)}  ERROR: Profile '{profile_id}' not found in pom.xml"
    )
    check_result = _check_result(is_profile_exists, message, {"path": str(pom_dir)})
    check_result["details"]["template"] = str(TEMPLATE_POM_XML)
    check_result["details"]["profile_id"] = profile_id
    jq_group["pom_profile"] = check_result

    # -------
    # Python virtual environment detection
    python_venv_skill_dir = _SKILL_VENV_DIR
    jq_group["python_venv_skill"] = check_folder_exists(python_venv_skill_dir, True)

    # ------------------------
    # Compute jq group summary
    jq_keys = [k for k in jq_group.keys()]
    jq_passed = sum(1 for k in jq_keys if isinstance(jq_group[k], dict) and jq_group[k].get("ok"))
    jq_total = len(jq_keys)
    jq_group["_summary"] = {
        "ok": "🎯 true" if jq_passed == jq_total else "⚠️ false",
        "passed": jq_passed,
        "total": jq_total,
    }

    # -----------------------
    # Run graph-rag verifier and capture its results as the graph group
    gr_group: dict[str, Any]
    gr_group = graph_rag_verify_installation()

    # Compute root summary merging both groups
    gr_passed = 0
    gr_total = 0
    if isinstance(gr_group, dict) and "_summary" in gr_group and isinstance(gr_group["_summary"], dict):
        gr_passed = int(gr_group["_summary"].get("passed", 0))
        gr_total = int(gr_group["_summary"].get("total", 0))
    else:
        # Try to interpret gr_group as a flat set of checks
        if isinstance(gr_group, dict):
            gr_total = len([k for k in gr_group.keys() if k != "_summary"])
            gr_passed = sum(1 for v in gr_group.values() if isinstance(v, dict) and v.get("ok"))

    root_total = jq_total + gr_total
    root_passed = jq_passed + gr_passed
    root_summary = {
        "ok": "🎯 true" if root_passed == root_total else "⚠️ false",
        "passed": root_passed,
        "total": root_total,
    }

    # Build final structured results with 'root-check' and the two requested groups
    final_results = {
        "root-check": {
            "🔍  jqassistant verification (nested)": jq_group,
            "🔍  graph-rag verifier results (nested)": gr_group,
            "_global_summary": root_summary,
        }
    }

    return final_results


def _main() -> int:

    final_results = verify_installation()

    # Delegate printing to util (mapped function) if available
    print_verification_results(final_results, title="jqassistant verification")

    root_summary = final_results["root-check"]["_global_summary"]
    return 0 if root_summary["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(_main())
