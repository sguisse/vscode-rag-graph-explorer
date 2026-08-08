"""Skill-wide bootstrap: load ``skill.env`` exactly once and inject
key→value pairs into ``os.environ`` as defaults.

"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from .env import load_env_vars

_SCRIPTS_DIR = Path(__file__).resolve().parents[1]
_DEFAULT_ENV_FILE = _SCRIPTS_DIR / "config" / "skill.env"


def load_skill_env_vars(
    env_file: Path | None = None, *, store_in_os_env: bool = True, print_env_vars: bool = True
) -> dict[str, str]:

    target = env_file or _DEFAULT_ENV_FILE

    if print_env_vars:
        print(f"Loading skill environment variables from file:\n--> {target}")

    values = load_env_vars(target, store_in_os_env, print_env_vars)

    if values is None:
        raise RuntimeError(f"❌ Failed to load environment variables from {target} using python-dotenv")

    return dict(values)
