"""Add / remove a MCP Server from vscode mcp.json"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Tuple

_StatusMessage = Tuple[str, str]


def add_mcp_server(mcp_json_path: Path, mcp_server_json_data: dict, server_id: str) -> _StatusMessage:
    if not mcp_json_path.exists():
        return "SKIP", f"vscode mcp.json not found at {mcp_json_path} — skipping MCP server insertion"

    try:
        with mcp_json_path.open("r", encoding="utf-8") as f:
            mcp_data = json.load(f)
    except Exception as exc:
        return "ERROR", f"Failed to read {mcp_json_path}: {exc}"

    # Ensure we operate on the nested "servers" object used by VS Code MCP
    servers = mcp_data.get("servers")
    if servers is None:
        servers = {}
        mcp_data["servers"] = servers

    if server_id in servers:
        return "SKIP", f"MCP server '{server_id}' already present in {mcp_json_path}"

    # Template JSON may either be a mapping {"servers": { ... }} or a
    # direct mapping of server-id -> definition (legacy templates). Support
    # both shapes.
    server_entry = None
    if isinstance(mcp_server_json_data, dict):
        tpl_servers = mcp_server_json_data.get("servers")
        if isinstance(tpl_servers, dict):
            server_entry = tpl_servers.get(server_id)
        if server_entry is None:
            server_entry = mcp_server_json_data.get(server_id)

    if not server_entry:
        return "ERROR", f"Server ID '{server_id}' not found in template JSON"

    servers[server_id] = server_entry

    try:
        with mcp_json_path.open("w", encoding="utf-8") as f:
            json.dump(mcp_data, f, indent=2)
    except Exception as exc:
        return "ERROR", f"Failed to write updated mcp.json: {exc}"

    return "OK", f"Inserted MCP server '{server_id}' into {mcp_json_path}"


def remove_mcp_server(mcp_json_path: Path, server_id: str) -> _StatusMessage:
    if not mcp_json_path.exists():
        return "SKIP", f"vscode mcp.json not found at {mcp_json_path} — skipping MCP server removal"

    try:
        with mcp_json_path.open("r", encoding="utf-8") as f:
            mcp_data = json.load(f)
    except Exception as exc:
        return "ERROR", f"Failed to read {mcp_json_path}: {exc}"

    # MCP servers are stored under the nested "servers" key in VS Code mcp.json
    servers = mcp_data.get("servers")
    if not isinstance(servers, dict) or server_id not in servers:
        return "SKIP", f"MCP server '{server_id}' not present in {mcp_json_path}"

    del servers[server_id]

    # If servers becomes empty, keep the empty dict (safe for VS Code). Do
    # not remove other top-level keys.

    try:
        with mcp_json_path.open("w", encoding="utf-8") as f:
            json.dump(mcp_data, f, indent=2)
    except Exception as exc:
        return "ERROR", f"Failed to write updated mcp.json: {exc}"

    return "OK", f"Removed MCP server '{server_id}' from {mcp_json_path}"
