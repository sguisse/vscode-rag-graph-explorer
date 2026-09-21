#!/usr/bin/env python3
import os
import sys
import time
import signal
import subprocess
import argparse
import shutil
from typing import Optional

# Enforce valid default locale environment variables for initdb and postgres sub-processes
if not os.environ.get("LANG"):
    os.environ["LANG"] = "C.UTF-8"
if not os.environ.get("LC_ALL"):
    os.environ["LC_ALL"] = "C.UTF-8"

IS_WINDOWS = sys.platform.startswith("win")
SANDBOX_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SANDBOX_ROOT, "data")
LOGS_DIR = os.path.join(SANDBOX_ROOT, "logs")
LOG_FILE = os.path.join(LOGS_DIR, "postgresql.log")
PIDS_DIR = os.path.join(SANDBOX_ROOT, "pids")
PID_FILE = os.path.join(PIDS_DIR, "postgresql_instance.pid")


def log_info(msg: str) -> None:
    print(f"ℹ️ [PostgresqlService] {msg}", flush=True)


def log_success(msg: str) -> None:
    print(f"✅ [PostgresqlService] {msg}", flush=True)


def log_warn(msg: str) -> None:
    print(f"⚠️ [PostgresqlService] {msg}", file=sys.stderr, flush=True)


def log_error(msg: str) -> None:
    print(f"❌ [PostgresqlService] {msg}", file=sys.stderr, flush=True)


def find_pg_ctl_binary() -> Optional[str]:
    """Locates the pg_ctl executable inside the sandbox directory tree or system PATH."""
    executable_name = "pg_ctl.exe" if IS_WINDOWS else "pg_ctl"

    for root, _, files in os.walk(SANDBOX_ROOT):
        if executable_name in files and "bin" in root:
            return os.path.join(root, executable_name)

    which_path = shutil.which("pg_ctl")
    if which_path:
        return which_path

    candidate_dirs = [
        "/Applications/Postgres.app/Contents/Versions/latest/bin",
        "/Applications/Postgres.app/Contents/Versions/16/bin",
        "/Applications/Postgres.app/Contents/Versions/15/bin",
        "/opt/homebrew/bin",
        "/opt/homebrew/opt/postgresql@16/bin",
        "/opt/homebrew/opt/postgresql@15/bin",
        "/opt/homebrew/opt/postgresql/bin",
        "/usr/local/bin",
        "/usr/local/opt/postgresql@16/bin",
        "/usr/lib/postgresql/16/bin",
        "/usr/lib/postgresql/15/bin",
        "/usr/bin",
        r"C:\Program Files\PostgreSQL\16\bin",
        r"C:\Program Files\PostgreSQL\15\bin",
    ]
    for c_dir in candidate_dirs:
        target = os.path.join(c_dir, executable_name)
        if os.path.exists(target):
            return target

    return None


def find_initdb_binary() -> Optional[str]:
    """Locates the initdb executable inside the sandbox directory tree or system PATH."""
    executable_name = "initdb.exe" if IS_WINDOWS else "initdb"

    for root, _, files in os.walk(SANDBOX_ROOT):
        if executable_name in files and "bin" in root:
            return os.path.join(root, executable_name)

    which_path = shutil.which("initdb")
    if which_path:
        return which_path

    candidate_dirs = [
        "/Applications/Postgres.app/Contents/Versions/latest/bin",
        "/Applications/Postgres.app/Contents/Versions/16/bin",
        "/Applications/Postgres.app/Contents/Versions/15/bin",
        "/opt/homebrew/bin",
        "/opt/homebrew/opt/postgresql@16/bin",
        "/opt/homebrew/opt/postgresql@15/bin",
        "/opt/homebrew/opt/postgresql/bin",
        "/usr/local/bin",
        "/usr/local/opt/postgresql@16/bin",
        "/usr/lib/postgresql/16/bin",
        "/usr/lib/postgresql/15/bin",
        "/usr/bin",
        r"C:\Program Files\PostgreSQL\16\bin",
        r"C:\Program Files\PostgreSQL\15\bin",
    ]
    for c_dir in candidate_dirs:
        target = os.path.join(c_dir, executable_name)
        if os.path.exists(target):
            return target

    return None


def is_pid_alive(pid: int) -> bool:
    """Checks whether process with given PID is running."""
    if IS_WINDOWS:
        try:
            out = subprocess.check_output(["tasklist", "/FI", f"PID eq {pid}"], text=True)
            return str(pid) in out
        except Exception:
            return False
    else:
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False


def get_running_pid() -> Optional[int]:
    """Reads PID file or postmaster.pid and checks process viability."""
    postmaster_pid = os.path.join(DATA_DIR, "postmaster.pid")
    if os.path.exists(postmaster_pid):
        try:
            with open(postmaster_pid, "r", encoding="utf-8") as f:
                pid = int(f.readline().strip())
            if is_pid_alive(pid):
                return pid
            else:
                try:
                    os.remove(postmaster_pid)
                except OSError:
                    pass
        except Exception:
            pass

    if not os.path.exists(PID_FILE):
        return None

    try:
        with open(PID_FILE, "r", encoding="utf-8") as f:
            pid = int(f.read().strip())

        if is_pid_alive(pid):
            return pid

        log_warn("Removing stale PID file...")
        cleanup_pid_file()
        return None
    except Exception:
        cleanup_pid_file()
        return None


