#!/usr/bin/env python3
"""Placeholder helpers.

package so scripts can import the helpers directly as ``from _common``.

Note: the default env file is expected next to the scripts folder (one
level above this module) to preserve previous behaviour.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Tuple

# ── project name helpers ───────────────────────────────────────────────────


def safe_project_name(raw: str) -> str:
    """Convert an arbitrary string to a safe kebab-case identifier."""
    name = (raw or "").lower().strip()
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = name.strip("-")
    return name or "project"


def define_project_name(root: Path | str, provided: str | None = None) -> str:
    """Return the project name to use.

    Preference order:
      1. provided (explicit arg)
      2. environment variable PROJECT_NAME
      3. derived from root.name
    """
    if provided:
        return safe_project_name(provided)
    env_val = os.environ.get("PROJECT_NAME")
    if env_val:
        return safe_project_name(env_val)
    try:
        root_name = Path(root).name
    except Exception:
        root_name = "project"
    return safe_project_name(root_name)


# ── placeholder substitution ─────────────────────────────────────────────────

_PLACEHOLDER_RE = re.compile(r"\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}")


def substitute(content: str, env: dict[str, str], strict: bool = False) -> tuple[str, list[str]]:
    """Replace all {{KEY}} occurrences in *content* with values from *env*."""
    missing: list[str] = []

    def _replace(m: re.Match) -> str:
        key = m.group(1)
        if key in env:
            return env[key]
        missing.append(key)
        return m.group(0)

    result = _PLACEHOLDER_RE.sub(_replace, content)
    return result, missing


def copy_template(
    src: Path,
    dst: Path,
    env_vars: dict,
    force: bool,
) -> tuple[str, str]:
    """Copy *src* to *dst*, replacing all {{VAR}} placeholders via env_vars.

    Returns (status, message).
    """
    if dst.exists() and not force:
        return "SKIP", f"Already exists (use --force to overwrite): {dst}"

    try:
        content, missing = read_template(src, env_vars)

        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(content, encoding="utf-8")
        action = "OVERWRITTEN" if dst.exists() else "CREATED"
        return "OK", f"{action}: {dst}"
    except Exception as exc:
        return "ERROR", f"Failed to write {dst}: {exc}"


def read_template(src: Path, env_vars: dict) -> tuple[str, list[str]]:
    """Read *src* and replace all {{VAR}} placeholders via env_vars.

    Returns (content, missing_placeholders).
    """
    try:
        content = src.read_text(encoding="utf-8")
        content, missing = substitute(content, env_vars)
        if missing:
            for key in sorted(set(missing)):
                print(
                    f"  ⚠️  WARN: no value for placeholder {{{{{key}}}}} in {src.name}",
                    flush=True,
                )
        return content, missing
    except Exception as exc:
        raise RuntimeError(f"Failed to read template {src}: {exc}") from exc
