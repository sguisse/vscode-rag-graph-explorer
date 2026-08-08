# jQAssistant Graph RAG — User Guide

This guide explains how the bundled `jqassistant-graph-rag` tool transforms a jQAssistant /
Neo4j graph into a **semantically rich, AI-ready knowledge graph** for this repository.

> **Why?** A plain jQAssistant graph captures bytecode structure (classes, methods, invocations)
> but has no access to source code semantics or natural-language explanations. This tool adds
> two enrichment stages:
>
> 1. **Graph Enrichment** — links compiled nodes to source files, normalises properties
>    (canonical paths, FQNs, stable IDs), and builds source and class-hierarchy overlay graphs.
> 2. **RAG Generation** — walks the enriched graph bottom-up and uses an LLM to generate
>    summaries for every method → type → file → directory → package → project.

The result is a queryable knowledge graph that powers AI agents, architecture exploration, and
automated code analysis.

---

## Architecture at a Glance

```text
  Compiled artifacts + Source code
         │
         ▼
  jQAssistant scan  ──────────────────────────────► Neo4j graph
                                                         │
                                   ┌─────────────────────▼──────────────────────┐
                                   │           jqassistant-graph-rag             │
                                   │                                             │
                                   │  Phase 1 — Graph Enrichment                │
                                   │    GraphOrchestrator                        │
                                   │      └─ SourceFileLinker                   │
                                   │      └─ GraphBasicNormalizer                │
                                   │      └─ GraphTreeBuilder                    │
                                   │      └─ ArtifactDataNormalizer              │
                                   │      └─ GraphEntitySetter                   │
                                   │                                             │
                                   │  Phase 2 — RAG Generation (optional)       │
                                   │    RagOrchestrator                          │
                                   │      └─ MethodAnalyzer                     │
                                   │      └─ MethodSummarizer                   │
                                   │      └─ TypeSummarizer                     │
                                   │      └─ SourceFileSummarizer               │
                                   │      └─ DirectorySummarizer                │
                                   │      └─ PackageSummarizer                  │
                                   │      └─ ProjectSummarizer                  │
                                   │      └─ EntityEmbedder (vector index)      │
                                   └─────────────────────────────────────────────┘
                                                         │
                                                         ▼
                                          Enriched knowledge graph in Neo4j
                                                         │
                                         ┌───────────────┼────────────────┐
                                         ▼               ▼                ▼
                                    AI Agent          Cypher          MCP Server
                                  (ADK agent)        queries       (mcp_server.py)
```

---

## Prerequisites

### 1. Running jQAssistant + Neo4j graph

The graph-rag tool enriches an **existing** jQAssistant graph. Run jQAssistant **first** (see
[jqassistant-user-guide.md](../jqassistant-user-guide.md)) — at minimum complete a
`jqassistant:scan` + `jqassistant:analyze` pass (manager **B4**).

The embedded server runs on:

- Bolt: `bolt://localhost:7688`
- HTTP browser: `http://0.0.0.0:7777`

### 2. Python 3.12 or higher

```bash
python3 --version   # must be >= 3.12
```

### 3. Tool already installed

The graph-rag tool is bundled under:

```text
.github/skills/rvng-jqassistant-analysis/tool-graph-rag/git-clone/
```

Use manager option **A2** to clone / reinitialise it, and **C1** to create the venv and install
dependencies. The venv lives at `tool-graph-rag/git-clone/.venv/`.

The sentence-transformer model (`all-MiniLM-L6-v2`) is downloaded via manager option **A3** or
**C2** and stored at `tool-graph-rag/git-clone/models/all-MiniLM-L6-v2` for offline use.

---

## Running graph-rag

Always use the **interactive manager** — it handles the venv, environment variables, and
passes the correct `--repo-root` automatically:

```bash
python3 .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_manager.py
```

| Menu option | What it does |
| --- | --- |
| **C3** | Phase 1 only — graph enrichment, no LLM cost |
| **C4** | Phase 1 + Phase 2 — enrichment AND fake-LLM summaries (no API key) |
| **C5** | Phase 1 + Phase 2 — OpenAI summaries |
| **C6** | Phase 1 + Phase 2 — Ollama (local LLM) |
| **C7** | Phase 1 + Phase 2 — CLI LLM (e.g. `gemini`) |
| **C8** | Phase 1 + Phase 2 — CLI LLM (e.g. `copilot --model gpt-5-mini`) |

### Direct invocation (advanced)

Run from inside the venv:

```bash
cd .github/skills/rvng-jqassistant-analysis/tool-graph-rag/git-clone
source .venv/bin/activate

# Phase 1 only — graph enrichment
python3 main.py \
  --uri bolt://localhost:7688 \
  --user '' --password '' \
  --repo-root '/path/to/repository/root'

# Phase 1 + Phase 2 — fake LLM (tests the pipeline, no API cost)
python3 main.py \
  --uri bolt://localhost:7688 \
  --user '' --password '' \
  --repo-root '/path/to/repository/root' \
  --generate-summary \
  --llm-api fake
```

