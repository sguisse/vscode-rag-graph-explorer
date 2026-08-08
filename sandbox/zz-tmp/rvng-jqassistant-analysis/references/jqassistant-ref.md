# jQAssistant — offline reference

Essential, version-stable jQAssistant references for the `rvng-jqassistant-analysis` skill.
This file is self-contained so the skill can run without fetching docs from the web.

---

## Configuration locations & precedence

Priority (highest → lowest):

1. CLI arguments
2. Environment variables (`NEO4J_BOLT_URL`, `NEO4J_USER`, `NEO4J_PASSWORD`)
3. `.jqassistant.yml` in the working directory (project root)
4. `~/.jqassistant.yml` (user home)

> ⚠️ Never commit real credentials. Store bolt URIs with passwords in CI secret stores or
> local `.env` files (add `.env` to `.gitignore`).

---

## `.jqassistant.yml` — key fields used by this project

```yaml
jqassistant:
  maven:
    use-execution-root-as-project-root: true
    reuse-store: true

  store:
    embedded:
      bolt-port: 7688        # default 7687 — changed to avoid conflicts
      http-port: 7777        # default 7474
      listen-address: "0.0.0.0"
      neo4j-plugins:
        - group-id: org.neo4j.procedure
          artifact-id: apoc-core
          classifier: core
          version: 5.26.2

  server:
    embedded:
      bolt-uri: bolt://localhost:7688   # override with NEO4J_BOLT_URL env var

  scan:
    directories:
      - src/main/java          # Java source tree → :SourceFile nodes
    # ⚠️ Do NOT list target/classes or target/test-classes here.
    #    The jqa.plugin.maven3 plugin auto-scans those as Maven artifacts (bytecode).
    #    Listing them under scan.directories causes the filesystem scanner to re-scan
    #    them and skip .class files → 0 entries.

  plugins:
    - group-id: org.jqassistant.plugin
      artifact-id: jqassistant-openapi-plugin
      version: 1.0.0-M2
    - group-id: org.jqassistant.plugin.typescript
      artifact-id: jqassistant-typescript-plugin
      version: 1.4.0

  analyze:
    groups:
      - smart-assessment-microservices-core:Default   # project custom rules (Option B)
```

---

## Maven plugin invocation

The project uses the `jqassistant` Maven profile. Always pass `-Pjqassistant`:

```bash
# Recommended: scan + analyze in one shot
mvn -Pjqassistant jqassistant:scan jqassistant:analyze

# Scan only
mvn -Pjqassistant jqassistant:scan

# Analyze only (re-apply rules after code change without full rescan)
mvn -Pjqassistant jqassistant:analyze

# Start the embedded Neo4j server
mvn -Pjqassistant jqassistant:server

# Fully-qualified invocation (if plugin prefix is not mapped)
mvn com.buschmais.jqassistant:jqassistant-maven-plugin:${jqassistant.version}:scan
mvn com.buschmais.jqassistant:jqassistant-maven-plugin:${jqassistant.version}:analyze
```

> The `jqassistant.version` property is defined in `pom.xml`. Current value: `2.9.1`.

---

## Recommended plugin coordinates

All entries must be **YAML mappings** (`group-id` / `artifact-id` / `version`). A plain string
entry causes the Maven plugin to reject the configuration.

### OpenAPI scanner

```yaml
- group-id: org.jqassistant.plugin
  artifact-id: jqassistant-openapi-plugin
  version: 1.0.0-M2
```

### TypeScript scanner

```yaml
- group-id: org.jqassistant.plugin.typescript
  artifact-id: jqassistant-typescript-plugin
  version: 1.4.0
```

### APOC core (for graph-rag enrichment — required)

```yaml
- group-id: org.neo4j.procedure
  artifact-id: apoc-core
  classifier: core
  version: 5.26.2
```

> PlantUML plugins are **not recommended** — they are commonly blocked by private Maven mirrors.

---

## ✅ Readiness-check Cypher queries (Step 0)

### 1. Minimum jQAssistant labels (Java scan)

```cypher
MATCH (n)
WITH labels(n) AS lbs
UNWIND lbs AS l
WITH collect(DISTINCT l) AS all_labels
RETURN
  'Type'     IN all_labels AS has_type,
  'Method'   IN all_labels AS has_method,
  'Package'  IN all_labels AS has_package,
  'Artifact' IN all_labels AS has_artifact
```

Pass: all four flags are `true`.

### 2. Custom concept labels (after `jqassistant:analyze`)

```cypher
MATCH (n)
WITH labels(n) AS lbs
UNWIND lbs AS l
WITH collect(DISTINCT l) AS all_labels
RETURN
  'Controller'          IN all_labels AS has_controller,
  'Service'             IN all_labels AS has_service,
  'Repository'          IN all_labels AS has_repository,
  'ApiLayer'            IN all_labels AS has_api_layer,
  'DomainLayer'         IN all_labels AS has_domain_layer,
  'InfrastructureLayer' IN all_labels AS has_infra_layer
```

