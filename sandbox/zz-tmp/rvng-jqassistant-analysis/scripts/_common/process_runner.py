"""Safe subprocess wrapper — replaces shell=True f-string calls.

The previous ``_run(cmd, shell=True)`` pattern in ``jqassistant_manager.py``
is a command-injection surface when ``cmd`` contains env-derived values
(paths, project names, passwords) that may include shell meta-characters.

This module provides:

- ``run_args(args, cwd=None, dry_run=False, timeout=None) -> int``
  Runs a command list **without shell** and returns the exit code.

- ``run_shell(cmd_str, cwd=None, dry_run=False, timeout=None) -> int``
  Legacy shim that prints the command and runs it with ``shell=True`` **only**
  when the caller explicitly chooses to. Used exclusively for the subset of
  jqassistant_manager actions that build complex Maven pipelines where shell
  composition is intentional and inputs are trusted (read-only paths from
  this script's own constants). New code should prefer ``run_args``.
"""

from __future__ import annotations

import shlex
import subprocess
import sys
from pathlib import Path

try:
    from .colors import BOLD, GREEN, RESET
except ImportError:  # standalone / sys.path usage
    BOLD = GREEN = RESET = ""


def _echo(cmd_display: str) -> None:
    print(f"{GREEN}▶{RESET} {BOLD}{cmd_display}{RESET}", flush=True)


def run_args(
    args: list[str | Path],
    cwd: Path | None = None,
    *,
    dry_run: bool = False,
    timeout: float | None = None,
) -> int:
    """Execute *args* without a shell. Prints the command before running.

    Parameters
    ----------
    args:
        The command and its arguments as a list (no shell expansion).
    cwd:
        Working directory (``None`` = inherit).
    dry_run:
        If True, print the command but do not execute it.
    timeout:
        Optional timeout in seconds.

    Returns
    -------
    Exit code (0 = success).  Returns 0 in dry-run mode.
    """
    str_args = [str(a) for a in args]
    _echo(shlex.join(str_args))
    if dry_run:
        return 0
    try:
        result = subprocess.run(str_args, cwd=cwd, timeout=timeout)
        return result.returncode
    except FileNotFoundError as exc:
        print(f"  ❌  Command not found: {exc}", file=sys.stderr)
        return 127
    except subprocess.TimeoutExpired:
        print(f"  ❌  Command timed out after {timeout}s", file=sys.stderr)
        return 124


def run_shell(
    cmd: str,
    cwd: Path | None = None,
    *,
    dry_run: bool = False,
    timeout: float | None = None,
) -> int:
    """Legacy shim: execute *cmd* string with ``shell=True``.

    Only call this for trusted, hard-coded shell pipelines (e.g. Maven with
    ``tail -f /dev/null | mvn …``). Do NOT construct *cmd* from user input
    or env-derived secrets.
    """
    _echo(cmd)
    if dry_run:
        return 0
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd, timeout=timeout
        )  # nosec B602 (caller responsibility)
        return result.returncode
    except subprocess.TimeoutExpired:
        print(f"  ❌  Command timed out after {timeout}s", file=sys.stderr)
        return 124


# Create a method to split a string command into args and return the result of run_args for better security (avoid shell=True).
def split_cmd_params(cmd: str) -> list[str]:
    args = shlex.split(cmd)
    # in args, split also parameters that are in the form --key=value into separate --key and value parts
    expanded_args = []
    for arg in args:
        if "==" in arg and (arg.startswith("-D") or arg.startswith("--")):
            key, value = arg.split("=", 1)
            expanded_args.extend([key, value])
        else:
            expanded_args.append(arg)
    return expanded_args


def merge_cmd_list_params(args: list[str], paramsToMerge: list[str]) -> list[str]:
    cmd = shlex.join(args)
    params = shlex.join(paramsToMerge)
    merged_cmd = f"{cmd} {params}"
    merged_args = shlex.split(merged_cmd)
    return merged_args


def merge_cmd_str_params(args: list[str], paramsToMerge: str) -> list[str]:
    return merge_cmd_list_params(args, split_cmd_params(paramsToMerge))
