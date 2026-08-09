#!/usr/bin/env python3
"""
py_venv_install.py

Allow creation of a Python virtual environment and installation of requirements.txt in one step.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import os
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Skill / scripts folder paths
# When this module lives in `_common/`, the scripts directory is the parent
# folder of the package folder.
# ---------------------------------------------------------------------------
_SCRIPTS_DIR = Path(__file__).parents[2]

# ---------------------------------------------------------------------------
# Ensure callers running the module standalone can still import the sibling
# `_common` package and other scripts by adding the scripts folder to sys.path
# (keeps behaviour identical to the original standalone helper).
# ---------------------------------------------------------------------------
# import sys as _sys
# _sys.path.insert(0, str(_SCRIPTS_DIR))

import os
import platform
import subprocess
import shutil
from pathlib import Path


def _install_pyenv() -> bool:
    """Attempt to dynamically install pyenv based on the operating system."""
    print("  ⚙️   pyenv not found. Attempting to install pyenv automatically...")

    system = platform.system().lower()
    home = Path.home()

    try:
        if system == "windows":
            print("  🪟  Windows detected. Installing pyenv-win via PowerShell...")
            cmd = [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                "Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1' -OutFile './install-pyenv-win.ps1'; & './install-pyenv-win.ps1'; Remove-Item './install-pyenv-win.ps1'",
            ]
            subprocess.run(cmd, check=True)

            # Update PATH for the current running process
            pyenv_root = home / ".pyenv" / "pyenv-win"
            os.environ["PYENV"] = str(pyenv_root)
            os.environ["PYENV_ROOT"] = str(pyenv_root)
            os.environ["PATH"] = f"{pyenv_root / 'bin'};{pyenv_root / 'shims'};" + os.environ.get("PATH", "")

        elif system == "darwin" and shutil.which("brew"):
            print("  🍎  macOS detected with Homebrew. Installing pyenv via brew...")
            subprocess.run(["brew", "install", "pyenv"], check=True)
            # Homebrew automatically links pyenv to the standard system PATH (/usr/local/bin or /opt/homebrew/bin)

        else:
            # Linux or macOS without Homebrew
            print(f"  🐧  {system.capitalize()} detected. Installing pyenv via pyenv.run installer...")
            print("  ⚠️  Note: Linux requires build dependencies (make, libssl-dev, etc.) to compile Python later.")

            # Equivalent to `curl https://pyenv.run | bash`
            curl_proc = subprocess.Popen(["curl", "-L", "-s", "https://pyenv.run"], stdout=subprocess.PIPE)
            subprocess.run(["bash"], stdin=curl_proc.stdout, check=True)
            curl_proc.stdout.close()
            curl_proc.wait()

            # Update PATH for the current running process
            pyenv_root = home / ".pyenv"
            os.environ["PYENV_ROOT"] = str(pyenv_root)
            os.environ["PATH"] = f"{pyenv_root / 'bin'}:{pyenv_root / 'shims'}:" + os.environ.get("PATH", "")

        # Verify installation in the current process
        if (
            shutil.which("pyenv")
            or (home / ".pyenv" / "bin" / "pyenv").exists()
            or (home / ".pyenv" / "pyenv-win" / "bin" / "pyenv").exists()
        ):
            print("  ✅  pyenv successfully installed for this session!")
            print("  💡  (You may still need to add pyenv to your ~/.bashrc or ~/.zshrc for permanent terminal use).")
            return True
        else:
            print("  ❌  pyenv installation completed, but 'pyenv' executable could not be found in PATH.")
            return False

    except subprocess.CalledProcessError as e:
        print(f"  ❌  Failed to install pyenv. Process exited with code: {e.returncode}")
        return False
    except Exception as e:
        print(f"  ❌  Unexpected error during pyenv installation: {e}")
        return False


def _install_base_python(py_prj_root: Path) -> str:
    """Read .python-version and try to find a matching system python.
    If not found, attempt to use/install pyenv to install it automatically.
    Falls back to sys.executable if pyenv fails or is unavailable.
    """
    version_file = py_prj_root / ".python-version"
    current_python = sys.executable

    if not version_file.exists():
        return current_python

    try:
        version = version_file.read_text().strip()
        if not version:
            return current_python

        # 1. Try exact version (e.g. python3.11.2) then major.minor (e.g. python3.11)
        candidates = [f"python{version}"]
        if "." in version:
            parts = version.split(".")
            if len(parts) > 2:
                candidates.append(f"python{parts[0]}.{parts[1]}")

        for cmd in candidates:
            path = shutil.which(cmd)
            if path:
                return path

        # 2. Not found in PATH. Check for pyenv, or install it.
        print(f"  🔍  Python {version} not found in PATH. Checking for pyenv...")

        has_pyenv = shutil.which("pyenv") is not None
        if not has_pyenv:
            has_pyenv = _install_pyenv()

        if has_pyenv:
            # We use shutil.which again just in case the absolute path is required after install
            pyenv_cmd = shutil.which("pyenv") or "pyenv"

            print(f"  📥  Attempting to install Python {version} via pyenv...")
            try:
                # Run pyenv install (skips if it exists)
                subprocess.run([pyenv_cmd, "install", "--skip-existing", version], check=True)

                # Get the absolute path to the newly installed Python executable
                prefix_result = subprocess.run([pyenv_cmd, "prefix", version], capture_output=True, text=True, check=True)
                pyenv_prefix = Path(prefix_result.stdout.strip())

                # Check standard bin/python path inside the pyenv prefix
                new_python = pyenv_prefix / "bin" / "python"
                if not new_python.exists():
                    new_python = pyenv_prefix / "python.exe"  # Fallback for Windows pyenv-win

                if new_python.exists():
                    print(f"  ✅  Successfully installed and resolved Python {version} via pyenv.")
                    return str(new_python)

            except subprocess.CalledProcessError as e:
                print(f"  ⚠️  Warning: pyenv failed to install Python {version}. Exit code: {e.returncode}")
                print("      (On Linux, this usually means missing build dependencies like libssl-dev or make).")
        else:
            print(f"  ⚠️  Warning: Could not configure pyenv. Cannot auto-install Python {version}.")

        print(f"  ⚠️  Warning: Falling back to current system Python: {current_python}")

    except Exception as e:
        print(f"  ⚠️  Warning: Error reading .python-version or running pyenv: {e}. Falling back to {current_python}")

    return current_python


# ---------------------------------------------------------------------------
def get_venv_python(venv_path: Path) -> Path | None:
    """Return the Python executable inside *venv_path*, or ``None`` if not found."""
    for candidate in (
        venv_path / "bin" / "python",
        venv_path / "bin" / "python3",
        venv_path / "Scripts" / "python.exe",
    ):
        if candidate.exists():
            return candidate
    return None


# ---------------------------------------------------------------------------
def venv_install(
    py_prj_root: Path,
    venv_dir: str = ".venv",
    force: bool = False,
) -> tuple[str, str]:
    """Create a virtualenv under ``py_prj_root / venv_dir`` and install
    ``requirements.txt`` found in the project root. Returns (status, message, python_bin).
    """

    if not py_prj_root.is_dir():
        return ("ERROR", f"Project py_prj_root does not exist: {py_prj_root}")

    requirements = py_prj_root / "requirements.txt"
    venv_path = py_prj_root / venv_dir
    base_python = _install_base_python(py_prj_root)

    print(f"🐍  Python environment installation -----------------------------------------")
    print(f"  📁  Project py_prj_root : {py_prj_root}")
    print(f"  📦  Venv path           : {venv_path}")
    print(f"  🐍  Base Python         : {base_python}")
    print(f"  ⚙️   Requirements        : {requirements}")
    print()

    # ------------------------------------------------------------------ force clean
    if force and venv_path.exists():
        print(f"  🗑️   Force enabled: Removing existing virtualenv at {venv_path}...")
        try:
            shutil.rmtree(venv_path)
        except Exception as exc:
            return ("ERROR", f"Failed to remove existing virtualenv: {exc}")

    # ------------------------------------------------------------------ create
    try:
        if venv_path.exists():
            print(f"  ⏭️  Virtualenv already exists at {venv_path}, skipping creation.")
        else:
            print(f"  🔨  Creating virtualenv...")
            subprocess.run([base_python, "-m", "venv", str(venv_path)], check=True)
            print(f"  ✅  Created virtualenv at {venv_path} using base Python {base_python}")

    except Exception as exc:
        return ("ERROR", f"Failed to create virtualenv: {exc}")

    python_bin = get_venv_python(venv_path)
    if not python_bin:
        return ("ERROR", f"Could not locate python executable inside {venv_path}")
    # ------------------------------------------------------------------ install requirements
    if requirements.exists():
        print(f"  📦  Installing requirements from {requirements.name}...")
        try:
            # Upgrade pip silently before installing requirements
            subprocess.run(
                [str(python_bin), "-m", "pip", "install", "--upgrade", "pip"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            # Install requirements
            subprocess.run([str(python_bin), "-m", "pip", "install", "-r", str(requirements)], check=True)
            print(f"  ✅  Requirements successfully installed.")

        except subprocess.CalledProcessError as exc:
            return ("ERROR", f"Failed to install requirements: PIP process exited with code {exc.returncode}")
    else:
        print(f"  ⏭️  No {requirements.name} found. Skipping dependency installation.")

    return ("OK", f"Virtualenv ready at {venv_path} (requirements from {requirements.name} installed).")


# ---------------------------------------------------------------------------
# Standalone CLI
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(
        description=("Create a Python virtualenv and install requirements.\n"),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--py_prj_root",
        default=None,
        help="Project py_prj_root where the venv will be created (default: cwd).",
    )
    parser.add_argument(
        "--venv_dir",
        default=".venv",
        help="venv folder name inside the python project root.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Remove and recreate an existing venv.",
    )

    args = parser.parse_args()
    py_prj_root = Path(args.py_prj_root).resolve() if args.py_prj_root else Path.cwd()

    venv_install(py_prj_root, args.venv_dir, args.force)

    return 0  #  venv created/already-exists and requirements installed


if __name__ == "__main__":
    sys.exit(main())
