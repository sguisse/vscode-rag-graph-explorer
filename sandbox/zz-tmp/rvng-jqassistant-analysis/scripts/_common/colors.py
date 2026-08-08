"""ANSI color constants and convenience helpers shared by every script.

Setting the ``NO_COLOR`` environment variable (or piping to a non-TTY) disables
the codes so logs stay clean.
"""

from __future__ import annotations

import os
import sys

_DISABLE = bool(os.environ.get("NO_COLOR")) or not sys.stdout.isatty()


def _c(code: str) -> str:
    return "" if _DISABLE else code


GREEN = _c("\033[32m")
YELLOW = _c("\033[33m")
RED = _c("\033[31m")
CYAN = _c("\033[36m")
MAGENTA = _c("\033[35m")
WHITE = _c("\033[97m")
BOLD = _c("\033[1m")
DIM = _c("\033[2m")
RESET = _c("\033[0m")
BG_GRAY = _c("\033[100m")


def ok(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {GREEN}✅  {label}{RESET}{suffix}")


def warn(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {YELLOW}⚠️   {label}{RESET}{suffix}")


def fail(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {RED}❌  {label}{RESET}{suffix}")


def info(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {CYAN}ℹ️   {label}{RESET}{suffix}")


def header(title: str) -> None:
    print(f"\n{BOLD}{title}{RESET}")
    print("─" * (len(title) + 4))
