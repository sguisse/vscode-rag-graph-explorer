#!/usr/bin/env python3
"""
jqassistant_manager.py — Central manager for jqassistant + graph-rag operations
=================================================================================
Groups all operations by concern:

  GROUP A — install / setup   (A1-A5)
  GROUP B — jqassistant Maven (B1-B6)
  GROUP C — graph-rag         (C1-C8)
  GROUP D — tests             (D1-D2)

Configuration loaded from the skill.env file.

Usage
-----
  Interactive:  python3 jqassistant_manager.py
  Direct:       python3 jqassistant_manager.py --option A1
    (Group E debug helpers removed)
"""

import argparse
import json
import os
import re
import shlex
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path
import signal
from typing import Any
from _common import (
    build_clickable_console_url,
    isPortOpen,
    wait_for_port_up,
    wait_for_http_up,
    find_repo_root,
)

from _common import (
    find_and_kill_port,
    wait_for_port_up,
    wait_for_http_up,
    wait_for_port_down,
    wait_for_http_down,
)

from _common import load_skill_env_vars

# ── ANSI colours from _common ──────────────────────────────────────
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

# ── Load skill.env ────────────────────────────────────────────────────────────
load_skill_env_vars()

# ── Paths ─────────────────────────────────────────────────────────────────────
JQA_SKILL_PATH_VS_ROOT = os.environ.get("JQA_SKILL_PATH_VS_ROOT", "")
JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT = os.environ.get("JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT", "")
_REPO_ROOT = find_repo_root(
    Path.cwd(),
)
_SCRIPTS_DIR = Path(__file__).parent.resolve()
_JQA_SKILL_PATH = _REPO_ROOT / JQA_SKILL_PATH_VS_ROOT
_JQA_GRAPH_RAG_TOOL_PATH = _REPO_ROOT / JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT

# ── Config from env ───────────────────────────────────────────────────────────
JQA_HOST = os.environ.get("JQA_HOST", "localhost")
JQA_HTTP_PORT = int(os.environ.get("JQA_HTTP_PORT", "7777"))
JQA_BOLT_PORT = int(os.environ.get("JQA_BOLT_PORT", "7688"))
JQA_URI = os.environ.get("JQA_URI", f"bolt://localhost:{JQA_BOLT_PORT}")
JQA_USER = os.environ.get("JQA_USER", "")
JQA_PASSWORD = os.environ.get("JQA_PASSWORD", "")
JQA_MVN_PARAMS = os.environ.get("JQA_MVN_PARAMS", "")
JQA_PROFILE = os.environ.get("JQA_MAVEN_PROFILE", "jqassistant")
JQA_MCP_HOST = os.environ.get("JQA_MCP_HOST", "localhost")
JQA_MCP_PORT = int(os.environ.get("JQA_MCP_PORT", "8800"))
JQA_MCP_LOG = os.environ.get("JQA_MCP_LOG", "/tmp/mcp-server.log")
JQA_MCP_PID_FILE = os.environ.get("JQA_MCP_PID_FILE", "/tmp/mcp-server.pid")
JQA_LOG = os.environ.get("JQA_SERVER_LOG", "/tmp/jqa-server.log")
JQA_PID_FILE = os.environ.get("JQA_SERVER_PID_FILE", "/tmp/jqa-server.pid")
JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL = os.environ.get("JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL", "models/all-MiniLM-L6-v2")
JQA_SENTENCE_TRANSFORMER_HF_REPO = os.environ.get("JQA_SENTENCE_TRANSFORMER_HF_REPO", "sentence-transformers/all-MiniLM-L6-v2")
JQA_OLLAMA_MODEL = os.environ.get("JQA_OLLAMA_MODEL", "deepseek-coder:6.7b")
JQA_COPILOT_MODEL = os.environ.get("JQA_COPILOT_MODEL", "gpt-5-mini")
JQA_COPILOT_MODEL_EFFORT = os.environ.get("JQA_COPILOT_MODEL_EFFORT", "medium")

# jqassistant helper-scripts python (stdlib-only: installs, verify, generate_mermaid)
_JQA_PYTHON3_JQASSISTANT_CMD_PATH = Path(os.environ.get("JQA_PYTHON3_JQASSISTANT_CMD", ""))
JQA_PYTHON3_JQASSISTANT_CREATOR_VERSION = os.environ.get("JQA_PYTHON3_JQASSISTANT_CREATOR_VERSION", "python3.12")

