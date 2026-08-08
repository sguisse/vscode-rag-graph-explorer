#!/usr/bin/env python3
"""
graph_rag_install.py
=====================
All-in-one installer for the jqassistant-graph-rag tool.

"""

import json
from typing import Any
from pathlib import Path
from _common import add_mcp_server, load_skill_env_vars, read_template
from _common import format_status as _format_status, venv_install

from .graph_rag_llm_model_dwn import download_graph_rag_llm_model

_env_vars = load_skill_env_vars(print_env_vars=False)


def install_graph_rag(check_result: dict[str, Any]) -> int:
    nb_errors = 0

    # 1) ---- Install Python virtual environment for JQAssistant Graph RAG (if not already present)
    result = install_skill_python_venv(check_result["python_venv_graph_rag"])
    if result:
        nb_errors += 1

    # 2) ---- Model folder for graph-RAG
    result = install_graph_rag_model(check_result["graph_rag_models"])
    if result:
        nb_errors += 1

    # 3) ---- Ensure vscode mcp.json contains jqassistant-graph-rag server entry
    result = install_jqassistant_mcp_server(check_result["vscode_mcp_json"])
    if result:
        nb_errors += 1

    return nb_errors


# ---------------------------------------------------------------------------------------------
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


def install_graph_rag_model(check_result: dict[str, Any]) -> bool:
    had_errors = False
    expected_models_path = check_result.get("details", {}).get("path")

    if check_result.get("ok"):
        print(f"  ⏭️  Graph-RAG models already exist at {expected_models_path}, skipping download.")
    else:
        graph_rag_dir = Path(expected_models_path).parent
        status, msg = download_graph_rag_llm_model(graph_rag_dir / ".venv" / "bin" / "python", graph_rag_dir)
        print(f"{_format_status(status)} Graph RAG model — {msg}")
        if status == "ERROR":
            had_errors = True

    return had_errors


def install_jqassistant_mcp_server(check_result: dict[str, Any]) -> bool:
    had_errors = False
    vscode_mcp_json_path = check_result.get("details", {}).get("path")
    mcp_server_template_path = check_result.get("details", {}).get("template")
    server_id = check_result.get("details", {}).get("server_id")

    if check_result.get("ok"):
        print(f"  ⏭️  vscode mcp.json already contains jqassistant-graph-rag server entry, skipping update.")
    else:
        content, missing = read_template(Path(mcp_server_template_path), _env_vars)
        content_json = json.loads(content)
        status, msg = add_mcp_server(Path(vscode_mcp_json_path), content_json, server_id)
        print(f"{_format_status(status)} vscode mcp.json — {msg}")
        if status == "ERROR":
            had_errors = True

    return had_errors
