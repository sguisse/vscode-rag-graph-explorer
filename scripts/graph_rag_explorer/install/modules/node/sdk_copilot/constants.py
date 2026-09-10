import os
import platform

MODULE_NAME = "node_llm_copilot_sdk"

def get_platform_target() -> str:
    """Detects system platform and architecture identifier."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    plat_str = "win32" if system == "windows" else ("darwin" if system == "darwin" else "linux")
    arch_str = "arm64" if machine in ["arm64", "aarch64"] else "x64"

    return f"{plat_str}-{arch_str}"
