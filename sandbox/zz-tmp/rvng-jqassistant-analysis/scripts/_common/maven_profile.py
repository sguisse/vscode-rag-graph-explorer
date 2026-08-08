"""Add / remove a Maven ``<profile>`` block in a project pom.xml.

Centralises the inverse pair of regex-based mutations that previously lived
duplicated in ``jqassistant_install.py`` and ``jqassistant_clean.py``.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Tuple

_StatusMessage = Tuple[str, str]


def _profile_block(profile_id: str, *, template_text: str | None = None) -> str:
    """Return the snippet to insert. If a template is supplied and contains a
    full ``<profile>`` with the matching ``<id>``, that snippet is preferred so
    plugin/properties content is preserved.
    """
    if template_text:
        for match in re.findall(r"<profile\b[^>]*>.*?</profile>", template_text, flags=re.DOTALL):
            if f"<id>{profile_id}</id>" in match:
                return match
    return f"  <profile>\n    <id>{profile_id}</id>\n  </profile>"


def add_profile(
    pom_path: Path,
    profile_id: str,
    template_path: Path | None = None,
) -> _StatusMessage:
    """Ensure ``pom.xml`` contains a ``<profile><id>profile_id</id>...``.

    Returns ``(status, message)`` where status ∈ ``{OK, SKIP, ERROR}``.
    Idempotent: re-running on a pom that already has the profile reports SKIP.
    """
    if not pom_path.exists():
        return "SKIP", f"pom.xml not found at {pom_path} — skipping profile insertion"

    try:
        content = pom_path.read_text(encoding="utf-8")
    except Exception as exc:
        return "ERROR", f"Failed to read {pom_path}: {exc}"

    if f"<id>{profile_id}</id>" in content:
        return "SKIP", f"Profile '{profile_id}' already present in {pom_path}"

    template_text: str | None = None
    if template_path and template_path.exists():
        try:
            template_text = template_path.read_text(encoding="utf-8")
        except Exception:
            template_text = None

    snippet = _profile_block(profile_id, template_text=template_text)

    if "</profiles>" in content:
        new_content = content.replace("</profiles>", snippet + "\n</profiles>", 1)
        action = f"Inserted profile '{profile_id}' into existing <profiles> in {pom_path}"
    elif "</project>" in content:
        block = f"\n  <profiles>\n{snippet}\n  </profiles>\n"
        new_content = content.replace("</project>", block + "</project>", 1)
        action = f"Added <profiles> with '{profile_id}' to {pom_path}"
    else:
        return "ERROR", "pom.xml does not contain </project> - cannot insert profiles"

    try:
        pom_path.write_text(new_content, encoding="utf-8")
    except Exception as exc:
        return "ERROR", f"Failed to write updated pom.xml: {exc}"

    return "OK", action


def remove_profile(
    pom_path: Path,
    profile_id: str,
    dry_run: bool = False,
) -> bool:
    """Strip every ``<profile>`` whose ``<id>`` matches ``profile_id``.

    Returns True when the file was changed (or would be in dry-run mode).
    """
    if not pom_path.exists():
        print(f"⏭️  SKIP pom (missing): {pom_path}")
        return False
    try:
        text = pom_path.read_text(encoding="utf-8")
    except Exception as exc:
        print(f"❌  Cannot read {pom_path}: {exc}")
        return False

    # Counter to track how many profiles we actually remove
    removed_count = 0
    id_pattern = re.compile(r"<id>\s*" + re.escape(profile_id) + r"\s*</id>")

    def replacer(match: re.Match) -> str:
        nonlocal removed_count
        block = match.group(0)
        # If this specific profile block contains our target ID, remove it
        if id_pattern.search(block):
            removed_count += 1
            return ""
        # Otherwise, put the block back unchanged
        return block

    # Isolate each profile block individually and process it through the replacer
    block_pattern = re.compile(r"<profile\b[^>]*>.*?</profile>", flags=re.DOTALL)
    new_text = block_pattern.sub(replacer, text)

    if removed_count == 0:
        print(f"⏭️  SKIP pom: no profile '{profile_id}' found in {pom_path}")
        return False

    # Clean up empty <profiles> block if all profiles were removed
    new_text = re.sub(r"<profiles>\s*</profiles>", "", new_text, flags=re.DOTALL)

    print(f"🗑️  Removing {removed_count} <profile> block(s) with id '{profile_id}' from {pom_path}")
    if dry_run:
        return True
    try:
        pom_path.write_text(new_text, encoding="utf-8")
        return True
    except Exception as exc:
        print(f"❌  Failed to write updated pom.xml: {exc}")
        return False


def check_profile_exists(pom_path: Path, profile_id: str) -> bool:
    """Return True when the given ``pom.xml`` contains a ``<profile>`` with
    ``<id>profile_id</id>``.

    The check is robust to whitespace and attributes inside the ``<profile>``
    tag by using a DOTALL regex search similar to the removal function.
    """
    if not pom_path.exists():
        return False
    try:
        text = pom_path.read_text(encoding="utf-8")
    except Exception:
        return False

    pattern = re.compile(
        r"<profile\b.*?>.*?<id>\s*" + re.escape(profile_id) + r"\s*</id>.*?</profile>",
        flags=re.DOTALL,
    )
    return bool(pattern.search(text))
