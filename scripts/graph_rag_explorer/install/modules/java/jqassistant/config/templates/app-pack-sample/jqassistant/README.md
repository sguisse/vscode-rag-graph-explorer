# Application pack (versioned in the application repository)

Copy this folder to `<application repo>/jqassistant/`. `.token-razor/` is git-ignored, so everything the installer generates is
reproducible but not versioned: keep the application decisions here.

| File | Purpose | Consumed by |
|---|---|---|
| `sam-rules.xml` | Application decision rules (`sam-*`), group `sam:Default` | installer copies every `*.xml` to the jQAssistant rules directory |
| `sam-audit.xml` | Group `sam:Audit` = `gp:Default` + `sam:Default` + `spring-transaction:Default` | installer adds every group id ending with `:Audit` to `analyze.groups` |
| `rule-parameters.yml` | Values of the portable rule parameters | installer injects it into `analyze.rule-parameters` |
| `audit-rule-map.yaml` | Audit ID -> covering rules | graph-rag `--audit-rule-map` |

Rename `sam` for another application. Rules named in the audit that are not implemented yet (for example `sam-ops:*`, `sam-test:*`,
`sam-data:*`, `sam-sec:AclScopedLookups`) are reported as "not automatable" by the coverage linker until added here.

## Graph model facts verified with jQAssistant 2.9.1 (embedded Neo4j v5)

- Library classes that are not scanned (JDK, Spring jars) appear as placeholder `:Method` nodes that carry `signature` but **no `name`**.
  Rules derive the name with `coalesce(m.name, last(split(split(m.signature, '(')[0], ' ')))`.
- Third-party supertypes are not expanded: match the direct supertype by `fqn` (for example `org.springframework.data.*Repository`).
- A call is linked to the method declared by the **static receiver type** (for example `InvoiceRepository#save`, not `CrudRepository#save`).
- Annotation attributes: `(a)-[:HAS]->(:Value {name, value})`, arrays through `[:CONTAINS]`.
- YAML 2: `(:Yaml:File)-[:HAS_DOCUMENT]->(:Document)-[:HAS_MAP]->(:Map)-[:HAS_KEY]->(:Key {name})-[:HAS_VALUE]->(:Scalar|:Map|:Sequence)`, `HAS_ITEM` for sequences.
- Maven: `(:Maven:Pom)-[:DECLARES_DEPENDENCY]->(:Dependency)-[:TO_ARTIFACT]->(:Artifact {group, name})`, `-[:USES_PLUGIN]->(:Plugin)-[:IS_ARTIFACT]->(:Artifact)`, `-[:HAS_EXECUTION]->()-[:HAS_GOAL]->(:ExecutionGoal {name})`.
- One rule with a Cypher error aborts the whole `analyze` run; every rule is therefore executed against a fixture before shipping.
- Concepts already applied are skipped unless `analyze.execute-applied-concepts: true` (set in the template).
