# jQAssistant User Guide

Everything you need to set up, configure, and run jQAssistant for this repository.
All commands are driven through the interactive manager — see the **Manager** section
for the fastest path.

---

## ⚡ Fastest path — interactive manager

```bash
# Run manager (GROUP E debug helpers are hidden by default)
python3 .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_manager.py

# To reveal the debug Group E (e.g. install graph-RAG helper E1), start with:
python3 .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_manager.py --hide-group-E=false
```

The manager presents a numbered menu. The typical first-run sequence is:

| Step | Menu option | What it does                                              |
| ---- | ----------- | --------------------------------------------------------- |
| 1    | **A1**      | Install jQAssistant (download Maven plugin, init store)   |
| 2    | **A2**      | Verify jQAssistant install (preflight checks)             |
| 3    | **B1**      | jqassistant scan + analyze (populate and label the graph) |
| 4    | **B3**      | Start embedded Neo4j server (Bolt 7688, HTTP 7777)        |
| 5    | **C1**      | Enrichment + summaries (fake LLM) — quick enrichment run  |
| 6    | **C4**      | Check graph — Java analysis                               |
| 7    | **C6**      | Start MCP server (port 8800)                              |
| 8    | **D4**      | Clean graph-rag clone/venv (cleanup)                      |

> 💡 To access graph-RAG installation helpers (previously in the A/C groups) use `--hide-group-E=false` to show GROUP E, then run **E1** (Install graph-RAG) and **E8** (download model) as needed.

---

## Chaining commands, ranges, and "all"

You can run multiple manager options in a single input. Examples:

- Interactive chaining (space-separated):

```text
Select option(s) (A1-A3, B1-B4, C1-C7, D4, E1-E13, 00/Q=quit): B1 C4 A2
```

- Comma- or semicolon-separated also work: `B1,C4,A2` or `B1;C4;A2`.

- Range-style selection expands numeric sequences: `B1-B4` → `B1 B2 B3 B4` (only entries that exist in the menu are run).

- Run everything: enter `ALL` to execute all available menu actions in order.

When using `--option` you can also pass multiple values (same separators):

```bash
python3 .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_manager.py --option "B1 C4 A2"
```

---

## Step 1 — Configure the Neo4j connection

The manager reads settings from `scripts/skill.env`. The defaults work out of the box
for the embedded server:

```text
NEO4J_BOLT_PORT=7688
NEO4J_HTTP_PORT=7777
NEO4J_URI="bolt://localhost:7688"
NEO4J_USER=""
NEO4J_PASSWORD=""
```

To override for a remote Neo4j instance, export these variables before running the manager:

```bash
export NEO4J_BOLT_URL=bolt://my-server:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=<password>
```

> ⚠️ Do NOT commit credentials. Use CI secret management or local `.env` files.

---

## Step 2 — Review `.jqassistant.yml`

The project already has `.jqassistant.yml` at the repository root. Key fields:

```yaml
jqassistant:
  store:
    embedded:
      bolt-port: 7688        # Bolt port for the embedded Neo4j server
      http-port: 7777        # HTTP browser port
      listen-address: "0.0.0.0"

  scan:
    directories:
      - src/main/java        # Source tree (creates :SourceFile nodes)
    # target/classes is scanned automatically via the Maven plugin — do NOT list it here

  analyze:
    groups:
      - smart-assessment-microservices-core:Default   # project custom rules
```

To start fresh from the template:

```bash
cp .github/skills/rvng-jqassistant-analysis/templates/jqassistant-template.yml \
   .jqassistant.yml
```

---

## Step 3 — Review the rules file

The project rules are in `jqassistant/rules/smart-assessment-microservices-core-rules.xml`.

To start from the template:

```bash
cp .github/skills/rvng-jqassistant-analysis/templates/analysis-rules-template.xml \
   jqassistant/rules/my-analysis-rules.xml
```

---

## ✅ Step 4 — Validate configuration

```bash
python3 .github/skills/rvng-jqassistant-analysis/scripts/jqassistant-verify.py
```

---

## Step 5 — Run jQAssistant

Always use the `jqassistant` Maven profile:

```bash
# Scan + analyze (recommended)
mvn -Pjqassistant jqassistant:scan jqassistant:analyze

# Or separately
mvn -Pjqassistant jqassistant:scan
mvn -Pjqassistant jqassistant:analyze

# Start the embedded graph browser
mvn -Pjqassistant jqassistant:server
```

> 💡 On macOS `jqassistant:server` needs stdin — use
> `tail -f /dev/null | mvn -Pjqassistant jqassistant:server` or manager option **B5**.

---

## How the pieces fit — three analysis strategies

| Strategy                       | How to activate                           | Use case                                       |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------- |
| **A — Built-in groups**        | Add `java:Default` to `analyze.groups`    | General Java quality rules                     |
| **B — Custom rules directory** | Drop `.xml` files in `jqassistant/rules/` | Project-specific constraints and concepts      |
| **C — Explicit concepts**      | List concept IDs under `analyze.concepts` | Targeted graph enrichment without a group file |

This project uses **B** (custom rules) as its primary strategy.

---

## Authoring rules

Rule files live in `jqassistant/rules/` — jQAssistant picks them up automatically.

| Element                                | Purpose                                                           |
| -------------------------------------- | ----------------------------------------------------------------- |
| `<concept id="ns:Id">`                 | Graph enrichment: add labels, properties, or relationships        |
| `<constraint id="ns:Id" severity="…">` | Validation: returned rows = violations                            |
| `<group id="ns:Default">`              | Bundle concepts and constraints; reference ID in `analyze.groups` |

### Valid severity values

