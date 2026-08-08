"""Status enum + emoji-prefixed formatter used by installer / cleaner scripts."""

from typing import Any


def check_icon(ok: bool) -> str:
    return "✅" if ok else "❌"


def check_result(ok: bool, message: str, details: Any = None) -> dict[str, Any]:
    return {"ok": bool(ok), "message": message, "details": details}
