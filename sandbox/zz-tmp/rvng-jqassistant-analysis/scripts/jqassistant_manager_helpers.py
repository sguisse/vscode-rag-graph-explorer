#!/usr/bin/env python3
"""
jqassistant_manager_helpers.py — helper routines extracted from jqassistant_manager.py
"""

import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from _common import (
    isPortOpen,
    wait_for_port_up,
    wait_for_http_up,
    wait_for_port_down,
    wait_for_http_down,
    find_and_kill_port,
    find_repo_root,
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


# Resolve repository and script paths locally (safe when imported after env is loaded)
_REPO_ROOT = find_repo_root(Path.cwd())
_SCRIPTS_DIR = Path(__file__).parent.resolve()


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, str(default)))
    except Exception:
        return default


# Environment-derived defaults
JQA_BOLT_PORT = _env_int("JQA_BOLT_PORT", 7688)
JQA_HTTP_PORT = _env_int("JQA_HTTP_PORT", 7777)
JQA_HOST = os.environ.get("JQA_HOST", "localhost")
JQA_URI = os.environ.get("JQA_URI", f"bolt://{JQA_HOST}:{JQA_BOLT_PORT}")
JQA_USER = os.environ.get("JQA_USER", "")
JQA_PASSWORD = os.environ.get("JQA_PASSWORD", "")
JQA_MVN_PARAMS = os.environ.get("JQA_MVN_PARAMS", "")
JQA_PROFILE = os.environ.get("JQA_MAVEN_PROFILE", "jqassistant")
JQA_MCP_PORT = _env_int("JQA_MCP_PORT", 8800)
JQA_MCP_LOG = os.environ.get("JQA_MCP_LOG", "/tmp/mcp-server.log")
JQA_MCP_PID_FILE = os.environ.get("JQA_MCP_PID_FILE", "/tmp/mcp-server.pid")
JQA_LOG = os.environ.get("JQA_SERVER_LOG", "/tmp/jqa-server.log")
JQA_PID_FILE = os.environ.get("JQA_SERVER_PID_FILE", "/tmp/jqa-server.pid")
JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL = os.environ.get("JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL", "models/all-MiniLM-L6-v2")
JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT = os.environ.get("JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT", "")
_JQA_PYTHON3_GRAPH_RAG_CMD_PATH = Path(os.environ.get("JQA_PYTHON3_GRAPH_RAG_CMD", ""))


def _run(cmd: str, cwd: Path | None = None) -> int:
    print(f"{GREEN}▶{RESET} {BOLD}{cmd}{RESET}")
    return subprocess.call(cmd, shell=True, cwd=cwd)


def _mcp_graph_state(py: Path) -> dict[str, int] | None:
    probe = """
import json
import sys
from neo4j import GraphDatabase

uri, user, password = sys.argv[1:4]
driver = GraphDatabase.driver(uri, auth=(user, password))
queries = {
    "project_count": "MATCH (p:Project) RETURN count(p) AS n",
    "source_file_count": "MATCH (sf:SourceFile) RETURN count(sf) AS n",
    "with_source_count": "MATCH ()-[r:WITH_SOURCE]->() RETURN count(r) AS n",
}
with driver.session() as session:
    payload = {name: session.run(query).single()["n"] for name, query in queries.items()}
print(json.dumps(payload))
driver.close()
"""
    try:
        result = subprocess.run(
            [str(py), "-c", probe, JQA_URI, JQA_USER, JQA_PASSWORD],
            capture_output=True,
            text=True,
            timeout=20,
        )
        if result.returncode != 0:
            return None
        return json.loads(result.stdout.strip() or "{}")
    except Exception:
        return None


def _ensure_graph_ready_for_mcp(py: Path) -> bool:
    state = _mcp_graph_state(py)
    if not state:
        print(f"  {YELLOW}⚠️  Could not inspect graph readiness for MCP{RESET} (continuing with legacy startup behavior)")
        return True

    detail = (
        f"Project={state.get('project_count', 0)}, "
        f"SourceFile={state.get('source_file_count', 0)}, "
        f"WITH_SOURCE={state.get('with_source_count', 0)}"
    )
    if state.get("project_count", 0) > 0 and state.get("source_file_count", 0) > 0 and state.get("with_source_count", 0) > 0:
        print(f"  {GREEN}✅  Graph is ready for MCP{RESET} ({detail})")
    else:
        print(f"  {YELLOW}⚠️  Graph is only partially prepared for MCP{RESET} ({detail})")
        print(
            "     Continuing with MCP startup like the legacy helper; source-aware tools may be limited until C3/C4 enrichment runs."
        )
    return True


