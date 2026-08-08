---
name: rev-code-jqassistant-graph-rag
description: >
  Query a jQAssistant + Neo4j knowledge graph using GitHub Copilot as the LLM.
  Use when you want to ask questions about the codebase architecture, discover
  call chains, explore packages/classes, find patterns, plan refactoring, or
  understand design decisions via natural language. Starts the Graph RAG MCP
  server locally so Copilot can call graph tools (get_graph_schema,
  execute_cypher_query, get_source_code_by_id, search_nodes_for_semantic_similarity).
  Replaces the ADK/DeepSeek agent with Copilot's selected LLM.
argument-hint: "Optional: Neo4j bolt URI (default bolt://localhost:7688)"
---

# jQAssistant Graph RAG — Copilot Skill

This skill wires the **rev-code-jqassistant-graph-rag MCP server** to **GitHub Copilot Chat**
so you can query the enriched code knowledge graph using Copilot's selected LLM
instead of DeepSeek/OpenAI ADK agents.

---

## When to invoke this skill

Use `/rev-code-jqassistant-graph-rag` when you want to:

- "What is the primary responsibility of the `assessment` package?"
- "Show me the call chain from `AssessmentController` to the database."
- "Which classes implement `AssessmentService`?"
- "How is user authentication handled in this project?"
- "Find all classes that depend on `NotificationService`."
- "Explain the architecture of the `infrastructure` layer."
- "What packages would be affected if I refactor `UserService`?"

---

## Prerequisites

Before using this skill, the following must be true:

1. **jQAssistant scan completed** — the Neo4j graph is populated.
   See [rev-code-jqassistant-user-guide.md](../rvng-jqassistant-analysis/references/rev-code-jqassistant-user-guide.md).
2. **Graph RAG enrichment run** — `main.py` has enriched the graph with source links and (optionally) LLM summaries.
   See [rev-code-jqassistant-graph-rag-user-guide.md](../rvng-jqassistant-analysis/references/rev-code-jqassistant-graph-rag-user-guide.md).
3. **MCP server running** — `mcp_server.py` is listening on `http://0.0.0.0:8800/mcp`.
4. **VS Code MCP configured** — `.vscode/mcp.json` points to the MCP server.

---

## Setup procedure (one-time)

### ⚡ Quick-start (recommended)

Run the automated installer to check and fix every prerequisite in one command:

```bash
# From the repository root
python3 .github/skills/rev-code-jqassistant-graph-rag/scripts/install-graph-rag.py \
  --neo4j-uri bolt://localhost:7688 \
  --neo4j-user "" \
  --neo4j-password ""
```

