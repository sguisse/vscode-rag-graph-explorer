#!/usr/bin/env python3
"""
Start an embedded jQAssistant server, run scan+analysis and wait for readiness.
"""
import argparse
import os
import pathlib
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from _common import (
    build_clickable_console_url,
    find_and_kill_port,
    wait_for_port_down,
    wait_for_http_down,
    merge_cmd_str_params,
)

from jqassistant_manager import _start_neo4j_server
from _common import load_skill_env_vars


# ── Load skill.env ────────────────────────────────────────────────────────────
load_skill_env_vars()

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
_JQA_HOST = os.environ.get("JQA_HOST", "")
_HTTP_PORT = int(os.environ.get("JQA_HTTP_PORT", ""))
_BOLT_PORT = int(os.environ.get("JQA_BOLT_PORT", ""))
_MVN_PARAMS = os.environ.get("JQA_MVN_PARAMS", "toto")


def main():

    print(" ")
    print("-" * 100)
    print(f"--- {time.strftime('%c')} ---")
    print("🛑 Stop jQAssistant servers running at: http://%s:%d (Bolt port: %d)" % (_JQA_HOST, _HTTP_PORT, _BOLT_PORT))

    find_and_kill_port(_BOLT_PORT)
    find_and_kill_port(_HTTP_PORT)

    print(" ")
    print(f"🚀 Start jQAssistant Maven Build")

    # Prepare paths
    target_dir = _REPO_ROOT / "target"
    target_dir.mkdir(parents=True, exist_ok=True)
    log_file = target_dir / "jqassistant-neo4j-server.log"

    mvn_cmd = [
        "mvn",
        "clean",
        "install",
        "jqassistant:scan",
        "jqassistant:analyze",
        "jqassistant:server",
    ]

    mvn_cmd = merge_cmd_str_params(mvn_cmd, _MVN_PARAMS)

    print(mvn_cmd)
    print(" ")

    # Start mvn process and stream output to console and log file
    return_code = 1
    server_prompt_seen = False
    with open(log_file, "ab") as fh:
        proc = subprocess.Popen(
            mvn_cmd,
            cwd=str(_REPO_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )

        try:
            assert proc.stdout is not None
            out_stream = proc.stdout
            while True:
                chunk = out_stream.readline()
                if not chunk:
                    if proc.poll() is not None:
                        break
                    continue

                # write to log
                try:
                    fh.write(chunk)
                    fh.flush()
                except Exception:
                    pass

                # echo to console
                try:
                    sys.stdout.buffer.write(chunk)
                    sys.stdout.buffer.flush()
                except Exception:
                    print(chunk.decode(errors="replace"), end="")

                text = chunk.decode(errors="replace")
                if "Press <Enter> to finish" in text:
                    server_prompt_seen = True
                    print(
                        "\nDetected interactive Maven prompt — treating scan/analyze as successful and stopping the temporary Maven server process."
                    )
                    try:
                        proc.kill()
                    except Exception:
                        pass
                    break

        finally:
            try:
                proc.wait(timeout=5)
                return_code = proc.returncode
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
                return_code = proc.returncode if proc.returncode is not None else 1

    if server_prompt_seen:
        # We intentionally stop the temporary Maven `jqassistant:server`
        # process once it reaches its interactive prompt, then start the
        # embedded Neo4j server ourselves below. That path means scan/analyze
        # succeeded even if the killed Maven process exits non-zero.
        return_code = 0

    if return_code != 0:
        print("❌ jQAssistant scan/analyze failed — Neo4j server will not be started.")
        print(f"📖 Inspect the full Maven output in: {log_file}")
        sys.exit(return_code)

    print("✅ jQAssistant analysis complete.")
    print(" ")

    # Wait for the temporary Maven server to release the ports before starting our embedded Neo4j server
    print("⏳ Waiting for temporary Maven server to release ports...")
    wait_for_port_down(_JQA_HOST, _BOLT_PORT)
    wait_for_http_down(f"http://{_JQA_HOST}:{_HTTP_PORT}")
    print("🚀 Ports are now free. Starting embedded Neo4j server...")

    # Start servers and wait for them to be ready
    # call def _start_neo4j_server() -> bool:  from jqassistant_manager.py to start the server and wait for it to be ready
    _start_neo4j_server()

    print(" ")
    print("🌐 jQAssistant Neo4J server started.")
    # Build a clickable OSC 8 URL snippet if utility available
    lnk_url = f"http://{_JQA_HOST}:{_HTTP_PORT}?dbms=bolt://{_JQA_HOST}:{_BOLT_PORT}&preselectAuthMethod=NO_AUTH"
    clickable = build_clickable_console_url(lnk_url)
    print(f"\x1b[0m📖 You can access the jQAssistant Neo4J server at: {clickable}")
    INVISIBLE_CHAR = "\u200b"
    print(INVISIBLE_CHAR)


if __name__ == "__main__":
    main()