### All CLI options

| Option | Default | Description |
| --- | --- | --- |
| `--uri` | `bolt://localhost:7687` (or `NEO4J_URI` env) | Neo4j bolt URI |
| `--user` | `neo4j` (or `NEO4J_USER` env) | Neo4j username |
| `--password` | `neo4j` (or `NEO4J_PASSWORD` env) | Neo4j password |
| `--repo-root` | auto-detected from graph | Absolute path to the repository root (`pom.xml` directory) |
| `--generate-summary` | disabled | Enable RAG summary generation (Phase 2) |
| `--llm-api` | `fake` | LLM API: `fake` \| `openai` \| `deepseek` \| `ollama` \| `cli` |
| `--log-level` | `INFO` | Console log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`) |
| `--log-file` | `debug.log` | Path for debug log file |

> ⚠️ Always pass `--repo-root` explicitly when running directly. The manager does this
> automatically. Without it, the `:Project` node may be named after a parent directory.

---

## Summary cache

Summaries are cached at `<repo_root>/.cache/summary_cache.json`. On subsequent runs the tool
skips unchanged files. To force full regeneration:

```bash
rm <repo_root>/.cache/summary_cache.json
```

---

## Interacting with the enriched graph

### Option A — Direct Cypher queries

After enrichment, query the Neo4j graph via the browser (`http://localhost:7777`) or bolt port:

```cypher
-- All :Entity nodes with summaries
MATCH (e:Entity)
WHERE e.summary IS NOT NULL
RETURN labels(e) AS type, e.entity_id AS id, e.summary AS summary
LIMIT 20

-- Controllers and their direct dependencies
MATCH (c:Controller)-[:DEPENDS_ON]->(t:Type)
RETURN c.fqn AS controller, collect(t.fqn) AS dependencies
ORDER BY controller

-- Source directories linked to source files
MATCH (d:Directory)-[:CONTAINS_SOURCE]->(f:SourceFile)
RETURN d.absolute_path AS dir, collect(f.absolute_path) AS files
LIMIT 10

-- Methods with source code analysis
MATCH (m:Method)
WHERE m.code_analysis IS NOT NULL
RETURN m.signature AS method, m.code_analysis AS analysis
LIMIT 10
```

### Option B — MCP tool server + AI agent

Start the MCP server (manager **C9**):

```bash
# From inside the venv
python3 mcp_server.py --port 8800
# Listens at http://0.0.0.0:8800
```

Start the ADK agent (manager **C11** for web UI, **C10** for CLI):

```bash
adk web      # http://127.0.0.1:8000 — select 'rag_adk_agent'
adk run rag_adk_agent
```

Available MCP tools exposed by `mcp_server.py`:

| Tool | Description |
| --- | --- |
| `get_project_info` | Returns project name, root path, optional LLM summary |
| `get_graph_schema` | Returns all node labels, properties, and relationships |
| `execute_cypher_query` | Runs any read-only Cypher query |
| `get_source_code_by_id` | Returns source code (method body or full file) by `entity_id` |
| `search_nodes_for_semantic_similarity` | Vector similarity search over node summaries |
| `generate_embeddings` | Generates an embedding vector for a given text |

### Option C — Copilot / graph-architect-analyst skill

Once the graph is enriched, the `graph-architect-analyst` agent can issue Cypher queries
against the richer node properties (`.summary`, `.absolute_path`, stable `entity_id`) for
arc42 documentation generation. Set `NEO4J_BOLT_URL=bolt://localhost:7688`.

---

## LLM API configuration

### Fake (no API key — for testing)

```bash
python3 main.py --generate-summary --llm-api fake ...
```

Returns a static placeholder summary. Useful to validate the pipeline end-to-end.

### OpenAI

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o     # optional, default: gpt-3.5-turbo
python3 main.py --generate-summary --llm-api openai ...
```

### DeepSeek

```bash
export DEEPSEEK_API_KEY=...
python3 main.py --generate-summary --llm-api deepseek ...
```

### Ollama (local, no API key)

```bash
# Start Ollama with a model, then:
python3 main.py --generate-summary --llm-api ollama ...
```

### CLI (Gemini, Copilot, or any shell command)

```bash
export LLM_CLI_CMD="gemini"
python3 main.py --generate-summary --llm-api cli ...