`blocker` · `critical` · `major` · `minor` · `info`

### Concept example — label enrichment

```xml
<concept id="example:MarkAnnotatedClass">
  <description>Label classes annotated with @ExampleAnnotation as :ExampleLabel</description>
  <cypher><![CDATA[
    MATCH (c:Class)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
    WHERE t.fqn = 'com.example.ExampleAnnotation'
    SET c:ExampleLabel
    RETURN count(c) AS Marked
  ]]></cypher>
</concept>
```

### Constraint example — layer violation

```xml
<constraint id="example:NoDirectDependency" severity="major">
  <requiresConcept refId="example:MarkLayerA"/>
  <requiresConcept refId="example:MarkLayerB"/>
  <cypher><![CDATA[
    MATCH (a:LayerA)-[:DEPENDS_ON]->(b:LayerB)
    RETURN a.fqn AS Violator, b.fqn AS Violation
  ]]></cypher>
</constraint>
```

### Group example

```xml
<group id="example:Default">
  <includeConcept refId="example:MarkAnnotatedClass"/>
  <includeConstraint refId="example:NoDirectDependency"/>
</group>
```

---

## `.jqassistant.yml` snippets

### Plugin coordinates (full mapping required)

```yaml
jqassistant:
  plugins:
    - group-id: org.jqassistant.plugin
      artifact-id: jqassistant-openapi-plugin
      version: 1.0.0-M2
    - group-id: org.jqassistant.plugin.typescript
      artifact-id: jqassistant-typescript-plugin
      version: 1.4.0
```

> ⚠️ Each plugin entry **must** be a YAML mapping — not a plain string — otherwise the Maven
> plugin rejects the configuration with a validation error.

### Enable groups, concepts, and constraints (Options A + B + C)

```yaml
jqassistant:
  analyze:
    groups:
      - smart-assessment-microservices-core:Default   # project group (Option B)
    concepts:
      - smart-assessment-microservices-core:MarkSpringController  # explicit (Option C)
```

---

## PlantUML and private registries

PlantUML-related jQAssistant plugins are commonly blocked by private Maven mirrors. The
preflight verifier warns when a plugin artifact name contains `plantuml`.

- If your environment resolves PlantUML reliably → add the plugin object.
- Otherwise → omit it to avoid `artifact not found` Maven resolution failures.

---

## Troubleshooting

| Symptom                                | Cause                                           | Fix                                                                   |
| -------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `jqassistant-report.xml` empty         | No rule groups active during `analyze`          | Add at least one group to `analyze.groups`                            |
| Plugin resolution error                | Plugin entry is a plain string, not a mapping   | Ensure each entry includes `group-id`, `artifact-id`, and `version`   |
| `NEO4J_BOLT_URL` not found             | Env var not set, no bolt-uri in config          | Export `NEO4J_BOLT_URL` or set `jqassistant.server.embedded.bolt-uri` |
| `java:Default` group not found         | Built-in group unavailable                      | Remove from `analyze.groups`; keep project custom group               |
| IDE XSD 403 error                      | IDE tries to fetch the jQAssistant XSD remotely | Cosmetic — jQAssistant resolves it internally; ignore                 |
| `jqassistant:server` exits immediately | No stdin on macOS                               | Run through manager **B5** or use `tail -f /dev/null \| mvn ...`      |

---

## `pom.xml` — Maven plugin setup

The `jqassistant-maven-plugin` is already configured in `pom.xml` under the `jqassistant`
profile. To add it to a new project, use the template:

```text
.github/skills/rvng-jqassistant-analysis/templates/pom-template.xml
```

Key steps:

1. Add `<jqassistant.version>2.9.1</jqassistant.version>` inside `<properties>`.
2. Copy the plugin snippet from the template into `<build><plugins>`.
3. Verify scan directories match your build output layout.

> The plugin is **not** bound to any default Maven lifecycle phase — always invoke goals
> explicitly: `mvn -Pjqassistant jqassistant:scan jqassistant:analyze`.

---

## Next step: Graph RAG (AI-ready knowledge graph)

Once the jQAssistant graph is populated you can optionally enrich it with semantic summaries
and vector embeddings using the bundled graph-RAG tool.

> See: **[../tool-graph-rag/jqassistant-graph-rag-user-guide.md](../tool-graph-rag/jqassistant-graph-rag-user-guide.md)**

Quick start (after B4 — jqassistant scan + analyze):

```bash
# Manager option A2 installs the tool
python3 .github/skills/rvng-jqassistant-analysis/scripts/jqassistant_manager.py
# select A2, then C4
```

---

## Skill assets reference

| File                                         | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `templates/jqassistant-template.yml`         | Base `.jqassistant.yml` — copy to repo root                      |
| `templates/analysis-rules-template.xml`      | Annotated rules template — copy to `jqassistant/rules/`          |
| `templates/jqassistant-run-scan-analysis.py` | One-shot launch script: verify → scan → analyze                  |
| `templates/pom-template.xml`                 | Maven plugin snippet — copy into `pom.xml`                       |
| `scripts/jqassistant_manager.py`             | Interactive manager — the main entry point                       |
| `scripts/jqassistant-verify.py`              | Preflight verifier: bolt URI, plugin coordinates                 |
| `scripts/check-graph.py`                     | Graph health checker (modes: `java`, `config`, `jpa`, `testing`) |
| `scripts/generate-mermaid.py`                | Mermaid DSL generator from Cypher JSON                           |
| `references/jqassistant-ref.md`              | Full offline reference (config keys, Cypher, plugin coordinates) |

> 🔒 Keep secrets out of version control. Use CI secret stores or environment variables.

---

Last updated: 2026-05-01
