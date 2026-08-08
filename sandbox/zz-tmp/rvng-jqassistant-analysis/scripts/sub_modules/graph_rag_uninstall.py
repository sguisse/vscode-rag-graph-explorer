#!/usr/bin/env python3
"""
graph_rag_uninstall.py
======================
Inverse of ``graph_rag_install.py``.

Removes (when present) every artefact created by the graph-RAG installer:
  - Python virtual environment inside the graph-rag git-clone directory
  - ``models/`` directory inside the git-clone directory
  - ``jqassistant-graph-rag`` entry from ``.vscode/mcp.json``

All helpers mirror the corresponding install functions so that the two files
stay in sync.  Provide ``dry_run=True`` to preview actions without touching
the filesystem.
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from _common import remove_mcp_server
from _common import format_status as _format_status


# ---------------------------------------------------------------------------
# Public API — mirrors graph_rag_install.install_graph_rag()
# ---------------------------------------------------------------------------


def uninstall_graph_rag(check_result: dict[str, Any], dry_run: bool = False) -> int:
    """Remove all graph-RAG artefacts.

    Args:
        check_result: the ``"🔍  graph-rag verifier results (nested)"`` sub-dict
                      returned by ``jqassistant_verify.verify_installation()``.
        dry_run:      when True, print what would be done but change nothing.

    Returns:
        Number of items that failed to be removed (0 = full success).
    """
    nb_errors = 0

    # 1) Python virtual environment
    result = uninstall_skill_python_venv(check_result["python_venv_graph_rag"], dry_run)
    if result:
        nb_errors += 1

    # 2) Graph-RAG LLM model directory
    result = uninstall_graph_rag_model(check_result["graph_rag_models"], dry_run)
    if result:
        nb_errors += 1

    # 3) VS Code mcp.json entry
    result = uninstall_jqassistant_mcp_server(check_result["vscode_mcp_json"], dry_run)
    if result:
        nb_errors += 1

    return nb_errors


# ---------------------------------------------------------------------------
# Individual uninstall helpers
# ---------------------------------------------------------------------------


def uninstall_skill_python_venv(check_result: dict[str, Any], dry_run: bool = False) -> bool:
    """Remove the graph-RAG Python virtual environment.

    Returns True on error (mirrors the install convention where True = had_errors).
    """
    had_errors = False
    expected_venv_path = check_result.get("details", {}).get("path")

    if not check_result.get("ok"):
        print(f"  ⏭️  Graph-RAG Python venv not found at {expected_venv_path}, skipping removal.")
        return had_errors

    venv = Path(expected_venv_path)
    print(f"  🗑️  Removing graph-RAG Python venv: {venv}")
    if not dry_run:
        try:
            shutil.rmtree(venv)
            print(f"{_format_status('OK')} Removed graph-RAG Python venv — {venv}")
        except Exception as exc:
            print(f"{_format_status('ERROR')} Failed to remove graph-RAG venv {venv}: {exc}")
            had_errors = True
    else:
        print(f"{_format_status('OK')} [dry-run] Would remove: {venv}")

    return had_errors


def uninstall_graph_rag_model(check_result: dict[str, Any], dry_run: bool = False) -> bool:
    """Remove the graph-RAG sentence-transformer model directory.

    Returns True on error.
    """
    had_errors = False
    expected_models_path = check_result.get("details", {}).get("path")

    if not check_result.get("ok"):
        print(f"  ⏭️  Graph-RAG models not found at {expected_models_path}, skipping removal.")
        return had_errors

    models_dir = Path(expected_models_path)
    print(f"  🗑️  Removing graph-RAG models directory: {models_dir}")
    if not dry_run:
        try:
            shutil.rmtree(models_dir)
            print(f"{_format_status('OK')} Removed graph-RAG models — {models_dir}")
        except Exception as exc:
            print(f"{_format_status('ERROR')} Failed to remove models dir {models_dir}: {exc}")
            had_errors = True
    else:
        print(f"{_format_status('OK')} [dry-run] Would remove: {models_dir}")

    return had_errors


def uninstall_jqassistant_mcp_server(check_result: dict[str, Any], dry_run: bool = False) -> bool:
    """Remove the ``jqassistant-graph-rag`` entry from ``.vscode/mcp.json``.

    Returns True on error.
    """
    had_errors = False
    vscode_mcp_json_path = check_result.get("details", {}).get("path")
    server_id = check_result.get("details", {}).get("server_id", "jqassistant-graph-rag")

    if not check_result.get("ok"):
        print(f"  ⏭️  MCP server '{server_id}' not found in {vscode_mcp_json_path}, skipping removal.")
        return had_errors

    print(f"  🗑️  Removing graph-RAG MCP Server from: {vscode_mcp_json_path}")

    if dry_run:
        print(f"{_format_status('OK')} [dry-run] Would remove MCP server '{server_id}' from {vscode_mcp_json_path}")
        return had_errors

    status, msg = remove_mcp_server(Path(vscode_mcp_json_path), server_id)
    print(f"{_format_status(status)} vscode mcp.json — {msg}")
    if status == "ERROR":
        had_errors = True

    return had_errors