# Or via manager C7 / C8
```

---

## Processing pipeline reference

### Phase 1 — Graph Enrichment (`GraphOrchestrator`)

| Pass | Class | What it does |
| --- | --- | --- |
| Add Absolute Paths | `GraphBasicNormalizer` | Propagates `absolute_path` to all filesystem nodes, level by level |
| Create Disk SourceFile nodes | `GraphBasicNormalizer` | Fallback: creates `:SourceFile` nodes from disk if jQA scanner missed them |
| Label Source Files | `GraphBasicNormalizer` | Labels `.java` / `.kt` files as `:SourceFile` |
| Link Types to Source Files | `SourceFileLinker` | Creates `[:WITH_SOURCE]` between `:Type` and `:SourceFile` |
| Link Members to Source Files | `SourceFileLinker` | Creates `[:WITH_SOURCE]` between `:Method` / `:Field` and `:SourceFile` |
| Create Project Node | `GraphTreeBuilder` | Merges `:Project` node, links artifacts and directories |
| Establish Source Hierarchy | `GraphTreeBuilder` | Creates `[:CONTAINS_SOURCE]` between directories and source files |
| Merge Duplicate Types | `GraphBasicNormalizer` | Deduplicates `:Type` nodes |
| Relocate Directory Artifacts | `ArtifactDataNormalizer` | Promotes directory roots to `:Artifact` |
| Rewrite Containment | `ArtifactDataNormalizer` | Rebuilds `[:CONTAINS]` relationships after promotion |
| Establish Class Hierarchy | `GraphTreeBuilder` | Creates `[:CONTAINS_CLASS]` relationships |
| Create Entities and Stable IDs | `GraphEntitySetter` | Labels relevant nodes as `:Entity` and assigns stable `entity_id` values |

### Phase 2 — RAG Generation (`RagOrchestrator`)

Summarisation is **bottom-up and dependency-aware**:

```text
MethodAnalyzer → MethodSummarizer → TypeSummarizer → SourceFileSummarizer
  → DirectorySummarizer → PackageSummarizer → ProjectSummarizer → EntityEmbedder
```

| Pass | What it does |
| --- | --- |
| `MethodAnalyzer` | Extracts source code snippets; writes `code_analysis` + `code_hash` to `:Method` nodes |
| `MethodSummarizer` | Generates natural-language summaries for methods |
| `TypeSummarizer` | Summarises classes/interfaces using member summaries; processes inheritance levels |
| `SourceFileSummarizer` | Summarises source files |
| `DirectorySummarizer` | Summarises directories bottom-up using child summaries |
| `PackageSummarizer` | Summarises packages |
| `ProjectSummarizer` | Generates a project-level summary |
| `EntityEmbedder` | Embeds all `:Entity` summaries into a Neo4j vector index (`summary_embeddings`) |

Token management and chunking are handled automatically for large methods.

---

## Health checks — `check-graph.py`

After enrichment, use the graph health checker (manager **C12** / **C13**):

```bash
cd .github/skills/rvng-jqassistant-analysis/tool-graph-rag/git-clone
source .venv/bin/activate
cd ../../scripts

# Java stereotypes, layer labels, enrichment state
python3 check-graph.py --mode java --uri bolt://localhost:7688

# Schema, APOC, label/relationship inventory, embedding state
python3 check-graph.py --mode config --uri bolt://localhost:7688

# JPA/Hibernate: @Entity, relationship mappings, transactions
python3 check-graph.py --mode jpa --uri bolt://localhost:7688

# Test coverage: JUnit 5, @MockBean, Testcontainers
python3 check-graph.py --mode testing --uri bolt://localhost:7688
```

Exit codes: `0` = all checks passed, `1` = checks failed, `2` = cannot connect.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `UnknownRelationshipTypeWarning: CONTAINS_SOURCE` | Scan was not run before enrichment | Run `B4` (scan + analyze) first |
| `UnknownPropertyKeyWarning: code_analysis / code_hash` | First run after fresh B4 scan | Expected — properties are written on the first successful enrichment pass |
| `No Java type nodes found — RAG SKIPPED` | `jqassistant:scan` not run | Run manager **B4** |
| `:Project` node named after home directory | `--repo-root` not passed | Always pass `--repo-root` or use the manager |
| `ConstraintValidationFailed: entity_id` | Stale Project node from a prior run with a different name | Fixed automatically by the stale-node cleanup in `GraphTreeBuilder` |
| `LLM call fails` | Missing API key env var | Export the appropriate `*_API_KEY` variable |
| `Summaries not regenerated` | Cache hit in `summary_cache.json` | Delete `<repo_root>/.cache/summary_cache.json` |
| `Agent cannot connect to MCP server` | `mcp_server.py` not running | Start via manager **C9** |
| `No items found for MethodSummarizer` | `code_analysis` is NULL (no real LLM run yet) | Expected with `--llm-api fake`; run with a real LLM to populate |
| `DirectorySummarizer: No database updates` | All summaries already up-to-date | Normal — logged at INFO level, not a warning |

---

## Further reading

- [jQAssistant User Guide](../jqassistant-user-guide.md) — how to run the initial scan
- [jQAssistant Reference](../references/jqassistant-ref.md) — config keys, Cypher queries, plugin coordinates
- [graph-rag source repository](https://github.com/2015xli/jqassistant-graph-rag)

---

Last updated: 2026-05-01
