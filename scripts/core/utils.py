import os
import sys
import re
import subprocess
import signal
from datetime import datetime
from typing import List, Dict, Any

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        try: stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception: pass

LOG_ENABLED = True
MAX_SIZE_MB = 5
MAX_RETENTION = 5
WORKSPACE_ROOT = os.getcwd()
CURRENT_FILE_INDEX = 1

# Broad-spectrum resource detector covering protocols and absolute root user paths
RESOURCE_PATTERN = re.compile(r'((?:https?|bolt|file)://[^\s<>"]+|/Users/[^\s<>"]*)', re.IGNORECASE)

def configure_logger(workspace_root: str, enabled: bool, max_size: int, retention: int):
    global LOG_ENABLED, MAX_SIZE_MB, MAX_RETENTION, WORKSPACE_ROOT, CURRENT_FILE_INDEX
    WORKSPACE_ROOT = workspace_root.replace("\\", "/")
    LOG_ENABLED = enabled
    MAX_SIZE_MB = max_size
    MAX_RETENTION = retention
    if LOG_ENABLED and WORKSPACE_ROOT:
        logs_dir = f"{WORKSPACE_ROOT}/.graph-rag-explorer/logs"
        os.makedirs(logs_dir, exist_ok=True)
        active_idx = 1
        for i in range(1, 100):
            if os.path.exists(f"{logs_dir}/graph-rag-explorer-{i:02d}.log"): active_idx = i
        CURRENT_FILE_INDEX = active_idx

def _linkify_match(match: re.Match) -> str:
    resource = match.group(1)
    href = resource
    if resource.startswith('/'):
        href = f"file://{resource}"
    return f'<a href="{href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300 break-all">{resource}</a>'

def _log(level: str, component: str, message: str):
    global CURRENT_FILE_INDEX
    timestamp = datetime.now().strftime("%Y/%m/%d-%H:%M:%S.%f")[:-3]
    processed_message = RESOURCE_PATTERN.sub(_linkify_match, message)
    full_message = f"[{timestamp}] {level} [{component}] {processed_message}"

    target_stream = sys.stderr if "ERROR" in level or "WARN" in level else sys.stdout
    print(full_message, file=target_stream, flush=True)

    if LOG_ENABLED and WORKSPACE_ROOT:
        try:
            logs_dir = f"{WORKSPACE_ROOT}/.graph-rag-explorer/logs"
            log_path = f"{logs_dir}/logs_dir/graph-rag-explorer-{CURRENT_FILE_INDEX:02d}.log"
            with open(f"{logs_dir}/graph-rag-explorer-{CURRENT_FILE_INDEX:02d}.log", "a", encoding="utf-8") as lf:
                lf.write(full_message + "\n")
        except Exception: pass

def info(msg: str, component: str = "System"): _log("ℹ️ [INFO]", component, msg)
def success(msg: str, component: str = "System"): _log("✅ [SUCCESS]", component, msg)
def warn(msg: str, component: str = "System"): _log("⚠️ [WARN]", component, msg)
def error(msg: str, component: str = "System"): _log("❌ [ERROR]", component, msg)

def normalize_path(raw_path: str) -> str: return os.path.abspath(raw_path).replace("\\", "/")
def get_platform_shell_requirement() -> bool: return os.name == 'nt'
def resolve_executable_name(base_command: str) -> str:
    if os.name == 'nt' and base_command in ["npm", "npx", "uv", "uvx", "jqassistant.sh"]:
        return f"{base_command}.cmd" if base_command != "jqassistant.sh" else "jqassistant.cmd"
    return base_command

def get_pids_dir() -> str: return f"{WORKSPACE_ROOT}/.graph-rag-explorer/target/pids"

def cleanup_orphan_pids():
    pids_dir = get_pids_dir()
    if not os.path.exists(pids_dir): return
    for file_name in os.listdir(pids_dir):
        if file_name.endswith(".pid"):
            pid_path = os.path.join(pids_dir, file_name)
            try:
                with open(pid_path, "r", encoding="utf-8") as pf: pid = int(pf.read().strip())
                if os.name == 'nt': subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                else: os.killpg(os.getpgid(pid), signal.SIGKILL)
            except Exception: pass
            finally:
                if os.path.exists(pid_path): os.remove(pid_path)

def execute_tracked_command(cmd_args: List[str], tool_name: str, cwd: str = None, env: Dict[str, str] = None) -> int:
    if not cmd_args: return 1
    cmd_args[0] = resolve_executable_name(cmd_args[0])
    pids_dir = get_pids_dir()
    os.makedirs(pids_dir, exist_ok=True)
    kwargs = {"cwd": cwd, "env": env or os.environ.copy(), "stdout": subprocess.PIPE, "stderr": subprocess.PIPE, "shell": get_platform_shell_requirement()}
    if os.name == 'nt': kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else: kwargs["preexec_fn"] = os.setsid
    try:
        proc = subprocess.Popen(cmd_args, **kwargs)
        pid_file = os.path.join(pids_dir, f"{tool_name}_{proc.pid}.pid")
        with open(pid_file, "w", encoding="utf-8") as f: f.write(str(proc.pid))
        proc.communicate()
        if os.path.exists(pid_file): os.remove(pid_file)
        return proc.returncode
    except Exception as e:
        error(f"Tracked execution crash inside shell layer: {e}", component="ProcessManager")
        return 1
