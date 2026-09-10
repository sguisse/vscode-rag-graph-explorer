import os
import platform

MODULE_NAME = "llm_copilot"

# Boolean flag to force installation/re-download of Copilot CLI into .token-razor
FORCE_INSTALL: bool = True

def get_copilot_binary_name() -> str:
    """Returns the OS-specific binary name for GitHub Copilot CLI."""
    return "copilot.exe" if os.name == "nt" else "copilot"

def get_platform_target() -> str:
    """Detects system platform and architecture identifier."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    plat_str = "win32" if system == "windows" else ("darwin" if system == "darwin" else "linux")
    arch_str = "arm64" if machine in ["arm64", "aarch64"] else "x64"

    return f"{plat_str}-{arch_str}"
