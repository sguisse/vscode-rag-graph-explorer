"""Status enum + emoji-prefixed formatter used by installer / cleaner scripts."""

from __future__ import annotations

from enum import Enum


class Status(str, Enum):
    OK = "OK"
    SKIP = "SKIP"
    WARN = "WARN"
    ERROR = "ERROR"
    OVERWRITTEN = "OVERWRITTEN"
    CREATED = "CREATED"


_ICONS: dict[str, str] = {
    "OK": "✅",
    "SKIP": "⏭️",
    "ERROR": "❌",
    "WARN": "⚠️",
    "OVERWRITTEN": "✅",
    "CREATED": "✅",
}


def format_status(status: str) -> str:
    """Return ``'<icon> [STATUS]'`` (or ``'[STATUS]'`` if no icon mapped)."""
    if not status:
        return ""
    icon = _ICONS.get(status.upper(), "")
    return f"{icon} [{status}]" if icon else f"[{status}]"
