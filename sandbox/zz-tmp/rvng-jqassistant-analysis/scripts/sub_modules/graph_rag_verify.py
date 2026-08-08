#!/usr/bin/env python3
"""
graph_rag_verify.py

"""

from __future__ import annotations

import pathlib
from typing import Any
from _common import check_file_contains, check_folder_exists

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[5]
_SKILL_DIR = pathlib.Path(__file__).parents[2]
_TEMPLATES_DIR = _SKILL_DIR / "templates"

_GRAPH_RAG_DIR = _SKILL_DIR / "tool-graph-rag" / "git-clone"
_GRAPH_RAG_VENV_DIR = _GRAPH_RAG_DIR / ".venv"

TEMPLATE_MCP_SERVER_JSON = _TEMPLATES_DIR / "mcp-server-template.json"

_VSCODE_MCP_JSON = _REPO_ROOT / ".vscode" / "mcp.json"


def verify_installation() -> dict[str, Any]:
    """
    Perform verification checks for jqassistant installation.

    Returns:
        A dictionary containing the verification results.
    """
    # Build jqassistant group checks
    jq_group: dict[str, Any] = {}

    # ==========================================================================
    # GRAPH-RAG specific checks
    # ==========================================================================

    # -------
    # Python virtual environment detection for graph-RAG
    python_venv_graph_rag_dir = _GRAPH_RAG_VENV_DIR
    check_result = check_folder_exists(python_venv_graph_rag_dir, True)
    jq_group["python_venv_graph_rag"] = check_result

    # -------
    # Check if Models folder exists in the expected location for graph-RAG
    gr_models_dir = _GRAPH_RAG_DIR / "models"
    check_result = check_folder_exists(gr_models_dir, True)
    jq_group["graph_rag_models"] = check_result

    # -------
    # Check if vscode mcp.json contains jqassistant-graph-rag server
    server_id = "jqassistant-graph-rag"
    check_result = check_file_contains(_VSCODE_MCP_JSON, server_id, True)
    check_result["details"]["template"] = str(TEMPLATE_MCP_SERVER_JSON)
    check_result["details"]["server_id"] = server_id
    jq_group["vscode_mcp_json"] = check_result

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

    return jq_group