def _ensure_neo4j() -> bool:
    if isPortOpen(JQA_BOLT_PORT):
        print(f"  {GREEN}✅  Neo4j already reachable on port {JQA_BOLT_PORT}{RESET}")
        return True
    print(f"  {YELLOW}⚠️   Neo4j not reachable — starting embedded server …{RESET}")
    return _start_neo4j_server()


def _probe_neo4j_transactions(py: Path) -> tuple[bool, str]:
    probe = """
import sys
from neo4j import GraphDatabase

uri, user, password = sys.argv[1:4]
driver = GraphDatabase.driver(uri, auth=(user, password))
try:
    driver.verify_connectivity()
    with driver.session() as session:
        value = session.run("RETURN 1 AS ok").single()["ok"]
    print(value)
finally:
    driver.close()
"""
    try:
        result = subprocess.run(
            [str(py), "-c", probe, JQA_URI, JQA_USER, JQA_PASSWORD],
            capture_output=True,
            text=True,
            timeout=20,
        )
    except Exception as exc:
        return False, f"probe execution failed: {exc}"

    if result.returncode == 0 and result.stdout.strip() == "1":
        return True, "transaction probe ok"

    detail = "\n".join(part.strip() for part in (result.stderr, result.stdout) if part.strip())
    return False, detail or "transaction probe failed"


def _restart_managed_neo4j() -> bool:
    print(f"  {YELLOW}♻️  Restarting managed embedded Neo4j server …{RESET}")
    find_and_kill_port(JQA_BOLT_PORT)
    find_and_kill_port(JQA_HTTP_PORT)

    wait_for_http_down(f"http://{JQA_HOST}:{JQA_HTTP_PORT}")
    wait_for_port_down(JQA_HOST, JQA_BOLT_PORT)

    return _start_neo4j_server()


def _ensure_neo4j_healthy(py: Path) -> bool:
    if not _ensure_neo4j():
        return False

    healthy, detail = _probe_neo4j_transactions(py)
    if healthy:
        print(f"  {GREEN}✅  Neo4j transaction probe succeeded{RESET}")
        return True

    print(f"  {YELLOW}⚠️  Neo4j transaction probe failed{RESET}: {detail}")
    critical = "TransactionStartFailed" in detail or "critical error" in detail.lower()
    if not critical:
        return False

    if not _restart_managed_neo4j():
        print(f"  {RED}❌  Neo4j is reachable but unhealthy. Please restart it, then retry.{RESET}")
        return False

    healthy, detail = _probe_neo4j_transactions(py)
    if healthy:
        print(f"  {GREEN}✅  Neo4j recovered after restart{RESET}")
        return True

    print(
        f"  {RED}❌  Neo4j is still unhealthy after restart attempt.{RESET}\n"
        f"     Details: {detail}\n"
        f"     Check log: {JQA_LOG}"
    )
    return False


def _start_neo4j_server() -> bool:
    pom = _REPO_ROOT / "pom.xml"
    print(f"{CYAN}▶ Starting embedded Neo4j server (Bolt: {JQA_BOLT_PORT}) …{RESET}")
    cmd = f"tail -f /dev/null | mvn -f '{pom}' " f"{JQA_MVN_PARAMS} jqassistant:server > {JQA_LOG} 2>&1"
    proc = subprocess.Popen(cmd, shell=True, stdin=subprocess.DEVNULL, start_new_session=True)
    Path(JQA_PID_FILE).write_text(str(proc.pid))

    port_open = wait_for_port_up(JQA_HOST, JQA_BOLT_PORT)
    if port_open:
        print(
            f"{GREEN}✅  Neo4j Bolt ready on port {JQA_BOLT_PORT} (PID {proc.pid}){RESET}",
            flush=True,
        )
    print(f"  Logs: {JQA_LOG}", flush=True)

    port_open = wait_for_http_up(f"http://{JQA_HOST}:{JQA_HTTP_PORT}", JQA_HTTP_PORT)
    if port_open:
        print(
            f"{GREEN}✅  Neo4j HTTP ready on port {JQA_HTTP_PORT} (PID {proc.pid}){RESET}",
            flush=True,
        )
    print(f"  Logs: {JQA_LOG}", flush=True)

    return port_open


def _apply_local_model_env(env=None, warn: bool = True) -> Path:
    if env is None:
        env = os.environ

    local_model = _REPO_ROOT / JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT / JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL
    if local_model.is_dir():
        env["SENTENCE_TRANSFORMER_MODEL"] = str(local_model)
        env["HF_HUB_OFFLINE"] = "1"
        env["TRANSFORMERS_OFFLINE"] = "1"
        env["HF_DATASETS_OFFLINE"] = "1"
    else:
        raise RuntimeError(
            f"❌ Local model directory {local_model} does not exist. Please ensure the model is downloaded and the path is correct.\nExpected local model directory: {local_model}"
        )
    return local_model


