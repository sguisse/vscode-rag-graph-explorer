---
name: rvng-jqassistant-analysis
version: 2.0.0
description: >
  Master the art of querying modular full-stack codebases (FE, BFF, BE) for arc42
  Living Documentation. Mixed-strategy analysis: built-in Java rules (A), custom
  project rules (B), and explicit graph-enrichment concepts (C).
  Supports dual-format (Mermaid) diagrams and API contract detection.

owner: ai-agent-core-factory
---

# Skill: jQAssistant Analysis (Adaptive Full-Stack)

This skill provides modular Cypher queries, a mixed analysis strategy, and Mermaid
rendering patterns for arc42 documentation across any topology.

## Preflight verification (always run first)

Before invoking jQAssistant, validate configuration (bolt URI, plugin coordinates):

```bash
python .github/skills/rvng-jqassistant-analysis/scripts/verify-rev-code-jqassistant-configuration.py
```

Exit codes: `0` = OK, `1` = warnings, `2` = errors (fix before running jQAssistant).

---

## Mixed analysis strategy

The project uses three complementary approaches together. All are activated in
`.jqassistant.yml` and `jqassistant/rules/smart-assessment-rules.xml`.

### Option A — Built-in Java rules

No longer activated via `java:Default` (not bundled in all installations). Use the custom group `smart-assessment:Default` (Option B) instead, and add explicit concepts via Option C. To re-enable built-in Java rules if available in your jQAssistant distribution, add the group name to `analyze.groups` in `.jqassistant.yml`.

### Option B — Custom project rules (`jqassistant/rules/`)

File: `jqassistant/rules/smart-assessment-rules.xml`
Group activated: `smart-assessment:Default`

**Concepts defined (graph enrichment):**
- `smart-assessment:MarkSpringController` — labels `@RestController`/`@Controller` classes as `:Controller`
- `smart-assessment:MarkSpringService` — labels `@Service` classes as `:Service`
- `smart-assessment:MarkSpringRepository` — labels `@Repository` classes as `:Repository`
- `smart-assessment:MarkApiLayer` — labels classes in `*.api` packages as `:ApiLayer`
- `smart-assessment:MarkDomainLayer` — labels classes in `*.domain` packages as `:DomainLayer`
- `smart-assessment:MarkInfrastructureLayer` — labels classes in `*.infrastructure` packages as `:InfrastructureLayer`

**Constraints defined (violations):**
- `smart-assessment:ControllerMustNotDependOnRepository` — major
- `smart-assessment:DomainMustNotDependOnInfrastructure` — major
- `smart-assessment:ApiLayerMustNotDependOnInfrastructure` — major
- `smart-assessment:NoCyclicPackageDependencies` — blocker

Add new rules to `jqassistant/rules/smart-assessment-rules.xml` and reference them
in the `smart-assessment:Default` group.

### Option C — Explicit concepts (`analyze.concepts`)

Activated directly in `.jqassistant.yml` for graph-level enrichment that does not
require a report entry:
- `java:VirtualInvokes` — adds virtual invocation relationships
- `java:GeneratedType` — marks generated classes
- `java:InnerType` — marks inner/anonymous classes

Use these labels in subsequent Cypher queries to exclude generated code, etc.

---

## API Contract & Topology Detection

### Detect OpenAPI/Swagger files

```cypher
MATCH (f:File)
WHERE f.name ENDS WITH ".yaml" OR f.name ENDS WITH ".json"
MATCH (f)-[:CONTAINS]->(root:JSON:Object)
WHERE root.openapi IS NOT NULL OR root.swagger IS NOT NULL
RETURN f.name AS API_Contract_File
```

### Detect Swagger annotations in Java

```cypher
MATCH (c:Class)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
WHERE t.fqn CONTAINS "io.swagger.v3.oas.annotations"
RETURN c.fqn AS Class, t.name AS Annotation
```

---

## Architecture queries (after concepts are applied)

### List Controllers, Services, Repositories

```cypher
MATCH (c:Controller) RETURN c.fqn AS Controller
UNION
MATCH (s:Service) RETURN s.fqn AS Controller
UNION
MATCH (r:Repository) RETURN r.fqn AS Controller
```

### Check layer assignments

```cypher
MATCH (c:Class)
WHERE c:ApiLayer OR c:DomainLayer OR c:InfrastructureLayer
RETURN labels(c) AS Layers, c.fqn AS Class
ORDER BY Layers, Class
```

### Building Blocks with dependencies

```cypher
MATCH (b:BuildingBlock)
OPTIONAL MATCH (b)-[:DEPENDS_ON]->(dep:BuildingBlock)
RETURN b.name AS source, dep.name AS target, 'DEPENDS_ON' AS rel_type
```

---

## Dual-Format Diagram Generation

> ⚠️ **Do NOT generate Mermaid DSL by Cypher string concatenation.**
> Neo4j internal `id(n)` values change on every graph reload. Node names may contain
> Mermaid-invalid characters (`[`, `]`, `->`). Concatenated DSL is never validated.

### Step 1 — Cypher extracts structured data as JSON

```cypher
MATCH (b:BuildingBlock)
OPTIONAL MATCH (b)-[:DEPENDS_ON]->(dep:BuildingBlock)
RETURN b.name AS source, dep.name AS target, 'DEPENDS_ON' AS rel_type
```

Save the result to `result.json`.

### Step 2 — generate-mermaid.py produces valid DSL

```bash
python .github/skills/rvng-jqassistant-analysis/scripts/generate-mermaid.py \
  --input result.json \
  --diagram-type component \
  --output documentation/technical/arc42/05_building_block_view.md
```

Supported `--diagram-type` values: `component`, `sequence`.

---

## Adaptive Stitching Logic (FE → [BFF] → BE)

```cypher
MATCH (fe:FrontendLayer)
OPTIONAL MATCH (fe)-[:CALLS_API]->(api:API_Contract)
OPTIONAL MATCH (api)-[:IMPLEMENTED_BY]->(be:BackendLayer)
RETURN fe.name, api.name, be.name
```

---

## Reliability & Guardrails

- Always run `verify-rev-code-jqassistant-configuration.py` before scanning.
- Confirm custom concepts were applied with `MATCH (n:Controller) RETURN count(n)` — if zero, check that `jqassistant:scan jqassistant:analyze` completed successfully.
- If no OpenAPI file is found, fall back to URI path matching between Frontend string literals and Backend `@RequestMapping` annotations.

---

## Tools & Plugins

- **OpenAPI**: `rev-code-jqassistant-openapi-plugin` (`org.jqassistant.plugin:rev-code-jqassistant-openapi-plugin:1.0.0-M2`)
- **TypeScript**: `rev-code-jqassistant-typescript-plugin` (`org.jqassistant.plugin.typescript:rev-code-jqassistant-typescript-plugin:1.4.0`)
- **Mermaid**: Use the bundled `scripts/generate-mermaid.py` pipeline; never concatenate DSL in Cypher.

---

## References & templates (offline)

- Offline reference: `.github/skills/rvng-jqassistant-analysis/references/rev-code-jqassistant-ref.md`
- Local templates (copy to repo root to apply):
  - `.github/skills/rvng-jqassistant-analysis/templates/rev-code-jqassistant-template.yml`
  - `.github/skills/rvng-jqassistant-analysis/templates/README.md`
- Custom rules: `jqassistant/rules/smart-assessment-rules.xml`

When running offline, consult the reference file first — it contains canonical readiness queries, Maven examples, and plugin recommendations.
