"""Project / repository helpers (kebab-casing, repo-root walk-up)."""

from __future__ import annotations

import os
import re
from pathlib import Path
from .colors import (
    CYAN,
    RESET,
)


def find_repo_root(start: Path | None = None, *, marker: str = "pom.xml", max_levels: int = 8) -> Path:
    """Walk upward from ``start`` (or CWD) looking for ``marker``.

    Falls back to the starting directory when the marker is not found.
    """
    cwd = (start or Path.cwd()).resolve()
    if (cwd / marker).exists():
        return cwd
    p = cwd
    for _ in range(max_levels):
        if (p / marker).exists():
            return p
        if p.parent == p:
            break
        p = p.parent
    return cwd


def get_env_var(name: str, default: str | None = None) -> str | None:
    """Return the environment variable value for `name` or `default`."""
    return os.environ.get(name, default)


def load_env_vars(env_path: Path, store_in_os_env: bool = True, print_env_vars: bool = True) -> dict[str, str]:
    """Load a .env file and return a dict of key->value."""
    env_path = Path(env_path)
    if not env_path.exists():
        return {}

    values: dict[str, str] | None = None
    parsed = load_dotenv_values(env_path)
    if isinstance(parsed, dict):
        # convert None -> "" and sanitize newlines
        values = {k: (v if v is not None else "").replace("\n", " ") for k, v in parsed.items()}

    if values is None:
        raise RuntimeError(f"Failed to load environment variables from {env_path} using python-dotenv")

    # Final normalization: ensure strings and sanitize any remaining newlines
    normalized: dict[str, str] = {}
    for k, v in (values or {}).items():
        sval = v if v is not None else ""
        try:
            sval = str(sval)
        except Exception:
            sval = ""
        sval = sval.replace("\n", " ")
        normalized[str(k)] = sval

    if print_env_vars:
        print(f"✅ Environment variables Loaded :")

    if print_env_vars:
        for k, v in normalized.items():
            # Align "=" for better readability and use CYAN for odd indexes
            max_key_length = max(len(key) for key in normalized.keys())
            if list(normalized.keys()).index(k) % 2 == 1:
                print(f"  {CYAN}{k.ljust(max_key_length)}={v}{RESET}")
            else:
                print(f"  {k.ljust(max_key_length)}={v}")

    if store_in_os_env:
        for k, v in normalized.items():
            os.environ.setdefault(k, v)
        if print_env_vars:
            print(f"✅ Environment variables saved in os.environ !")
            print(f"-" * 130)

    return dict(normalized)


def load_dotenv_values(env_path):
    # Finally we not use python-dotenv at all, to avoid any parsing discrepancies and ensure consistent behavior across environments. The custom loader supports multi-line values and variable expansion, which are needed for our use case.
    # try:
    #    from dotenv import dotenv_values  # type: ignore
    #    return dotenv_values(str(env_path))
    # except ImportError:
    # Fallback to legacy loader if python-dotenv is not installed
    #    print(f"⚠️  python-dotenv not found, falling back to custom .env parser")
    return load_dotenv_values_without_lib(env_path)


def load_dotenv_values_without_lib(env_path):
    """Load .env values without using python-dotenv's dotenv_values.

    This lightweight loader supports:
    - comments (lines starting with '#')
    - unquoted and single-line quoted values
    - multi-line quoted values using single or double quotes (e.g. VAR="line1\nline2\n")
    - simple variable expansion using ${VAR}
    """
    values: dict[str, str] = {}
    env_path = Path(env_path)
    if not env_path.exists():
        return values

    raw_lines = env_path.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(raw_lines):
        raw = raw_lines[i]
        line = raw.strip()
        # skip empty lines and full-line comments
        if not line or line.startswith("#"):
            i += 1
            continue

        m = re.match(r"^([\w\.]+)\s*=\s*(.*)$", raw)
        if not m:
            i += 1
            continue

        key, rest = m.groups()
        rest = rest.lstrip()

        final_val = ""
        # Quoted value (possibly multi-line)
        if rest.startswith('"') or rest.startswith("'"):
            quote = rest[0]

            # Try to find a closing unescaped quote on the same line
            def _find_unescaped_quote(s: str, q: str) -> int:
                idx = 1
                while idx < len(s):
                    if s[idx] == q and s[idx - 1] != "\\":
                        return idx
                    idx += 1
                return -1

            pos = _find_unescaped_quote(rest, quote)
            if pos != -1:
                # closing quote present on the same line
                final_val = rest[1:pos]
                i += 1
            else:
                # accumulate subsequent lines until a closing quote is found
                parts: list[str] = [rest[1:]]
                i += 1
                closed = False
                while i < len(raw_lines):
                    cur = raw_lines[i]
                    # search for an unescaped closing quote in this line
                    j = 0
                    while j < len(cur):
                        if cur[j] == quote and (j == 0 or cur[j - 1] != "\\"):
                            parts.append(cur[:j])
                            closed = True
                            break
                        j += 1
                    if closed:
                        i += 1
                        break
                    parts.append(cur)
                    i += 1
                # Trim each collected line and join with a single space so
                # multi-line values become a single-space-separated string.
                trimmed_parts = [p.strip() for p in parts if p is not None]
                # Collapse internal whitespace and ensure single spaces between parts
                final_val = " ".join(" ".join(tp.split()) for tp in trimmed_parts if tp)

        else:
            # Unquoted value: strip inline comment that starts with whitespace+"#"
            comment_idx = None
            for pos, ch in enumerate(rest):
                if ch == "#" and (pos == 0 or rest[pos - 1].isspace()):
                    comment_idx = pos
                    break
            if comment_idx is not None:
                val = rest[:comment_idx].rstrip()
            else:
                val = rest.strip()
            final_val = val.strip('"').strip("'")
            i += 1

        # resolve ${VAR} expansions using values already parsed or os.environ
        final_val = re.sub(r"\$\{([^}]+)\}", lambda m: values.get(m.group(1), os.environ.get(m.group(1), "")), final_val)
        # Normalize any remaining internal newlines to single spaces and collapse
        # runs of whitespace into single spaces to match expected behavior.
        final_val = " ".join(final_val.split())

        values[key] = final_val

    return values