def _start_mcp_server() -> bool:
    grd = _REPO_ROOT / JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT
    py = _REPO_ROOT / _JQA_PYTHON3_GRAPH_RAG_CMD_PATH
    print(f"  {CYAN}▶ Starting MCP server (port {JQA_MCP_PORT}) …{RESET}")
    print(f"     Graph RAG tool path: {grd}")
    print(f"     Using Python       : {py}")

    result = subprocess.run([str(py), "-c", "import fastmcp"], capture_output=True)
    if result.returncode != 0:
        print(f"  {RED}❌  fastmcp not importable with {py}{RESET}")
        print(result.stderr.decode()[:1000])
        print(f"  → Run option C1 (create venv) first.")
        return False

    env = os.environ.copy()
    env["MCP_PORT"] = str(JQA_MCP_PORT)
    env["PROJECT_ROOT_PATH"] = str(_REPO_ROOT)
    model_location = _apply_local_model_env(env=env)
    print(f"     Using local model  : {model_location}")

    mcp_py = grd / "mcp_server.py"
    log_path = Path(JQA_MCP_LOG)
    pid_path = Path(JQA_MCP_PID_FILE)

    print(f"⏳ MCP server start in progress …")
    with open(log_path, "w") as log_fh:
        # Build explicit arg list to avoid shlex/quoting pitfalls from skill.env
        args = [
            str(py),
            str(mcp_py),
            "--port",
            str(JQA_MCP_PORT),
            "--uri",
            JQA_URI,
            "--user",
            JQA_USER,
            "--password",
            JQA_PASSWORD,
        ]
        proc = subprocess.Popen(
            args,
            cwd=str(grd),
            stdout=log_fh,
            stderr=log_fh,
            env=env,
            start_new_session=True,
        )
    pid_path.write_text(str(proc.pid))
    for _ in range(30):
        if proc.poll() is not None:
            tail = "(no log available)"
            try:
                tail = subprocess.run(
                    ["tail", "-n", "200", str(log_path)],
                    capture_output=True,
                    text=True,
                    timeout=2,
                ).stdout
            except Exception:
                tail = "(failed to read log)"
            print(f"  {RED}❌  MCP process exited unexpectedly (PID {proc.pid}). See logs:{RESET}\n{tail}")
            pid_path.unlink(missing_ok=True)
            return False

        if isPortOpen(JQA_MCP_PORT):
            print(f"  {GREEN}✅  MCP server ready on port {JQA_MCP_PORT} (PID {proc.pid}){RESET}")
            print(f"  Logs: {JQA_MCP_LOG}")
            return True
        time.sleep(1)

    tail = "(no log available)"
    try:
        tail = subprocess.run(
            ["tail", "-n", "200", str(log_path)],
            capture_output=True,
            text=True,
            timeout=2,
        ).stdout
    except Exception:
        tail = "(failed to read log)"

    print(f"  {RED}❌  MCP port {JQA_MCP_PORT} did not open in 30 s — check {JQA_MCP_LOG}{RESET}\nLast log lines:\n{tail}")
    return False


def _list_ports() -> None:
    entries = [
        ("Neo4j Bolt", JQA_BOLT_PORT),
        ("Neo4j HTTP", JQA_HTTP_PORT),
        ("MCP server", JQA_MCP_PORT),
    ]
    print(f"\n{BOLD}Server port status{RESET}\n")
    print(f"{'Service':<20} {'Port':<8} {'PID':<10} Status")
    print(f"{'-------':<20} {'----':<8} {'---':<10} ------")
    for svc, port in entries:
        status = f"{GREEN}✅  OPEN{RESET}" if isPortOpen(port) else f"{RED}❌  closed{RESET}"
        pid = "-"
        try:
            res = subprocess.run(
                ["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN", "-t"],
                capture_output=True,
                text=True,
                timeout=1,
            )
            pids = [p for p in res.stdout.splitlines() if p.strip()]
            pid = ",".join(pids) if pids else "-"
        except Exception:
            pid = "-"

        print(f"{svc:<20} {port:<8} {pid:<10} {status}")

    try:
        ports_pat = "|".join(str(p) for _, p in entries)
        result = subprocess.run(
            ["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"],
            capture_output=True,
            text=True,
        )
        lines = [l for l in result.stdout.splitlines() if "COMMAND" in l or re.search(rf":({ports_pat})\b", l)]
        if lines:
            print(f"{CYAN}\nActive listeners (lsof):{RESET}")
            print("\n".join(lines))
    except Exception:
        pass
    print()