# Graph-RAG venv python (neo4j, sentence-transformers, fastmcp, tiktoken, tree-sitter …)
_JQA_PYTHON3_GRAPH_RAG_CMD_PATH = Path(os.environ.get("JQA_PYTHON3_GRAPH_RAG_CMD", ""))


def _neo4j_params_cli() -> str:
    return " ".join(shlex.quote(part) for part in ["--uri", JQA_URI, "--user", JQA_USER, "--password", JQA_PASSWORD])


# ── Helpers (moved to jqassistant_manager_helpers.py) ─────────────────────────
from jqassistant_manager_helpers import (
    _run,
    _mcp_graph_state,
    _ensure_graph_ready_for_mcp,
    _ensure_neo4j,
    _probe_neo4j_transactions,
    _restart_managed_neo4j,
    _ensure_neo4j_healthy,
    _start_neo4j_server,
    _apply_local_model_env,
    _start_mcp_server,
    _list_ports,
)


# ── Menu  ─────────────────────────────────────────────────────────────────
def _menu_rows():
    """Return list of (id, label, notes, color_code) tuples."""
    G = GREEN
    Y = YELLOW
    M = MAGENTA
    R = RED
    C = CYAN
    W = ""
    return [
        # ── GROUP A : install / setup ────────────────────────────────────────
        ("──", "GROUP A — install / setup", "", DIM),
        (
            "A1",
            "📦  Install jqassistant",
            "Initialise project with jQAssistant (include graph-RAG)",
            Y,
        ),
        (
            "A2",
            "🩺  Verify jqassistant install",
            "Check jqassistant items configuration (include graph-RAG)",
            C,
        ),
        (
            "A3",
            "🧹  Clean jqassistant",
            "clean all jqassistant installed stuff (include graph-rag)",
            R,
        ),
        # ── GROUP B : jqassistant ────────────────────────────────────────────
        ("──", "GROUP B — jqassistant (Maven)", "", DIM),
        (
            "B1",
            "🔬  jqassistant scan + analyze + server",
            # TODO: add options configurable via 'ai-agent-rev-eng-factory/rev-eng-factory/src/.github/skills/rvng-jqassistant-analysis/scripts/config/skill.env' to run mvn with others parameters like "-Pjqassistant,it" , "-DskipTests", "-Djqassistant.skipStore", etc.
            "mvn clean install -Pjqassistant scan / analyze / server",
            C,
        ),
        ("B2", f"📋  List active server ports", "List state of Neo4J + MCP", M),
        (
            "B3",
            "▶  Start embedded Neo4j server",
            f"Http {JQA_HTTP_PORT} / Bolt {JQA_BOLT_PORT}, log \u2192 {JQA_LOG}",
            G,
        ),
        (
            "B4",
            "🛑  Stop Neo4j servers (HTTP / BOLT)",
            "Stop embedded jqassistant server & any neo4j processes",
            R,
        ),
        # ── GROUP C : graph-rag ───────────────────────────────────────────────
        # TODO : add an option in C1 to call directly jacoco_importer.py to refresh JaCoCo data in the graph (instead of going through a full mvn scan + analyze)
        ("──", "GROUP C — graph-rag (enrichment / LLM / MCP)", "", DIM),
        (
            "C1",
            "✨  Enrichment + summaries (fake LLM)",
            "main.py --generate-summary --llm-api fake",
            W,
        ),
        ("C2", "✨  Enrichment + summaries (CLI: Ollama)", f"LLM_CLI_CMD=ollama model='{JQA_OLLAMA_MODEL}'", G),
        (
            "C3",
            "✨  Enrichment + summaries (CLI: Gemini)",
            "LLM_CLI_CMD=gemini",
            G,
        ),
        (
            "C4",
            "✨  Enrichment + summaries (CLI: Copilot)",
            f"LLM_CLI_CMD=copilot --model '{JQA_COPILOT_MODEL}' --effort '{JQA_COPILOT_MODEL_EFFORT}'",
            G,
        ),
        ("C5", "🔍  Check graph — All", "check_graph.py --mode all", Y),
        ("C6", "🔍  Check graph — Java analysis", "check_graph.py --mode java", Y),
        ("C7", "🔍  Check graph — Config/schema", "check_graph.py --mode config", Y),
        (
            "C8",
            "▶  Start MCP server (background)",
            f"port {JQA_MCP_PORT}, log \u2192 {JQA_MCP_LOG}",
            M,
        ),
        ("C9", "🛑  Stop MCP server", "kill MCP server PID file or process", R),
        # ── GROUP D : tests ───────────────────────────────────────────────
        ("──", "GROUP D — Manual utility tests", "", DIM),
        (
            "D1",
            "Test Python env installation in Skill scripts",
            ".github/skills/rvng-jqassistant-analysis/scripts",
            Y,
        ),
        (
            "D2",
            "Test Python env installation in Graph-RAG tool scripts",
            ".github/skills/rvng-jqassistant-analysis/tool-graph-rag",
            C,
        ),
        # ── visual separator (full-width gray) ─────────────────────────────────
        ("──", "──", "──", DIM),
        # ── Exit ──────────────────────────────────────────────────────────────
        ("00/Q", "Exit", "", R),
    ]


