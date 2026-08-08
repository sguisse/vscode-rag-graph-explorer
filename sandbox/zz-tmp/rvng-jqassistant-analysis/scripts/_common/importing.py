"""Dynamic-import helpers for hyphenated sibling modules.

Many scripts in this skill have hyphens in their filenames (e.g.
``util-placeholders.py``) which prevents the standard ``import`` machinery
from loading them. This helper centralises the ``importlib.util`` boilerplate
so each script no longer ships its own ~30-line copy.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType


def import_module_from_path(
    module_name: str, file_path: Path, *, register: bool = True
) -> ModuleType | None:
    """Load a Python module from an arbitrary file path.

    Parameters
    ----------
    module_name:
        Logical name to register the module under (use a Python-valid name even
        if the file name contains hyphens).
    file_path:
        Absolute path to the ``.py`` file.
    register:
        When True (default) the loaded module is added to :data:`sys.modules`
        so that subsequent ``import module_name`` calls succeed cheaply.

    Returns
    -------
    The loaded module, or ``None`` on any failure (the caller can then fall
    back to its own behaviour).
    """
    if not file_path.is_file():
        return None
    try:
        spec = importlib.util.spec_from_file_location(module_name, str(file_path))
        if spec is None or spec.loader is None:
            return None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)  # type: ignore[union-attr]
        if register:
            sys.modules[module_name] = module
        return module
    except Exception:
        return None


def first_existing(candidates: list[Path]) -> Path | None:
    """Return the first existing path in ``candidates`` or ``None``."""
    for c in candidates:
        if c.exists():
            return c
    return None