def cleanup_pid_file() -> None:
    if os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
        except OSError:
            pass


def write_pid_file(pid: int) -> None:
    os.makedirs(PIDS_DIR, exist_ok=True)
    with open(PID_FILE, "w", encoding="utf-8") as f:
        f.write(str(pid))


def ensure_data_cluster_initialized() -> bool:
    """Ensures data directory is initialized before starting PostgreSQL."""
    pg_version_file = os.path.join(DATA_DIR, "PG_VERSION")
    if os.path.exists(pg_version_file):
        return True

    initdb_cmd = find_initdb_binary()
    if not initdb_cmd:
        log_error("Cannot initialize cluster: 'initdb' binary not found.")
        return False

    log_info("Data directory uninitialized. Running initdb...")
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        env = os.environ.copy()
        res = subprocess.run(
            [initdb_cmd, "-D", DATA_DIR, "-U", "postgres", "-A", "trust", "--encoding=UTF8"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if res.returncode == 0:
            log_success("Data cluster initialized successfully.")
            return True
        else:
            log_error(f"initdb failed: {res.stderr.strip()}")
            return False
    except Exception as e:
        log_error(f"Failed to execute initdb: {e}")
        return False


def start_service() -> bool:
    log_info("Starting PostgreSQL database instance...")

    active_pid = get_running_pid()
    if active_pid:
        log_warn(f"PostgreSQL instance is already running [PID: {active_pid}].")
        return True

    log_info("PostgreSQL instance is not running. Attempting to start...")
    pg_ctl_cmd = find_pg_ctl_binary()
    if not pg_ctl_cmd:
        log_error(f"Could not locate pg_ctl binary inside: {SANDBOX_ROOT} or system PATH")
        return False

    os.makedirs(LOGS_DIR, exist_ok=True)

    log_info("Ensuring data cluster is initialized...")
    if not ensure_data_cluster_initialized():
        log_info("Data cluster initialization failed. Cannot start PostgreSQL.")
        return False

    try:
        log_info(f"Executing command: {pg_ctl_cmd} -D {DATA_DIR} -l {LOG_FILE} start")
        env = os.environ.copy()
        res = subprocess.run(
            [pg_ctl_cmd, "-D", DATA_DIR, "-l", LOG_FILE, "start"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if res.returncode != 0:
            if "already running" in res.stderr.lower() or "postmaster.pid" in res.stderr.lower():
                time.sleep(1)
                pid = get_running_pid()
                if pid:
                    write_pid_file(pid)
                    log_success(f"PostgreSQL is active [PID: {pid}].")
                    return True
            log_error(f"Failed to start PostgreSQL: {res.stderr.strip()}")
            return False

        time.sleep(1)
        pid = get_running_pid()
        if pid:
            write_pid_file(pid)
            log_success(f"PostgreSQL started successfully [PID: {pid}].")
            return True

        log_warn("PostgreSQL started but PID could not be confirmed immediately.")
        return True

    except Exception as e:
        log_error(f"Failed to execute start command: {e}")
        return False


def stop_service() -> bool:
    pg_ctl_cmd = find_pg_ctl_binary()

    log_info("Stopping PostgreSQL database instance...")

    if pg_ctl_cmd and os.path.exists(pg_ctl_cmd):
        try:
            subprocess.run([pg_ctl_cmd, "-D", DATA_DIR, "stop", "-m", "fast"], env=os.environ, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            pass

    active_pid = get_running_pid()
    if active_pid and is_pid_alive(active_pid):
        try:
            if IS_WINDOWS:
                subprocess.run(["taskkill", "/F", "/PID", str(active_pid)], check=False)
            else:
                os.kill(active_pid, signal.SIGTERM)
                time.sleep(1)
                if is_pid_alive(active_pid):
                    os.kill(active_pid, signal.SIGKILL)
        except Exception as e:
            log_warn(f"Process termination warning: {e}")

    cleanup_pid_file()
    log_success("PostgreSQL database instance stopped.")
    return True


def restart_service() -> bool:
    log_info("Restarting PostgreSQL database instance...")
    if stop_service():
        time.sleep(2)
        return start_service()
    return False


def status_service() -> bool:
    pid = get_running_pid()
    if pid:
        log_success(f"PostgreSQL is RUNNING [PID: {pid}]")
        return True
    log_warn("PostgreSQL is STOPPED")
    return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone PostgreSQL Service Control")
    parser.add_argument("action", choices=["start", "stop", "restart", "status"], help="Action to execute")
    args = parser.parse_args()

    actions = {
        "start": start_service,
        "stop": stop_service,
        "restart": restart_service,
        "status": status_service,
    }

    success_result = actions[args.action]()
    sys.exit(0 if success_result else 1)