import re
import unicodedata


def _print_menu() -> None:
    C1, C2, C3 = 4, 56, 62  # I increased C2 slightly to give the emojis breathing room
    sep = f"+{'-'*(C1+2)}+{'-'*(C2+2)}+{'-'*(C3+2)}+"
    h1, h2, h3 = f"{'No':<{C1}}", f"{'Action':<{C2}}", f"{'Notes':<{C3}}"
    title = "🧭 Welcome to the jqassistant manager!"
    print(
        f"\n{BOLD}{CYAN}┌"
        + "─" * ((C1 + C2 + C3 + 6 - len(title)) // 2)
        + f" {title} "
        + "─" * ((C1 + C2 + C3 + 6 - len(title)) // 2)
        + f"┐{RESET}"
    )

    print(f"{BOLD}{sep}{RESET}")
    print(f"| {BOLD}{h1}{RESET} | {BOLD}{h2}{RESET} | {BOLD}{h3}{RESET} |")
    print(f"{BOLD}{sep}{RESET}")

    # Helper to calculate visual string width (handling double-width emojis)
    def _visual_width(s: str) -> int:
        plain_str = re.sub(r"\033\[[0-9;]*m", "", s)
        width = 0
        for char in plain_str:
            # 'W' (Wide) or 'F' (Fullwidth) usually take up 2 terminal columns
            if unicodedata.east_asian_width(char) in ('W', 'F'):
                width += 2
            else:
                width += 1
        return width

    for idx, (no, title, notes, color) in enumerate(_menu_rows()):
        p1 = f"{no:<{C1}}"

        # Calculate padding based on visual width, not len()
        vis_width = _visual_width(title)
        p2_pad = " " * max(0, C2 - vis_width)

        p3 = f"{notes:<{C3}}"

        if no == "──":
            # Section header row
            row = f"| {p1} | {title}{p2_pad} | {p3} |"
            print(f"{BG_GRAY}{WHITE}{BOLD}{row}{RESET}")
        else:
            alt = WHITE if (idx % 2 == 0) else CYAN
            row_color = color if color else alt
            print(f"{row_color}| {p1} | {title}{p2_pad} | {p3} |{RESET}")

    print(f"{BOLD}{sep}{RESET}\n")

    display_server_status_info()


def display_server_status_info() -> None:
    neo_status = "✅" if isPortOpen(JQA_BOLT_PORT) else "❌"
    neo_http_status = "✅" if isPortOpen(JQA_HTTP_PORT) else "❌"
    mcp_status = "✅" if isPortOpen(JQA_MCP_PORT) else "❌"
    print(
        f"{WHITE}{BOLD}Servers Status:{RESET} {neo_status} Neo4j Bolt ({JQA_BOLT_PORT}) -- {neo_http_status} Neo4j Http ({JQA_HTTP_PORT}) -- {mcp_status} MCP server ({JQA_MCP_PORT})"
    )
    lnk_url = f"http://{JQA_HOST}:{JQA_HTTP_PORT}/?dbms=bolt://{JQA_HOST}:{JQA_BOLT_PORT}&preselectAuthMethod=NO_AUTH"
    clickable = build_clickable_console_url(lnk_url)
    print(f"{BOLD}Neo4j url: {clickable}\n")


def _valid_menu_options() -> list[str]:
    """Return a list of valid option codes (excluding separators and exit)."""
    rows = _menu_rows()
    opts = [no for (no, *_rest) in rows if no not in ("──", "00/Q")]
    return opts


def _expand_selection(token: str) -> list[str]:
    """Expand a selection token into a list of option codes.

    Supported forms:
      - Exact code: "B1"
      - Multiple via range: "B1-B4" (same letter prefix required)
      - Special: "ALL" (expand to all options)
    Unknown or invalid tokens are returned as-is (so _do() will report unknown).
    """
    token = token.strip().upper()
    if not token:
        return []
    valid = set(_valid_menu_options())
    if token == "ALL":
        return sorted(valid)

    # Range: e.g. B1-B4
    if "-" in token:
        left, right = token.split("-", 1)
        m1 = re.match(r"^([A-Z]+)(\d+)$", left)
        m2 = re.match(r"^([A-Z]+)?(\d+)$", right)
        if m1 and m2:
            p1, n1 = m1.group(1), int(m1.group(2))
            p2 = m2.group(1) or p1
            n2 = int(m2.group(2))
            if p1 != p2:
                # prefixes differ — fallback to literal tokens if present
                candidates = [left, right]
            else:
                if n1 <= n2:
                    nums = range(n1, n2 + 1)
                else:
                    nums = range(n2, n1 + 1)
                candidates = [f"{p1}{i}" for i in nums]
            return [c for c in candidates if c in valid]

    # Single token fallback — return if valid else as-is
    return [token] if token in valid else [token]


# ── Action dispatch ───────────────────────────────────────────────────────────


def _do(opt: str) -> None:
    # Support being called with a compound selection (defensive): split and dispatch
    if re.search(r"[\s,;]+", opt):
        parts = [p for p in re.split(r"[\s,;]+", opt) if p]
        for p in parts:
            _do(p)
        return

    opt = opt.upper().strip()
    py_gpr = _JQA_PYTHON3_GRAPH_RAG_CMD_PATH  # graph-RAG venv (neo4j, fastmcp, tree-sitter …)
    py_jqa = _JQA_PYTHON3_JQASSISTANT_CMD_PATH  # jqassistant helper venv (stdlib-only scripts)
    grd = Path(JQA_GRAPH_RAG_TOOL_PATH_VS_ROOT)
    # Propagate project root so graph_basic_normalizer.py can find src/main/java
    # even when main.py is run with cwd=grd (the git-clone directory).
    if "PROJECT_ROOT" not in os.environ:
        os.environ["PROJECT_ROOT"] = str(_REPO_ROOT)

    # ── GROUP A : install ─────────────────────────────────────────────────────
    if opt == "A1":
        _handle_action_a1(py_jqa, _REPO_ROOT)

    elif opt == "A2":
        _handle_action_a2(py_jqa, _REPO_ROOT)

    elif opt == "A3":
        _handle_action_a3(py_jqa, _REPO_ROOT)

    elif opt == "B1":
        _handle_action_b1(py_jqa, _REPO_ROOT)

    elif opt == "B2":
        _handle_action_b2()

    elif opt == "B3":
        _handle_action_b3()

    elif opt == "B4":
        _handle_action_b4()

    elif opt == "C1":
        _handle_action_c1(py_gpr, grd, _REPO_ROOT)

    elif opt == "C2":
        _handle_action_c2(py_gpr, grd, _REPO_ROOT)

    elif opt == "C3":
        _handle_action_c3(py_gpr, grd, _REPO_ROOT)

    elif opt == "C4":
        _handle_action_c4(py_gpr, grd, _REPO_ROOT)

    elif opt == "C5":
        _handle_action_c5(py_gpr)

    elif opt == "C6":
        _handle_action_c6(py_gpr)

    elif opt == "C7":
        _handle_action_c7(py_gpr)

    elif opt == "C8":
        _handle_action_c8(py_gpr)

    elif opt == "C9":
        _handle_action_c9()

    elif opt == "D1":
        _handle_action_d1(py_jqa, _REPO_ROOT)

    elif opt == "D2":
        _handle_action_d2(py_jqa, _REPO_ROOT)

    # Group E options removed

    elif opt in ("0", "00", "Q", "QUIT"):
        print(f"{RED}Exiting …{RESET} 👋")
        sys.exit(0)

    else:
        print(f"{RED}Unknown option: {opt}{RESET}  (try A1-A3, B1-B4, C1-C7, D1-D2, 00/Q=quit)")


# ── Actions ─────────────────────────────────────────────────────────────────
# GROUP A — install / setup


def _handle_action_a1(py_jqa: Path, repo: Path) -> None:
    print(f"Running jqassistant_install.py with Python: {py_jqa.parents[3] / 'jqassistant_install.py'} …")
    _run(f"'python3' '{py_jqa.parents[3] / _SCRIPTS_DIR / 'jqassistant_install.py'}' --root '{_REPO_ROOT}'")


def _handle_action_a2(py_jqa: Path, repo: Path) -> None:
    _run(f"'python3' '{_SCRIPTS_DIR}/jqassistant_verify.py' --root '{_REPO_ROOT}'")


def _handle_action_a3(py_jqa: Path, repo: Path) -> None:
    _run(f"'python3' '{_SCRIPTS_DIR}/jqassistant_uninstall.py' --root '{_REPO_ROOT}'")


# ─────────────────────────────────────
# GROUP B — jqassistant Maven + Neo4j lifecycle


def _handle_action_b1(py_jqa: Path, repo: Path) -> None:
    _run(
        f"'{py_jqa}' '{_SCRIPTS_DIR}/jqassistant_run_scan_analysis.py' --root '{_REPO_ROOT}' --http-port {JQA_HTTP_PORT} --bolt-port {JQA_BOLT_PORT}"
    )


def _handle_action_b2() -> None:
    _list_ports()


def _handle_action_b3() -> None:
    _start_neo4j_server()


def _handle_action_b4() -> None:
    find_and_kill_port(JQA_BOLT_PORT)
    find_and_kill_port(JQA_HTTP_PORT)

    wait_for_http_down(f"http://{JQA_HOST}:{JQA_HTTP_PORT}")
    stopped = wait_for_port_down(JQA_HOST, JQA_BOLT_PORT)

    if not stopped:
        print(f"  {YELLOW}If Neo4j keeps running, inspect processes with: lsof -iTCP -sTCP:LISTEN -P -n{RESET}")


# ─────────────────────────────────────
# GROUP C — graph-rag enrichment + MCP lifecycle


def _handle_action_c1(py: Path, grd: Path, repo: Path) -> None:
    if not _ensure_neo4j_healthy(py):
        return
    _apply_local_model_env()
    _run(
        f"'{_REPO_ROOT / py}' main.py --generate-summary --llm-api fake --repo-root '' {_neo4j_params_cli()}",
        cwd=grd,
    )


def _handle_action_c2(py: Path, grd: Path, repo: Path) -> None:
    if not _ensure_neo4j_healthy(py):
        return
    _apply_local_model_env()  # always force absolute path + offline guards

    _run(
        f"'{_REPO_ROOT / py}' main.py --generate-summary --llm-api ollama --repo-root '' {_neo4j_params_cli()}",
        cwd=grd,
    )


def _handle_action_c3(py: Path, grd: Path, repo: Path) -> None:
    if not _ensure_neo4j_healthy(py):
        return
    _apply_local_model_env()  # always force absolute path + offline guards

    ssl_cert = subprocess.run([str(_REPO_ROOT / py), "-m", "certifi"], capture_output=True, text=True).stdout.strip()
    if ssl_cert:
        os.environ["SSL_CERT_FILE"] = ssl_cert
        os.environ["REQUESTS_CA_BUNDLE"] = ssl_cert

    os.environ.setdefault("JQA_LLM_CLI_CMD", "gemini")

    _run(
        f"'{_REPO_ROOT / py}' main.py --generate-summary --llm-api gemini --repo-root '' {_neo4j_params_cli()}",
        cwd=grd,
    )


def _handle_action_c4(py: Path, grd: Path, repo: Path) -> None:
    if not _ensure_neo4j_healthy(py):
        return
    _apply_local_model_env()  # always force absolute path + offline guards
    os.environ.setdefault("JQA_LLM_CLI_CMD", "copilot")
    os.environ.setdefault("JQA_LLM_CLI_PARAMS", f"--model {JQA_COPILOT_MODEL} --effort {JQA_COPILOT_MODEL_EFFORT}")
    _run(
        f"'{_REPO_ROOT / py}' main.py --generate-summary --llm-api cli --repo-root '' {_neo4j_params_cli()}",
        cwd=grd,
    )


def _handle_action_c5(py: Path) -> None:
    print(f"Running for project: {os.environ['PROJECT_NAME']} …")
    _ensure_neo4j()
    _run(f"'{py}' '{_SCRIPTS_DIR}/check_graph.py' --mode all --project_name '{os.environ["PROJECT_NAME"]}' {_neo4j_params_cli()}")


def _handle_action_c6(py: Path) -> None:
    _ensure_neo4j()
    _run(
        f"'{py}' '{_SCRIPTS_DIR}/check_graph.py' --mode java --project_name '{os.environ["PROJECT_NAME"]}' {_neo4j_params_cli()}"
    )


def _handle_action_c7(py: Path) -> None:
    _ensure_neo4j()
    _run(
        f"'{py}' '{_SCRIPTS_DIR}/check_graph.py' --mode paths --project_name '{os.environ["PROJECT_NAME"]}' {_neo4j_params_cli()}"
    )


def _handle_action_c8(py: Path) -> None:
    if not _ensure_neo4j_healthy(py):
        return
    if not _ensure_graph_ready_for_mcp(py):
        return
    _start_mcp_server()


def _handle_action_c9() -> None:
    stopped = find_and_kill_port(JQA_MCP_PORT)

    if not stopped:
        print(f"  {YELLOW}If MCP keeps running, inspect {JQA_MCP_LOG} and running processes.{RESET}")


# ─────────────────────────────────────
# GROUP D — Test (control)


def _handle_action_d1(py_jqa: Path, repo: Path) -> None:

    cmd_parts = [
        f"echo '------------'",
        "echo '1. --> _SCRIPTS_DIR'",
        f"echo '{str(_SCRIPTS_DIR)}'",
        f"cd '{str(_SCRIPTS_DIR)}'",
        f"echo '2. --> After cd in'",
        f"echo '{_SCRIPTS_DIR}'",
        "pwd",
        f"echo '3. --> 🚀 Running py_venv_install.py with'",
        f"echo 'py_prj_root = {_SCRIPTS_DIR}'",
        f"echo '------------'",
        f"python3 -m _common.py_venv_install --py_prj_root '{str(_SCRIPTS_DIR)}'",
    ]
    cmd = " & ".join(cmd_parts)
    _run(cmd, _SCRIPTS_DIR)


def _handle_action_d2(py_jqa: Path, repo: Path) -> None:
    cmd_parts = [
        f"echo '------------'",
        "echo '1. --> _SCRIPTS_DIR'",
        f"echo '{str(_SCRIPTS_DIR)}'",
        f"cd '{str(_SCRIPTS_DIR)}'",
        f"echo '2. --> After cd in'",
        f"echo '{_SCRIPTS_DIR}'",
        "pwd",
        f"echo '3. --> 🚀 Running py_venv_install.py with'",
        f"echo 'py_prj_root = {_JQA_GRAPH_RAG_TOOL_PATH}'",
        f"echo '------------'",
        f"python3 -m _common.py_venv_install --py_prj_root '{str(_JQA_GRAPH_RAG_TOOL_PATH)}'",
    ]
    cmd = " & ".join(cmd_parts)
    _run(cmd, _SCRIPTS_DIR)


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(
        description="Central manager for jqassistant + graph-rag operations.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--project_name",
        "-p",
        metavar="PROJECT_NAME",
        help="Specify the project name to search eventual mismatches paths.",
    )
    parser.add_argument(
        "--option",
        "-o",
        metavar="OPT",
        help="Run a specific option directly (e.g. A4, B9). Skips interactive menu.",
    )
    args = parser.parse_args()

    if args.project_name:
        os.environ["PROJECT_NAME"] = args.project_name
        print(f"ℹ️  Using PROJECT_NAME: {MAGENTA}{args.project_name}{RESET}")
    else:
        print(
            f"❌  No project name specified. Some graph-RAG operations may not work correctly without it. Use --project_name to set it."
        )
        return 1

    if args.option:
        # Allow chaining multiple options in --option (e.g. "B1 C4 A2" or "B1,C4,A2")
        opts = re.split(r"[\s,;]+", args.option.strip())
        for o in opts:
            if not o:
                continue
            _do(o)
    else:
        _print_menu()
        while True:
            try:
                sel = input("Select option(s) (A1-A3, B1-B4, C1-C9, D1-D2, 00/Q=quit): ").strip()
            except (KeyboardInterrupt, EOFError):
                print()
                sys.exit(0)
            if not sel:
                continue
            if sel.lower() in ("q", "quit", "00", "0"):
                print("Bye 👋")
                sys.exit(0)
            # Support multiple selections separated by spaces, commas or semicolons
            selections = [s for s in re.split(r"[\s,;]+", sel) if s]
            # Expand ranges (B1-B4) and special tokens like ALL
            expanded = []
            for s in selections:
                expanded.extend(_expand_selection(s))
            for s in expanded:
                _do(s)
            # Re-print menu after action so port indicators update
            _print_menu()

    return 0


if __name__ == "__main__":
    sys.exit(main())