Pass: all six flags are `true`. If `false`, run `mvn -Pjqassistant jqassistant:analyze`.

### 3. Node count sanity

```cypher
MATCH (n) RETURN count(n) AS total_nodes
```

Pass: `total_nodes > 0`.

### 4. Java type count

```cypher
MATCH (t:Java:Type) RETURN count(t) AS java_types
```

Pass: `java_types > 0`. If `0`, re-run `jqassistant:scan`.

---

## Custom rules in `jqassistant/rules/`

This project's rules file: `jqassistant/rules/smart-assessment-microservices-core-rules.xml`

Active concepts:

| Concept ID | What it labels |
| --- | --- |
| `smart-assessment-microservices-core:MarkSpringController` | `@RestController` / `@Controller` → `:Controller` |
| `smart-assessment-microservices-core:MarkSpringService` | `@Service` → `:Service` |
| `smart-assessment-microservices-core:MarkSpringRepository` | `@Repository` → `:Repository` |
| `smart-assessment-microservices-core:MarkApiLayer` | `:Controller` → `:ApiLayer` |
| `smart-assessment-microservices-core:MarkDomainLayer` | `:Service` + domain packages → `:DomainLayer` |
| `smart-assessment-microservices-core:MarkInfrastructureLayer` | `:Repository` + infra packages → `:InfrastructureLayer` |

Active constraints:

| Constraint ID | What it checks |
| --- | --- |
| `ControllerMustNotDependOnRepository` | No direct `@Controller` → `@Repository` dependency |
| `DomainMustNotDependOnInfrastructure` | No `:DomainLayer` → `:InfrastructureLayer` dependency |
| `ApiLayerMustNotDependOnInfrastructure` | No `:ApiLayer` → `:InfrastructureLayer` dependency |
| `NoCyclicPackageDependencies` | No cyclic package-level dependencies |

Base package: `com.dkt.smartassessment`

---

## Scripts and tools

All scripts live under `.github/skills/rvng-jqassistant-analysis/scripts/`.

| Script | Purpose |
| --- | --- |
| `jqassistant_manager.py` | **Main interactive manager** — all setup, scan, analysis, graph-rag, and check steps via a numbered menu |
| `jqassistant-verify.py` | Preflight verifier: checks bolt URI, plugin coordinates, `.jqassistant.yml` |
| `jqassistant-install.py` | Install jQAssistant (called by manager A1) |
| `jqassistant-clean.py` | Remove jQAssistant store and generated files |
| `graph-rag-install.py` | Clone and initialise graph-rag tool (called by manager A2) |
| `graph-rag-verify.py` | Verify graph-rag environment and Neo4j connectivity |
| `graph-rag-clean.py` | Remove graph-rag venv and clone |
| `check-graph.py` | Graph health checker (modes: `java`, `config`, `jpa`, `testing`) |
| `generate-mermaid.py` | Generate Mermaid DSL from Cypher JSON output |
| `graph-rag-llm-model-dwn.py` | Download the sentence-transformer model for offline use |

### `check-graph.py` modes

```bash
# Java type, stereotype, layer, enrichment checks
python3 check-graph.py --mode java

# Graph schema, APOC, label/relationship inventory, embedding state
python3 check-graph.py --mode config

# JPA/Hibernate: @Entity, @Repository, relationship mappings, transactions
python3 check-graph.py --mode jpa

# Test coverage: JUnit 5, @MockBean, Testcontainers, @Test method counts
python3 check-graph.py --mode testing
```

---

## Mermaid generation pipeline

```bash
python3 .github/skills/rvng-jqassistant-analysis/scripts/generate-mermaid.py \
  --input result.json \
  --diagram-type component \
  --output documentation/technical/arc42/05_building_block_view.md
```

Input JSON format:

```json
[{"source": "OrderService", "target": "PaymentService", "rel_type": "DEPENDS_ON"}]
```

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `jqassistant-report.xml` is empty | No rule groups active during `analyze` | Add a group to `analyze.groups` in `.jqassistant.yml` |
| Plugin resolution error | Plugin entry is a plain string, not a mapping | Ensure each plugin has `group-id`, `artifact-id`, `version` |
| `java:Default` group not found | Built-in group unavailable | Remove from `analyze.groups`; keep the project custom group |
| `NEO4J_BOLT_URL` not found | Env var not set | Export `NEO4J_BOLT_URL` or set `bolt-uri` in `.jqassistant.yml` |
| IDE XSD 403 error on rules XML | IDE tries to fetch jQAssistant XSD remotely | Cosmetic — jQAssistant resolves it internally; ignore |
| `jqassistant:server` stops immediately | No stdin connected (common on macOS) | Use `tail -f /dev/null \| mvn -Pjqassistant jqassistant:server` |

---

## References

- [jQAssistant Documentation](https://github.com/jqassistant)
- [Awesome Procedures On Cypher for Neo4j](https://github.com/neo4j-contrib/neo4j-apoc-procedures)

---

Last updated: 2026-05-13
