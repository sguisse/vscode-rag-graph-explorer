#!/usr/bin/env python3
import os
import sys
import time
import signal
import subprocess
import argparse
from typing import Optional

IS_WINDOWS = sys.platform.startswith("win")
SANDBOX_ROOT = os.path.dirname(os.path.abspath(__file__))
PIDS_DIR = os.path.join(SANDBOX_ROOT, "pids")
PID_FILE = os.path.join(PIDS_DIR, "neo4j_instance.pid")


def log_info(msg: str) -> None:
    print(f"ℹ️ [Neo4jService] {msg}")


def log_success(msg: str) -> None:
    print(f"✅ [Neo4jService] {msg}")


def log_warn(msg: str) -> None:
    print(f"⚠️ [Neo4jService] {msg}")


def log_error(msg: str) -> None:
    print(f"❌ [Neo4jService] {msg}")


def find_neo4j_binary() -> Optional[str]:
    """Locates the neo4j executable inside the sandbox directory tree."""
    executable_name = "neo4j.bat" if IS_WINDOWS else "neo4j"
    for root, _, files in os.walk(SANDBOX_ROOT):
        if executable_name in files and "bin" in root:
            return os.path.join(root, executable_name)
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
    """Reads PID file and checks process viability."""
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


def start_service() -> bool:
    active_pid = get_running_pid()
    if active_pid:
        log_warn(f"Neo4j instance is already running [PID: {active_pid}].")
        return True

    neo4j_cmd = find_neo4j_binary()
    if not neo4j_cmd:
        log_error(f"Could not locate Neo4j binary inside: {SANDBOX_ROOT}")
        return False

    log_info("Starting Neo4j database instance...")
    try:
        if IS_WINDOWS:
            proc = subprocess.Popen(
                [neo4j_cmd, "console"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 512),
            )
            pid = proc.pid
        else:
            proc = subprocess.Popen(
                [neo4j_cmd, "start"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid,
            )
            stdout, stderr = proc.communicate()

            if proc.returncode != 0:
                log_error(f"Failed to start Neo4j: {stderr.decode('utf-8', errors='ignore').strip()}")
                return False

            # Check for internal Neo4j pid file fallback
            pid = proc.pid
            for root, _, files in os.walk(SANDBOX_ROOT):
                if "neo4j.pid" in files:
                    try:
                        with open(os.path.join(root, "neo4j.pid"), "r", encoding="utf-8") as f:
                            pid = int(f.read().strip())
                    except Exception:
                        pass

        write_pid_file(pid)
        log_success(f"Neo4j started successfully [PID: {pid}].")
        return True

    except Exception as e:
        log_error(f"Failed to execute start command: {e}")
        return False


def stop_service() -> bool:
    active_pid = get_running_pid()
    neo4j_cmd = find_neo4j_binary()

    log_info("Stopping Neo4j database instance...")

    if neo4j_cmd and os.path.exists(neo4j_cmd):
        try:
            subprocess.run([neo4j_cmd, "stop"], check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            pass

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
    log_success("Neo4j database instance stopped.")
    return True


def restart_service() -> bool:
    log_info("Restarting Neo4j database instance...")
    if stop_service():
        time.sleep(2)
        return start_service()
    return False


def status_service() -> bool:
    pid = get_running_pid()
    if pid:
        log_success(f"Neo4j is RUNNING [PID: {pid}]")
        return True
    log_warn("Neo4j is STOPPED")
    return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Neo4j Service Control")
    parser.add_argument("action", choices=["start", "stop", "restart", "status"], help="Action to execute")
    args = parser.parse_args()

    actions = {
        "start": start_service,
        "stop": stop_service,
        "restart": restart_service,
        "status": status_service,
    }

    success = actions[args.action]()
    sys.exit(0 if success else 1)
