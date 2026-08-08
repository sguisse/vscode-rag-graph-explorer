"""Thin Neo4j connectivity facade used by scripts that need to probe or query
the graph without bringing in the full graph-rag venv.

Two usage styles are supported:

1. **In-process** (when the ``neo4j`` package is importable in the current
   interpreter):

   .. code-block:: python

       with Neo4jClient(uri, user, password) as client:
           ok, msg = client.probe()
           rows = client.query("MATCH (n:Project) RETURN n.name AS name")

2. **Subprocess probe** (when neo4j is only available in a venv python):

   .. code-block:: python

       ok, msg = subprocess_probe(py, uri, user, password)

The subprocess variant replaces the three copy/paste inline-Python snippets
that previously lived in ``jqassistant_manager.py``.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# In-process client (used when neo4j driver is importable)
# ---------------------------------------------------------------------------


class Neo4jClient:
    """Context-manager wrapper around the neo4j driver.

    Raises ``ImportError`` on construction if the ``neo4j`` package is absent.
    """

    def __init__(self, uri: str, user: str = "", password: str = "") -> None:
        try:
            from neo4j import GraphDatabase  # type: ignore
        except ImportError as exc:
            raise ImportError(
                "neo4j Python driver not installed; run: pip install neo4j"
            ) from exc
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    # ------------------------------------------------------------------ context
    def __enter__(self) -> "Neo4jClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def close(self) -> None:
        try:
            self._driver.close()
        except Exception:
            pass

    # ------------------------------------------------------------------ helpers
    def probe(self) -> tuple[bool, str]:
        """Verify connectivity and that the DB can start a read transaction."""
        try:
            self._driver.verify_connectivity()
            with self._driver.session() as session:
                val = session.run("RETURN 1 AS ok").single()["ok"]
            if val == 1:
                return True, "transaction probe ok"
            return False, f"unexpected probe value: {val}"
        except Exception as exc:
            return False, str(exc)

    def query(self, cypher: str, **params: Any) -> list[dict]:
        """Run a read query and return rows as dicts."""
        with self._driver.session() as session:
            result = session.run(cypher, **params)
            return [dict(record) for record in result]

    def graph_state(self, queries: dict[str, str]) -> dict[str, int]:
        """Run a dict of ``{name: cypher_count_query}`` and return ``{name: n}``."""
        with self._driver.session() as session:
            return {
                name: session.run(cypher).single()["n"]
                for name, cypher in queries.items()
            }


# ---------------------------------------------------------------------------
# Subprocess probe (used when neo4j lives in a separate venv)
# ---------------------------------------------------------------------------

_PROBE_SCRIPT = """
import json
import sys
from neo4j import GraphDatabase

uri, user, password = sys.argv[1], sys.argv[2], sys.argv[3]
driver = GraphDatabase.driver(uri, auth=(user, password))
try:
    driver.verify_connectivity()
    with driver.session() as session:
        value = session.run("RETURN 1 AS ok").single()["ok"]
    print(value)
finally:
    driver.close()
"""

_STATE_SCRIPT = """
import json
import sys
from neo4j import GraphDatabase

uri, user, password = sys.argv[1], sys.argv[2], sys.argv[3]
queries = json.loads(sys.argv[4])
driver = GraphDatabase.driver(uri, auth=(user, password))
with driver.session() as session:
    payload = {name: session.run(query).single()["n"] for name, query in queries.items()}
print(json.dumps(payload))
driver.close()
"""

_DEFAULT_STATE_QUERIES = {
    "project_count": "MATCH (p:Project) RETURN count(p) AS n",
    "source_file_count": "MATCH (sf:SourceFile) RETURN count(sf) AS n",
    "with_source_count": "MATCH ()-[r:WITH_SOURCE]->() RETURN count(r) AS n",
}


def subprocess_probe(
    python: Path,
    uri: str,
    user: str,
    password: str,
    *,
    timeout: int = 20,
) -> tuple[bool, str]:
    """Run the connectivity probe in a subprocess using *python*.

    Replaces the three ``subprocess.run([py, '-c', probe_script, ...])``
    copy/paste blocks that were previously in ``jqassistant_manager.py``.
    """
    try:
        result = subprocess.run(
            [str(python), "-c", _PROBE_SCRIPT, uri, user, password],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except Exception as exc:
        return False, f"probe execution failed: {exc}"

    if result.returncode == 0 and result.stdout.strip() == "1":
        return True, "transaction probe ok"

    detail = "\n".join(p.strip() for p in (result.stderr, result.stdout) if p.strip())
    return False, detail or "transaction probe failed"


def subprocess_graph_state(
    python: Path,
    uri: str,
    user: str,
    password: str,
    queries: dict[str, str] | None = None,
    *,
    timeout: int = 20,
) -> dict[str, int] | None:
    """Fetch graph state counts via a subprocess (used when neo4j is in a venv)."""
    q = queries or _DEFAULT_STATE_QUERIES
    try:
        result = subprocess.run(
            [str(python), "-c", _STATE_SCRIPT, uri, user, password, json.dumps(q)],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            return None
        return json.loads(result.stdout.strip() or "{}")
    except Exception:
        return None
