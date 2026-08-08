#!/usr/bin/env python3
"""Network / URL utilities for console output (clickable OSC 8 links)
and small helpers related to network/process management used by the
rvng-jqassistant-analysis scripts.

This collects utilities that previously lived directly in hyphenated
scripts so they can be tested and reused from the `_common` package.
"""

from __future__ import annotations

import os
import signal
import subprocess
import socket
import time
import urllib.request
from typing import Final

# ── ANSI colours — delegated to _common ──────────────────────────────────────
from _common import (  # noqa: E402
    GREEN,
    YELLOW,
    RED,
    CYAN,
    MAGENTA,
    WHITE,
    BOLD,
    DIM,
    RESET,
    BG_GRAY,
)

LNK_START: Final[str] = "\033]8;;"
LNK_MID: Final[str] = "\033\\"
LNK_END: Final[str] = "\033]8;;\033\\"
COLOR_CYAN: Final[str] = "\033[36m"
COLOR_RESET: Final[str] = "\033[0m"


def build_clickable_console_url(lnk_url: str) -> str:
    """Return an OSC 8 clickable URL snippet for console output.

    Example result:
        \033]8;;http://...\033\\\033[36m👉http://...👈\033[0m\033]8;;\033\\
    """
    return f"{LNK_START}{lnk_url}{LNK_MID}{COLOR_CYAN}👉{lnk_url}👈{COLOR_RESET}{LNK_END}"


def isPortOpen(port: int) -> bool:
    """Return True if a TCP service is listening on localhost at the given port.

    Uses a short timeout so callers can poll without blocking too long.
    """
    import socket

    try:
        with socket.create_connection(("localhost", port), timeout=1):
            return True
    except Exception:
        return False


def find_and_kill_port(port: int) -> bool:
    """Find PIDs listening on the given TCP port and kill them.

    The implementation uses ``lsof`` to detect listening processes. On
    platforms without ``lsof`` the function is a no-op.
    """
    try:
        out = subprocess.check_output(
            [
                "lsof",
                "-nP",
                f"-iTCP:{port}",
                "-sTCP:LISTEN",
                "-t",
            ]
        )
        pids = [int(x) for x in out.decode().split() if x.strip()]
    except subprocess.CalledProcessError:
        pids = []
    except FileNotFoundError:
        # lsof not available on this platform
        pids = []

    if not pids:
        print(f"⏭️  Port {port} is already free.")
        return True

    for pid in pids:
        try:
            os.kill(pid, signal.SIGKILL)
            wait_for_port_down("localhost", port)
            print(f"✅  PORT: {port} / PID: {pid} Stopped !")
        except Exception as e:
            print(f"⚠️  Failed to kill PID {pid} on PORT {port}: {e}")
            return False

    return True


# --------------------------------------------------------------------------------


def wait_for_port_up(
    host: str,
    port: int,
    interval: float = 2.0,
    max_second_wait: float = 15.0,
) -> bool:
    """Block until a TCP port is accepting connections.

    Prints a simple status line and polls until a connection can be made.
    """
    print(f"⏳ Waiting for server to start on {host}:{port} (max {max_second_wait}s)...")
    start = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=2):
                return True
        except Exception:
            elapsed = time.time() - start
            if elapsed >= max_second_wait:
                print(f"{RED}❌ Timeout after {max_second_wait}s waiting for server to start on {host}:{port}{RESET}")
                return False
            time.sleep(interval)


def wait_for_port_down(
    host: str,
    port: int,
    interval: float = 2.0,
    max_second_wait: float = 15.0,
) -> bool:
    """Block until a TCP port stops accepting connections.

    The function polls the given host:port and returns once a connection
    attempt raises an exception (indicating the service has stopped).
    """
    print(f"⏳ Waiting for server to stop on {host}:{port} (max {max_second_wait}s)...")
    start = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=2):
                elapsed = time.time() - start
                if elapsed >= max_second_wait:
                    print(f"{RED}❌ Timeout after {max_second_wait}s waiting for server to stop on {host}:{port}{RESET}")
                    return False
                time.sleep(interval)
        except Exception:
            return True


# --------------------------------------------------------------------------------


def wait_for_http_up(url: str, interval: float = 2.0, max_second_wait: float = 15.0) -> bool:
    """Block until an HTTP(S) URL responds with a successful status code.

    The function repeatedly attempts to open the URL and returns once a
    response with status < 400 is received.
    """
    print(f"⏳ Waiting for HTTP server to start on {url} (max {max_second_wait}s)...")
    start = time.time()
    while True:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status < 400:
                    return True
        except Exception:
            pass
        elapsed = time.time() - start
        if elapsed >= max_second_wait:
            print(f"{RED}❌ Timeout after {max_second_wait}s waiting for HTTP server to start on {url}{RESET}")
            return False
        time.sleep(interval)


def wait_for_http_down(url: str, interval: float = 2.0, max_second_wait: float = 15.0) -> bool:
    """Block until an HTTP(S) URL becomes unreachable or returns an error status.

    The function repeatedly attempts to open the URL and returns when an
    exception is raised (connection refused/timeout) or when a response with
    status >= 400 is returned.
    """
    print(f"⏳ Waiting for HTTP server to stop on {url} (max {max_second_wait}s)...")
    start = time.time()
    while True:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status >= 400:
                    return True
                elapsed = time.time() - start
                if elapsed >= max_second_wait:
                    print(f"{RED}❌ Timeout after {max_second_wait}s waiting for HTTP server to stop on {url}{RESET}")
                    return False
                time.sleep(interval)
        except Exception:
            return True