The installer calls `verify-graph-rag-configuration.py` first (see [§ Verification](#verification)), then fixes each failing check by calling the appropriate helper scripts. Use `--dry-run` to see what would be done without executing.

After the installer finishes, verify that all checks pass:

```bash
python3 .github/skills/rev-code-jqassistant-graph-rag/scripts/verify-graph-rag-configuration.py \
  --neo4j-uri bolt://localhost:7688 \
  --neo4j-user "" \
  --neo4j-password ""
```

This prints a human-readable table and a JSON object with one entry per check:

```
🔍  rev-code-jqassistant-graph-rag Configuration Verification
======================================================
  ✅  git_clone_exists       — git-clone directory is populated
  ✅  venv_installed         — venv exists and key packages installed
  ✅  vscode_mcp_json        — .vscode/mcp.json OK — server url: http://127.0.0.1:8800/mcp
  ✅  mcp_server_reachable   — MCP server reachable at http://127.0.0.1:8800
  ✅  neo4j_reachable        — Neo4j bolt connection OK at bolt://localhost:7688
  ✅  neo4j_graph_populated  — Graph populated — found 863 :Type nodes
  ✅  source_files_enriched  — Graph enrichment done — found 301 :SourceFile nodes
  ✅  agent_system_prompt    — Agent system prompt found
======================================================
  ✅  All checks passed (8/8)
```

Use `--json` to get only the JSON output (useful for automation/CI).

---

### Step 1 — Start the MCP server

```bash
# From the repository root
bash .github/skills/rev-code-jqassistant-graph-rag/scripts/start-mcp-server.sh \
  --uri bolt://localhost:7688 \
  --user neo4j \
  --password <your-password>
```

Or manually:

```bash
cd rev-code-jqassistant-graph-rag
source .venv/bin/activate
python3 mcp_server.py --uri bolt://localhost:7688 --user neo4j --password <your-password>
```

The server listens at `http://0.0.0.0:8800/mcp`.

### Offline embeddings (air-gapped)

If you run the MCP server in an environment without internet access (air-gapped) or where HTTPS downloads from the Hugging Face Hub fail due to certificate issues, you can either disable embeddings entirely or load a pre-downloaded SentenceTransformer model from a local path.

Options:

- Disable embeddings (MCP will run, but semantic search is unavailable):

```bash
export DISABLE_EMBEDDINGS=1
.venv/bin/python3 mcp_server.py --uri bolt://localhost:7688 --user neo4j --password <pwd>
```

- Use a pre-downloaded SentenceTransformer model (preferred when you need semantic search offline):

1. On a machine with internet access, download the model snapshot into a folder you can copy to the air-gapped host. Example using `huggingface_hub`:

```bash
pip install -U huggingface_hub
python3 - <<PY
from huggingface_hub import snapshot_download
path = snapshot_download(repo_id='sentence-transformers/all-MiniLM-L6-v2', cache_dir='/tmp/hf_cache')
print('Downloaded to', path)
PY
```

1. Copy the downloaded folder (the returned `path`) to the target machine, for example into the skill folder:

```bash
mkdir -p .github/skills/rev-code-jqassistant-graph-rag/git-clone/local_models
cp -r /tmp/hf_cache/sentence-transformers--all-MiniLM-L6-v2 .github/skills/rev-code-jqassistant-graph-rag/git-clone/local_models/all-MiniLM-L6-v2
```

1. Start the MCP server and point it at the local model path (absolute path recommended):

```bash
.venv/bin/python3 mcp_server.py --uri bolt://localhost:7688 --user neo4j --password <pwd> --embeddings-path "/full/path/to/local_models/all-MiniLM-L6-v2"
```

Notes and troubleshooting:

- If the SentenceTransformer loader still attempts to contact `huggingface.co` for metadata, your Python environment may not trust the system CA bundle. Use the helper script to update `certifi` and write a CA-bundle env file:

```bash
bash .github/skills/rev-code-jqassistant-graph-rag/scripts/configure-vscode-mcp.sh --fix-certifi
# then in your shell
source .vscode/rev-code-jqassistant-hf-cert.env
```

- You can also set `HF_HOME` or `TRANSFORMERS_CACHE` to point to the downloaded cache directory if you prefer that mechanism.

- If you only need the MCP server without semantic search, use `DISABLE_EMBEDDINGS=1` to skip model initialization and speed startup.

### Step 2 — Verify `.vscode/mcp.json`

The file `.vscode/mcp.json` must declare the MCP server so Copilot can discover it.
Run the helper to create/update it:

```bash
bash .github/skills/rev-code-jqassistant-graph-rag/scripts/configure-vscode-mcp.sh
```

This produces (or updates) `.vscode/mcp.json` with:

```json
{
  "servers": {
    "rev-code-jqassistant-graph-rag": {
      "type": "http",
      "url": "http://127.0.0.1:8800/mcp"
    }
  }
}
```

### Step 3 — Apply the agent system prompt

The file [references/agent-system-prompt.md](./references/agent-system-prompt.md) contains
the expert Java/Kotlin GraphRAG agent instruction (extracted from `agent.py`). Paste it
as a custom instruction in Copilot Chat or reference it in your session.

---

## Session workflow (every use)

When the skill is invoked, follow this workflow:

### 1. Confirm MCP server is reachable

```bash
curl -sf http://127.0.0.1:8800/mcp || echo "MCP server not running"
```

### 2. Seed Copilot with the agent role

Start your Copilot chat message with the system instruction marker:

```
#file:.github/skills/rev-code-jqassistant-graph-rag/references/agent-system-prompt.md

<your question here>
```

Or add it once to the session via VS Code Chat context attachment.

### 3. Use MCP tools via Copilot

Copilot will automatically call the MCP tools when relevant:

| Tool | Purpose |
| ---- | ------- |
| `get_project_info` | Project name, root path, high-level summary |
| `get_graph_schema` | Node labels, properties, and relationships |
| `execute_cypher_query` | Run any read-only Cypher query |
| `get_source_code_by_id` | Read source code for a node by `entity_id` |
| `search_nodes_for_semantic_similarity` | Vector similarity search over summaries |
| `generate_embeddings` | Generate embeddings for advanced Cypher vector queries |

### 4. Example questions to try

```
What are the main packages and their responsibilities?
Show the call chain from AssessmentController to the persistence layer.
Which classes are annotated with @RestController?
Find all classes that depend on NotificationService.
Explain the domain model.
What would break if I remove UserService?
```

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Copilot does not call MCP tools | Verify `.vscode/mcp.json` exists and server is running |
| `curl http://127.0.0.1:8800/mcp` fails | Start `mcp_server.py` first |
| `get_graph_schema` returns empty | Run `mvn -Pjqassistant jqassistant:scan jqassistant:analyze` then `python3 main.py` |
| `search_nodes_for_semantic_similarity` errors | Run `python3 main.py --generate-summary` to add embeddings |
| No project summary | Run `python3 main.py --generate-summary --llm-api <api>` |

---

## Verification {#verification}

`verify-graph-rag-configuration.py` is the canonical pre-flight check. Run it any time you are unsure whether the skill is correctly configured:

```bash
python3 .github/skills/rev-code-jqassistant-graph-rag/scripts/verify-graph-rag-configuration.py \
  [--repo-root .] [--mcp-url http://127.0.0.1:8800] \
  [--neo4j-uri bolt://localhost:7688] [--neo4j-user ""] [--neo4j-password ""] \
  [--json] [--fail-fast]
```

Checked elements:

| Check key | What is verified |
| --------- | ---------------- |
| `git_clone_exists` | `git-clone/` directory contains `mcp_server.py`, `main.py`, `llm_client.py` |
| `venv_installed` | `.venv/bin/python3` exists and `neo4j`, `fastapi`, `uvicorn` are importable |
| `vscode_mcp_json` | `.vscode/mcp.json` declares the `rev-code-jqassistant-graph-rag` server entry |
| `mcp_server_reachable` | HTTP GET to MCP server returns < 500 |
| `neo4j_reachable` | Bolt connection succeeds (`RETURN 1`) |
| `neo4j_graph_populated` | At least one `:Type` node exists in the graph |
| `source_files_enriched` | At least one `:SourceFile` node exists (enrichment was run) |
| `agent_system_prompt` | `references/agent-system-prompt.md` exists |

---

## Skill assets

| File | Purpose |
| ---- | ------- |
| `scripts/install-graph-rag.py` | **All-in-one installer** — verify + auto-fix all prerequisites |
| `scripts/verify-graph-rag-configuration.py` | Pre-flight check — returns JSON status for each element |
| `scripts/clone-graph-rag-repo.sh` | Clone the graph-rag git repository into `git-clone/` |
| `scripts/start-mcp-server.sh` | Start `mcp_server.py` with venv activation |
| `scripts/configure-vscode-mcp.sh` | Create/update `.vscode/mcp.json`; `--fix-certifi` updates CA bundle |
| `references/agent-system-prompt.md` | Expert Java/Kotlin GraphRAG agent instruction |

---

## Related documentation

- [rev-code-jqassistant-graph-rag-user-guide.md](../rvng-jqassistant-analysis/references/rev-code-jqassistant-graph-rag-user-guide.md) — full setup, enrichment, and LLM options
- [rev-code-jqassistant-user-guide.md](../rvng-jqassistant-analysis/references/rev-code-jqassistant-user-guide.md) — scan and analyze with jQAssistant
