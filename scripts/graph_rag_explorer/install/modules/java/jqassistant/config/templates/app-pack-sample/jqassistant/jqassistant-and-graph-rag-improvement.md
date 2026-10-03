# jQAssistant & jQAssistant Graph-RAG — improvement plan to cover audit-v3 remarks

Scope: `smart-assessment-modulith` @ `49432cc`, jQAssistant CLI 2.9.1 (Neo4j v5), audit sources in `audit/v3/`
(`audit-v3-report.md`, `audit-v3-compliance-matrix.md`, `audit-v3-Modulith_Audit_Plan.md`).
Status: **implemented in `scripts/`** (rule packs `templates/rules/*.xml`, application pack sample `templates/app-pack-sample/`, installer wiring,
graph-rag audit overlay). Rule packs were validated against jQAssistant 2.9.1 on a fixture project (see the README of the sample
application pack for the graph-model facts verified in Phase 0). Still open: rules marked "not automatable" in §7.2 (sam-ops / sam-test /
sam-data), Flyway / Thymeleaf / Docker rules beyond the graph-rag facts importer, §7 delivery as a `jqassistant-goodpractice-plugin` jar.

---

## 1. Diagnosis — why the audit remarks are not covered today

| # | Observation | Consequence |
|---|---|---|
| 1 | `smart-assessment-modulith-rules.xml` = **48 concepts, 0 constraints**; last `jqassistant-report.xml` = 0 constraint results | No audit remark is checked or reported |
| 2 | `target/test-classes` (287 classes) not scanned | EPIC-1, EPIC-14, R-01, R-02, D13, SF-45…48 impossible; `LinkTestsToCode` links nothing |
| 3 | `pom.xml` scanned, bundled **XML** and **YAML 2** plugins loaded, but no rule uses them | Dependency / CI / config remarks unchecked (7-3, 12-x, 15-x, 1-13, D08, SF-41, SF-42) |
| 4 | `org.jqassistant.plugin:jqassistant-spring-plugin:2.9.0` not installed | Ready-made `spring-transaction:*`, `spring-component:*`, `spring-mvc:*`, `spring-injection:*` unused |
| 5 | Old rule namespace (`buschmais…/v1.0`), no `requiresConcept` | Label-consuming concepts depend on execution order |
| 6 | Broken concepts (see §10) | e.g. `LinkSpringValueProperties` and `MarkComposition` match nothing, `MarkDeadCodeCandidates` flags almost every bean |
| 7 | Installer rewrites `<project>-rules.xml` and `.jqassistant.yml` from templates; `.token-razor/` is git-ignored (`.gitignore:58`) | Manual edits are lost and never versioned |
| 8 | graph-rag only normalises structure and generates summaries; `jacoco_importer` imported but never called | Findings and violations are not graph nodes, not linked to code, not queryable via MCP |

---

## 2. Rule organisation — two axes plus one application layer

```
                    ┌──────────────────────────── CROSS-CUTTING PACKS (xc-*) ─────────────────────────────┐
                    │ xc-transactional · xc-resilience · xc-security · xc-architecture · xc-data-integrity │
                    │ xc-observability · xc-performance · xc-testing · xc-supply-chain · xc-code-health    │
                    └──────────────▲───────────────────────────── consume abstract labels ────────────────┘
                                   │ providesConcept
 ┌──────────────────────────── TECHNOLOGY PACKS (tech-*) ──────────────────────────────────────────────────┐
 │ java · spring-core · spring-web · spring-security · spring-modulith · jpa-hibernate · postgres-flyway   │
 │ kafka · redis · http-clients · resilience4j · scheduling-quartz · jackson · scripting · office-poi      │
 │ thymeleaf · mail · object-storage · logging · junit5-testing · maven · github-actions · docker           │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 ┌──────────────── APPLICATION PACK (sam-*) — smart-assessment-modulith only ──────────────────────────────┐
 │ parameters · convention providers · decision rules (D01–D13) · severity overrides · audit-rule map       │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 L0 built-in plugins reused as-is: java, junit, maven3, xml, yaml2, json, spring 2.9.0
```

### 2.1 Placement rule (which file does a rule go into?)

| Situation | Goes into |
|---|---|
| Needs only the elements of **one technology** (e.g. 2-arg `setIfAbsent` in Redis) | `tech-<technology>.xml` |
| Combines **two or more technologies** through a transversal need (e.g. Kafka send *inside* a JPA transaction) | `xc-<need>.xml`, using **abstract labels** that tech packs provide |
| Encodes a **decision or name of this application** (module list, schemas, `/feign/**`, `GexListener`, D02 outbox…) | `sam-*.xml` |

Technology packs never reference cross-cutting packs. Cross-cutting packs never name a library type directly; they only
use abstract labels. Neither layer mentions smart-assessment. This keeps tech + xc packs reusable by any Spring Boot
application. A rule whose technology is absent simply returns 0 rows.

### 2.2 Abstract label contract (the "interface" between tech and xc packs)

Each abstract concept is declared once in the consuming xc pack. Tech packs contribute to it with
`<providesConcept refId="…"/>`, the same mechanism the official Spring plugin uses.

| Abstract concept → label | Meaning | Provided by |
|---|---|---|
| `xc-res:OutboundCall` → `:OutboundCall` (Method) | Leaves the process (network) | http-clients, kafka (send), redis, mail, object-storage, spring-security (JWKS fetch) |
| `xc-tx:SideEffectCall` → `:SideEffectCall` (Method) | Non-rollbackable effect | kafka (send), mail, http-clients, object-storage, spring-web (`SseEmitter#send`) |
| `xc-tx:RepositoryWrite` → `:RepositoryWrite` (Method) | DB write | jpa-hibernate (`save*`, `delete*`, `@Modifying`) |
| `xc-tx:TransactionalMethod` | Runs in a TX | spring plugin `spring-transaction:TransactionalMethod` |
| `xc-perf:HeavyWork` → `:HeavyWork` | CPU/memory heavy or blocking | office-poi, scripting, http-clients |
| `xc-res:TimeoutConfigured` → `:TimeoutConfigured` (Type) | Client built with timeouts | http-clients, redis, kafka (YAML) |
| `xc-res:ResilienceGuarded` → `:ResilienceGuarded` (Method) | Retry / CB / bulkhead / time limiter | resilience4j (annotations + programmatic decorators) |
| `xc-res:MessageConsumer` → `:MessageConsumer` | Inbound async entry point | kafka (`@KafkaListener`), spring-core (`@EventListener`, `@TransactionalEventListener`), spring-modulith (`@ApplicationModuleListener`), scheduling-quartz (Job) |
| `xc-res:ScheduledJob` → `:ScheduledJob` | Periodic execution | spring-core (`@Scheduled`), scheduling-quartz |
| `xc-res:DistributedLock` → `:DistributedLock` | Multi-pod mutual exclusion | scheduling-quartz (`@DisallowConcurrentExecution` + clustered), ShedLock, redis lock helpers |
| `xc-res:IdempotencyStore` → `:IdempotencyStore` (Type) | Processed-message / inbox store | parameter `idempotencyTypeRegex` (app) |
| `xc-sec:Endpoint` → `:Endpoint{httpMethod, fullPath}` | HTTP entry point | spring-web |
| `xc-sec:Authorized` → `:Authorized` | Method/class carries authorization | spring-security (`@PreAuthorize`, `@Secured`, `@RolesAllowed`) |
| `xc-sec:SensitiveValue` → `:SensitiveValue` | Field/getter holding secrets/PII | parameter `sensitiveRegex` |
| `xc-arch:Module`, `:NamedInterface`, `:Open` | Module boundaries | spring-modulith (default convention), app may override |
| `xc-test:TestType` → `:Test` | Test-scope type | junit5-testing (artifact `*/test-classes`) |
| `java:AssertMethod` (built-in) | Assertion | junit5-testing (AssertJ, Mockito `verify`), spring plugin (`ResultActions`, `ApplicationModules#verify`) |

### 2.3 File and delivery layout

| Artifact | Location | Reuse |
|---|---|---|
| `tech-*.xml`, `xc-*.xml` | Short term: `.token-razor/scripts/graph_rag_explorer/install/modules/java/jqassistant/config/templates/rules/`, copied **verbatim** (no `{{PROJECT_NAME}}`) by `install.py` into `rules_dir`. Target: an internal `jqassistant-goodpractice-plugin` jar listed under `plugins:` | Any application |
| Current enrichment concepts (graph-rag labels) | `tech-*/xc-*` concepts + small `enrichment-graph-rag.xml`; the project template keeps only project-name-specific parts | Any application |
| `sam-*.xml`, `audit-rule-map.yaml`, `graph-model-notes.md` | **Application repository**, `jqassistant/` (versioned); installer copies them into `rules_dir` | This app only |
| graph-rag code | Installer source: `.token-razor/scripts/graph_rag_explorer/install/modules/java/jqassistant_graph_rag/git-clone/` (never edit `target/`) | Generic importers; SAM data via parameters |

Groups:

- `tech-<x>:Default` and `xc-<need>:Default` per file.
- `gp:Default` = all tech + xc defaults (portable).
- `xc-<need>:Default` also includes the tech constraints that serve that need, so a team can enable a single
  transversal view (for example "resilience only").
- `sam:Audit` = `gp:Default` + `spring-transaction:Default` + `java:TestMethodWithoutAssertion` + `sam-*:Default` +
  graph-rag enrichment group, with `<includeConstraint refId="…" severity="…"/>` overrides.
- `.jqassistant.yml` → `analyze.groups: [sam:Audit]`.

---

## 3. Non-blocking policy — violations are **indicated**, never block the analysis

| # | Mechanism | Setting / action | Current state |
|---|---|---|---|
| 1 | Violations do not fail the run | `jqassistant.analyze.report.continue-on-failure: true` → exit code 0 even with violations | ✅ already set |
| 2 | Severity is information only | `fail-on-severity: BLOCKER` only *labels* blocker results as "FAILURE" in the report; `warn-on-severity: INFO` so every lower result is shown as "WARNING" | change (today MAJOR / MINOR) |
| 3 | Known debt stays visible | `baseline.enabled: false`. The jQA baseline **hides** known violations, which is not wanted. "Known vs new" is computed in graph-rag (`firstSeen` / `lastSeen` per violation) instead | keep disabled |
| 4 | A missing or empty provider concept does not stop consumers | `rule.required-concepts-are-optional-by-default: true` | ✅ already set |
| 5 | Scan errors do not stop the scan | `scan.continue-on-error: true` | ✅ already set |
| 6 | A **broken rule** (Cypher error) must not abort other rules | Phase 0: verify jQA 2.9.1 behaviour on a deliberately broken rule. If it aborts, the analyzer runs **one `analyze` per pack group** (generated per-pack config) and continues on non-zero exit codes. In all cases, every rule is validated on fixtures in CI before shipping (§9) | to verify |
| 7 | Slow rules are flagged, not killed | `warn-on-execution-time-seconds: 5`; no unbounded `*` paths (cap `*1..3`) | partly |
| 8 | Analyzer wrapper never turns violations into errors | `analyser/tools/java/jqassistant/analyzer.py`: log a non-zero `analyze` exit code as **warning**, always parse the XML report and print a per-severity summary; run `analyze` even after a partial scan | change |
| 9 | graph-rag runs whatever jQA produced | `analyser/runner.py` already isolates each analyser (try/except, sequential); graph-rag overlay imports a partial or absent report and says so | ✅ isolation exists; overlay to add |
| 10 | Where violations are indicated | jQA HTML/XML report (per rule: SUCCESS / WARNING / FAILURE label), console summary, Neo4j `VIOLATES` relationships with severity, MCP `get_audit_coverage()`, generated `audit-compliance-dashboard.md` | to add (except report) |

A CI gate can be added later as a separate, opt-in step. It would read the dashboard and fail only on *new* blockers.
The analysis itself always completes.

---

## 4. Prerequisites — scan and configuration (yml template + app overrides)

1. Plugins: add `org.jqassistant.plugin:jqassistant-spring-plugin:2.9.0`; check whether `jqassistant-openapi-plugin`
   (reported `<unknown version>`) is still needed.
2. Scan `java:classpath::<root>/target/test-classes` and add concept `tech-junit5:TestType` that provides
   `xc-test:TestType`. It labels `:Test` all types contained in an artifact whose `fileName` ends with `test-classes`.
3. YAML 2 scan: `src/main/resources/**/*.y*ml`, `.github/workflows/*.yml`. Optional: `README.md`, `docs/**` (file
   presence checks).
4. `analyze.rule-parameters`: all `sam` values (§7.1).
5. Report settings per §3.
6. **Phase 0 graph-model probe (mandatory before writing Cypher).** Run one query per model and record the real
   names in `jqassistant/graph-model-notes.md`:
   - annotation values: `(a)-[:HAS]->(:Value{name})`, arrays via `:CONTAINS`, enums via `:IS`
   - method line properties: `firstLineNumber` / `lastLineNumber`
   - Maven: `DECLARES_DEPENDENCY` / `TO_ARTIFACT` / `USES_PLUGIN` / `HAS_EXECUTION` / `HAS_GOAL`
   - YAML 2: document / key / value structure
   - behaviour of a deliberately broken rule (§3 item 6)

---

## 5. Technology packs (`tech-*`) — reusable

Columns: what the pack **labels** (concepts, often providing abstract labels) and what it **checks** on its own
(constraints). The last column lists smart-assessment audit references, kept only in `audit-rule-map.yaml`.

| Pack | Labels (concepts) | Checks (constraints) · default severity | Covers here |
|---|---|---|---|
| `tech-java` | `:Clock` usage | `BareRuntimeException` minor · `NoArgOrElseThrow` minor · `MultipleExceptionRoots` info · `WeakRandom` (`java.util.Random`, `Math.random`) major · `NonInjectableClock` (`now()`, `ZoneId.systemDefault()`) minor · `UnreferencedType` (replaces `MarkDeadCodeCandidates`) minor · `TemporaryOrDiagnosticCode` (param regex) major · `DuplicateSimpleNames` major · `ForbiddenNamingTokens` (param) minor | SF-49, SF-08, SF-29, SF-47, SF-50, SF-04, SF-43, EPIC-3, R-07, R-08 |
| `tech-spring-core` | `:ScheduledJob` (`@Scheduled`), `:MessageConsumer` (`@EventListener`, `@TransactionalEventListener`), `:AsyncMethod` | `AsyncWithoutExecutorName` major · `StringWiredDependsOn` minor · reuse `spring-injection:Default` | SF-33, SF-43 |
| `tech-spring-web` | `:Endpoint{httpMethod, fullPath}` (class + method mapping), `:SideEffectCall` (`SseEmitter#send`) | `ExceptionMessageReturnedToClient` major · `MultipleControllerAdvicesWithoutOrder` major · `RequestBodyWithoutValidation` minor · `ByteArrayOnRequestPath` minor · `CookieWithoutHttpOnly` major | SF-18, SF-49, 3-3, SF-17, SF-36, SF-08 |
| `tech-spring-security` | `:Authorized`, `:OutboundCall` (JWKS) | `PrefixBasedUrlValidation` (`String#startsWith` in `*redirect*` / `*whitelist*` / `*origin*`) major | SF-08 |
| `tech-spring-modulith` | `:Module` (direct sub-packages of `@SpringBootApplication` + `@ApplicationModule`), `:Open`, `:NamedInterface`, `(:Module)-[:DEPENDS_ON_MODULE{weight}]->(:Module)`, `:MessageConsumer` (`@ApplicationModuleListener`) | `ModuleCycle` critical · `ModuleInternalAccess` major · `OpenModuleMustNotDependOnModules` critical · `CrossModuleEventWithoutRegistry` (`@EventListener` instead of `@ApplicationModuleListener`) major | 5-2, D07, V3-A3-a-02/03, V3-A3-b-01/02, 3-5, 15-4, SF-22 |
| `tech-jpa-hibernate` | `:Entity`, `:RepositoryWrite`, `:RepositoryRead`, `:EntityTable{schema, table}` | `EntityWithoutSchema` critical · `DuplicateTableMapping` major · `FloatingPointNumericField` minor · `EntityWithoutVersion` info · `UnboundedRepositoryQuery` (List without Pageable/Sort/Top) minor · `MultipleRevisionEntities` major | R-10, 6-1, SF-29, SF-23, SF-35, D11 |
| `tech-postgres-flyway` | YAML: datasource / Hikari / JPA properties. SQL facts come from graph-rag (§8.5) | `OpenInViewEnabled` major · `HikariPoolTooLarge` (param) major · `JdbcTimeZoneMissing` minor · graph-rag checks: `DestructiveMigration` (`TRUNCATE` / `DROP`), `MissingSearchIndexes` (`pg_trgm` / GIN), `MissingSchemaDdl` (`CREATE TABLE sa_*`) | SF-34, SF-29, V3-A2-e-01, 7-2b, 17-5, 4-3…4-6 |
| `tech-kafka` | `:OutboundCall` + `:SideEffectCall` (`KafkaTemplate#send`), `:MessageConsumer` (`@KafkaListener`) | `ProducerAcksZero` (YAML) critical · `ProdTopicDefaults` (YAML `${…:prod…}`) major · `ListenerWithoutDeadLetter` minor · `KafkaStreamsResidue` major | SF-37, SF-41, 11-1, 7-3 |
| `tech-redis` | `:OutboundCall` (`RedisTemplate` / `*Operations`), `:DistributedLock` (lock helpers) | `LockWithoutTtl` (2-arg `setIfAbsent`, set/list writes without `expire`) major · `UnsafeSerializerDefaultTyping` (`activateDefaultTyping` on Redis serializer) critical · `EmptyPasswordDefault` (YAML) major | SF-27, SF-10 |
| `tech-http-clients` | `:OutboundCall` + `:SideEffectCall` (RestClient / RestTemplate / WebClient), `:TimeoutConfigured` | `ClientWithoutTimeout` major | SF-32, D01, 9-10, 10-4 |
| `tech-resilience4j` | `:ResilienceGuarded` (`@Retry`, `@CircuitBreaker`, `@Bulkhead`, `@TimeLimiter`, `@RateLimiter`, programmatic decorators). Replaces `MarkResilience*` concepts | – (consumed by `xc-resilience`) | D01, 9-10 |
| `tech-scheduling-quartz` | `:ScheduledJob` (Quartz `Job`), `:DistributedLock` (`@DisallowConcurrentExecution`, ShedLock `@SchedulerLock`) | `QuartzNotClustered` (YAML) critical · `JobsRecreatedAtStartup` minor | SF-28 |
| `tech-jackson` | – | `DefaultTypingEnabled` critical · `ConvertValueHops` (`ObjectMapper#convertValue` in ModuleApi impls) minor | SF-10, V3-A3-b-04, V3-A3-a-06 |
| `tech-scripting` | `:HeavyWork` | `ScriptEvaluation` (Rhino `evaluateString` / `initStandardObjects`, `ScriptEngine#eval`, `GroovyShell`, SpEL `parseExpression`) blocker · `OpenClassShutter` blocker | SF-14 |
| `tech-office-poi` | `:HeavyWork` | `InMemoryWorkbook` (`XSSFWorkbook` / `HSSFWorkbook` instead of SXSSF / streaming) minor · `WorkbookNotClosed` minor | SF-19 |
| `tech-thymeleaf` | graph-rag facts (templates are not well-formed XML) | `UnescapedOutput` (`th:utext`) major | SF-15 |
| `tech-mail` | `:OutboundCall` + `:SideEffectCall` (`JavaMailSender#send`) | – | SF-20, SF-32 |
| `tech-object-storage` | `:OutboundCall` + `:SideEffectCall` (GCS / OSS clients) | – | SF-20, SF-32, SF-36 |
| `tech-logging` | `:LogCall` (SLF4J `Logger#*`) | `QueryStringLogged` (`getQueryString` + log call) critical · `NoStructuredLogging` (YAML / logback) major | SF-09, 15-2 |
| `tech-junit5-testing` | `:Test`, providers of `java:AssertMethod` (AssertJ, Mockito `verify`) | reuse `java:TestMethodWithoutAssertion` minor · `ReflectionInTests` (`setAccessible`, `ReflectionTestUtils`) major · `ModuleApiAlwaysMocked` minor | SF-47, D13, V3-A6-a-03, R-01, V3-A6-c-07, V3-A6-b-08 |
| `tech-maven` | `:Dependency` facts | `ForbiddenDependency` (param) major · `RequiredDependency` (param) major · `CoverageGateMissing` (jacoco without `check`) critical · `EnforcerMissing` minor · `GeneratedSourcesInSrc` (`@AvroGenerated` in main) minor | 7-3, D03, D09, 12-2, 9-14, SF-14, 15-1, 15-4, 1-13, R-12, SF-42 |
| `tech-github-actions` | Workflow steps (YAML 2) | `CiSkipsTests` (`-DskipTests` / `-DskipITs`) critical · `UnpinnedActions` major | 1-13, R-02, 17-2, V3-A1-11, SF-42 |
| `tech-docker` | graph-rag facts | `FloatingBaseImage` major · `NoJvmContainerFlags` minor | 13-1, SF-41 |

---

## 6. Cross-cutting packs (`xc-*`) — transversal needs

Each xc rule uses only abstract labels from §2.2, so it works for any technology mix.

### 6.1 `xc-transactional` — transactional services

| Rule | Logic (abstract) | Sev | Covers |
|---|---|---|---|
| reuse `spring-transaction:TransactionChangingMethodMustNotBeInvokedFromSameClassOrSubclass`, `…PrivateMethodMustNotBeAnnotatedWithTransactional` | Proxy bypass | major | SF-21 |
| `xc-tx:SideEffectInTransaction` | `:Transactional` method `-[:INVOKES*1..3]->` `:SideEffectCall` | major | SF-20, SF-31, D02, D05, V3-A5-b-07 |
| `xc-tx:WriteInReadOnlyTransaction` | `readOnly=true` method reaches `:RepositoryWrite` | critical | SF-21 |
| `xc-tx:ProgrammaticInsideDeclarative` | `:Transactional` method invokes `TransactionTemplate#execute` | major | SF-21 |
| `xc-tx:RequiresNewNested` | `REQUIRES_NEW` method called from a transactional method | minor | SF-21, SF-34 |
| `xc-tx:HeavyWorkInTransaction` | `:Transactional` reaches `:HeavyWork` / `:OutboundCall` | minor | SF-19, V3-B2-S1-22 |
| `xc-tx:EventPublishedWithoutTxListener` | Event published in a TX and consumed by a plain `@EventListener` | major | SF-22, 10-1 |
| `xc-tx:BrokerSendOutsideOutbox` (param `outboxTypeRegex`) | `KafkaTemplate#send` (`:SideEffectCall` with broker type) outside outbox relay types | major | D02, 10-2, SF-37 |

### 6.2 `xc-resilience` — resilient services

| Rule | Logic (abstract) | Sev | Covers |
|---|---|---|---|
| `xc-res:OutboundWithoutTimeout` | Type issuing `:OutboundCall` without a `:TimeoutConfigured` client | major | SF-32, D01, 9-10 |
| `xc-res:OutboundWithoutGuard` | `:OutboundCall` not reachable from a `:ResilienceGuarded` method | minor | D01, 9-10 |
| `xc-res:ConsumerWithoutIdempotency` | `:MessageConsumer` (broker) never reaches `:IdempotencyStore` | major | 11-2, SF-38 |
| `xc-res:ScheduledWithoutDistributedLock` | `:ScheduledJob` without `:DistributedLock` | critical | SF-28 |
| `xc-res:AsyncWithoutDedicatedExecutor` | `:AsyncMethod` sharing the default / unnamed pool | major | SF-33 |
| `xc-res:LockWithoutTtl` | `:DistributedLock` acquisition without expiry | major | SF-27 |
| `xc-res:CrossModuleEventWithoutRegistry` | `:MessageConsumer` (in-process) in another module, not registry-backed | major | 15-4, SF-22 |

### 6.3 Other cross-cutting packs

| Pack | Rules (abstract) | Covers |
|---|---|---|
| `xc-security` | `EndpointWithoutAuthorization` (`:Endpoint` not `:Authorized`, param `publicPathRegex`) major · `DestructiveEndpointWithoutAdmin` (params `destructivePathRegex`, `adminExprRegex`) blocker · `InternalPathExposed` (param `internalPathRegex`) critical · `SensitiveDataLogged` (`:LogCall` + `:SensitiveValue` in same method) critical · `ByIdLoadBehindAuthorization` (`:Authorized` endpoint reaches `findById` / `findAllById` / `getReferenceById` within 3 hops) info, review list | SF-05, SF-03, SF-04, SF-01, 9-6, 9-13, SF-09, V3-B0-02, SF-02, SF-06 |
| `xc-architecture` | Group view over `tech-spring-modulith` + `tech-java` naming / duplicates + reuse `spring-component:Default` layering | D07, 5-2, EPIC-3, SF-43 |
| `xc-data-integrity` | `EntitySchemaOwnership` (param `moduleSchemas`) major · `CrossModuleEntityOrRepositoryUse` major · `SingleIdGenerator` (param) major | 4-3…4-6, D06, D10, 4-7, 6-4, SF-25, SF-26 |
| `xc-observability` | `MetricsRegistryMissing`, `StructuredLoggingMissing`, `GracefulShutdownMissing`, `HealthIndicatorPerDependency` (one `HealthIndicator` per `:OutboundCall` target type) | 15-1, 15-2, 15-3, SF-41, SF-40 |
| `xc-performance` | Group view: `UnboundedRepositoryQuery`, `ByteArrayOnRequestPath`, `InMemoryWorkbook`, `HeavyWorkInTransaction` | SF-35, SF-36, SF-19 |
| `xc-testing` | `ModuleWithoutModuleTest` major · `ModuleApiWithoutTest` major · `ConsumerWithoutTest` (`:MessageConsumer` not referenced by `:Test`) major · `NoSecurityTests` critical · `ModulithVerifyMissing` critical · `DocumenterMissing` minor · `EndpointWithoutTest` minor | 14-1…14-4, 1-2…1-4, 9-15, 1-6, 1-7, SF-46, SF-45, R-04, 14-6, 1-9…1-11 |
| `xc-supply-chain` | Group view over `tech-maven` + `tech-github-actions` + `tech-docker` | 1-13, R-12, SF-42, 13-1 |
| `xc-code-health` | Group view over `tech-java` + `tech-jackson` code rules; copy-paste similarity computed by graph-rag (§8.6) | SF-49, SF-50, SF-51 |
| `xc-documentation` | `RequiredDocumentation` (param list of paths / globs, file presence) | EPIC-2, 18-1, 18-7 |

### 6.4 Rule-writing conventions (all packs)

- Constraints only read; concepts write with idempotent `MERGE` / `SET`.
- No unbounded variable-length paths (`*1..3` maximum).
- Every constraint returns `Element, Fqn, Detail` (+ `File, Line` when available) and declares
  `<report primaryColumn="Element"/>`. The graph-rag importer relies on these columns.
- Parameters always have safe defaults (`<requiresParameter … defaultValue="…"/>`), so a pack runs unconfigured.
- Description = problem + remediation. No application names and no audit IDs in tech / xc packs.
- Rule schema namespace `http://schema.jqassistant.org/rule/v1.10`.

Example (generic, parameterised, abstract labels):

```xml
<constraint id="xc-tx:SideEffectInTransaction" severity="major">
  <requiresConcept refId="xc-tx:TransactionalMethod"/>
  <requiresConcept refId="xc-tx:SideEffectCall"/>
  <description>Non-rollbackable side effects must run after commit (outbox / @TransactionalEventListener(AFTER_COMMIT)).</description>
  <cypher><![CDATA[
    MATCH (tx:Method:Transactional)-[:INVOKES*1..3]->(effect:Method:SideEffectCall)
    MATCH (t:Type)-[:DECLARES]->(tx)
    RETURN DISTINCT tx AS Element, t.fqn AS Fqn, effect.signature AS Detail
  ]]></cypher>
  <report primaryColumn="Element"/>
</constraint>
```

```xml
<concept id="tech-kafka:ProducerSend">
  <providesConcept refId="xc-tx:SideEffectCall"/>
  <providesConcept refId="xc-res:OutboundCall"/>
  <description>Labels KafkaTemplate send methods.</description>
  <cypher><![CDATA[
    MATCH (:Type{fqn:'org.springframework.kafka.core.KafkaTemplate'})-[:DECLARES]->(m:Method)
    WHERE m.name STARTS WITH 'send'
    SET m:SideEffectCall:OutboundCall
    RETURN m
  ]]></cypher>
</concept>
```

---

## 7. Application pack (`sam-*`) — smart-assessment-modulith

### 7.1 Parameters (`analyze.rule-parameters`)

| Parameter | Value |
|---|---|
| `moduleSchemas` | `core=sa_core;assessment=sa_assessment;grid=sa_grid;supplier=sa_supplier;kit=` (kit: `@MappedSuperclass` only) |
| `internalPathRegex` | `/feign/.*` |
| `destructivePathRegex` | `.*/(migrate|temp|clear|reload|load_acl_preset|sync).*` |
| `publicPathRegex` | from the `permitAll` list of `application-security.yaml` |
| `adminExprRegex` | admin roles used in `@PreAuthorize` (to confirm) |
| `forbiddenNameRegex` | `(?i).*(feign|fegin|microservicekit|nacos).*` (package `supplier/application/supplier/service/fegin` exists) |
| `forbiddenDependencies` | `org.mozilla:rhino`, `.*kafka-streams.*`, `.*elasticsearch.*`, `org.springframework.cloud:.*`, `.*nacos.*`, `.*openfeign.*` |
| `requiredDependencies` | `micrometer-registry-prometheus`, `spring-modulith-events-jpa`, `resilience4j-spring-boot3`, `shedlock-spring`, JSON log encoder |
| `outboxTypeRegex` · `idempotencyTypeRegex` · `sensitiveRegex` · `allowedKafkaProducerRegex` | to agree with the architect (D05: GEX + PDF/Document boundaries only) |
| `executorNames` | `publish, acl, notification, pdf, gex` (SF-33 target) |
| `requiredDocs` | Feign / ModuleApi call map, Kafka flow map, DB cross-access, ACL duplication, ADR folder, rollback plan |

### 7.2 Decision rules (application-specific constraints)

| Rule | Check | Sev | Audit refs / backlog |
|---|---|---|---|
| `sam-arch:ModuleApiOwnership` | `Assessment/Grid/Supplier*ModuleApi` must not live in `core.application.moduleapi` | critical | V3-A3-a-02, V3-A3-b-01, 5-2, EPIC-32 |
| `sam-arch:AllowedModuleDependencies` | Explicit D07 matrix (to confirm) | critical | D07, 5-2 |
| `sam-arch:KitCoreTwins` | KafkaConnectionProperties, SecurityConfig, *GlobalControllerAdvice, BaseAuditedModel… | major | EPIC-3, SF-43, EPIC-41 |
| `sam-arch:SingleJpaConfiguration` · `NoSpringCloud` | One `@EnableJpaRepositories` / EMF; no `@FeignClient` / `@EnableDiscoveryClient` | critical | R-03, 5-9, D06, 12-1, 9-14 (regression guards) |
| `sam-arch:StreamingCdcEsResidue` | `*Cdc*` types, `UpdateCdcListener`, `AssessmentItemRepository#updateCdc`, ES / Kafka Streams types | major | 7-2a, 7-3, D03, D04 |
| `sam-sec:InternalJwtMintEndpoint` | `IInternalJwtFeignController` endpoints exist | blocker | 9-6, V3-A3-c-01, EPIC-19 |
| `sam-sec:AclBatchCreateExposed` | `/feign/assessments/acl/batchCreate` | blocker | V3-B1-S1-01, SF-01 |
| `sam-sec:MaintenanceCodeInProd` | `MigrateController`, `TestService`, `/temp/**` | blocker | SF-04, EPIC-20 |
| `sam-sec:RhinoForbidden` | any dependency on `org.mozilla.javascript` | blocker | SF-14, EPIC-22 |
| `sam-sec:RedirectWhitelistStartsWith` | `AuthService` redirect validation uses `String#startsWith` | blocker | SF-08, EPIC-21 |
| `sam-sec:QueryStringLogged` | `TokenAuthFilter` | critical | SF-09, EPIC-24 |
| `sam-sec:AclScopedLookups` · `StorageClaimOwnership` | Listed services use `findById` instead of scoped finders / skip ownership check | critical (candidate) | SF-02, SF-06, EPIC-23 |
| `sam-data:AclEntityPerSchema` | grid / supplier depend on kit `EntityRoleAssignment` (`sa_assessment`) | critical | 4-7, 6-4, D10, SF-25, EPIC-25 |
| `sam-data:SingleSnowflakeGenerator` · `SingleRevisionEntity` | Exactly one of each | major | SF-26, D11, 4-9 |
| `sam-msg:InternalTopicsAsEvents` | `KafkaTemplate#send` only from `allowedKafkaProducerRegex` | major | 10-1…10-9, D05, EPIC-29 |
| `sam-msg:PdfThroughOutbox` | PDF producers go through the outbox type | critical | D02, 10-2, 17-6, SF-37, EPIC-27 |
| `sam-msg:GexListenerIdempotent` | `GexListener` reaches the processed-message store | critical | 11-2, SF-38 |
| `sam-msg:ModuleEventsUseRegistry` | `@EventListener` → `@ApplicationModuleListener` | major | 15-4, SF-22 |
| `sam-ops:DocumentClientResilience` | `DocumentRestClientConfig` timeouts; Document adapter guarded | major | D01, 9-10, EPIC-30 |
| `sam-ops:AsyncPoolsPerConcern` | `@Async` uses one of `executorNames` | critical | SF-33, EPIC-30 |
| `sam-ops:StgNamespaceDefault` | `application-services.yaml` default contains `.stg` | major | 5-7 |
| `sam-ops:OptionalConfigImports` · `NacosConfigResidue` | `optional:` imports; `nacos` keys | major | D08, 5-10, R-05, 12-3, D09 |
| `sam-test:ModuleTests` · `ContractTests` · `SupplierItsPresent` | `@ApplicationModuleTest` in core / assessment / grid / supplier; MockMvc test referencing `IAssessmentFeignClient`; `*IT extends BaseIt` | major | 14-1…14-4, 1-5, R-02, EPIC-35 |

Baseline from a code grep (expected first-run indications, not blocking): Rhino in 2 files, `/feign` in 17 files,
`activateDefaultTyping` in 2, `new Cookie(` in 5, `@Async` 15, `@EventListener` 13, `@ApplicationModuleListener` 0,
resilience4j 0, `@ApplicationModuleTest` 0, `setAccessible` in tests 14.

---

## 8. Graph-RAG extension (L3 — audit overlay)

Changes are made in the installer source `…/install/modules/java/jqassistant_graph_rag/git-clone/` (generic code). SAM
inputs (audit folder, rule map) are passed as parameters.

### 8.1 Overlay model (`audit_model.py`)

Nodes:

- `:Audit:Rule{id, pack, axis: tech|xc|sam, severity}`
- `:Audit:Finding{fid, severity, sf, tag, title, fix, source: 'audit-v3'|'jqa'|'fact'}`
- `:Audit:SystemicFinding{id}`
- `:Audit:Requirement{id: '14-1'|'D07'|'R-10', status, target}`
- `:Audit:Epic{id}`
- `:Audit:Run{commit, date}`

Relationships:

- `(code)-[:VIOLATES{severity, firstSeen, lastSeen, commit}]->(:Audit:Rule)`
- `(:Audit:Rule)-[:COVERS]->(:Audit:Finding|:Audit:Requirement)`
- `(:Audit:Finding)-[:LOCATED_IN{startLine, endLine}]->(:SourceFile|:Type|:Method)`
- `(:Audit:Finding)-[:MEMBER_OF]->(:Audit:SystemicFinding)`
- `(:Audit:Finding)-[:TRACKED_BY]->(:Audit:Epic)`

Re-runs update the overlay by key (`fid`, `(ruleId, element)`) instead of duplicating it. Violations that disappear
keep `lastSeen` ("resolved since").

### 8.2 `jqa_report_importer.py`

- Parses `raw_outputs/java/jqassistant/report/jqassistant-report.xml`. A partial report is accepted and missing rules
  are reported.
- Resolves the `Element` / `Fqn` columns to `:Type` / `:Method`, with `File` + `Line` → `:SourceFile` as fallback.
- Rules stay read-only, as jQA expects.

### 8.3 `audit_markdown_importer.py`

- Parses audit-v3 tables:
  - compliance matrix (`ID | Title | Target | Status | Evidence`)
  - report §5 FID rows, SF rows
  - EPIC-19…43 backlog
- Expands location prefixes `M/ R/ T/ A/ C/ G/ S/ K/ CFG/` and `path:line[-line][,line]`.
- Resolves to the method whose line range contains the line.
- Unresolved locations (e.g. Document-service `DS/`) become `:Audit:UnresolvedLocation` and are counted.

### 8.4 `rule_coverage_linker.py` + `audit-rule-map.yaml`

Example mapping entry: `SF-14: [tech-scripting:ScriptEvaluation, sam-sec:RhinoForbidden]`.

The linker computes:

- **confirmed**: the finding location carries a violation of a covering rule
- **resolved?**: a covering rule exists and has no violation; human confirmation needed
- **contradiction**: the audit says ✅ but the rule still fires
- **new candidate**: a violation with no matching finding
- **not automatable**: a finding with no covering rule

### 8.5 `facts_importer.py` — what jQA cannot parse

- **Flyway SQL facts**: `TRUNCATE`, `DROP`, `CREATE INDEX … gin_trgm_ops`, `CREATE TABLE sa_*`.
- **Thymeleaf facts**: `th:utext` occurrences.
- **Dockerfile facts**: base image tag, JVM flags.
- Each fact family has a Cypher check in a `checks/*.cypher` registry that writes `VIOLATES` like a jQA rule, with the
  same severity scale and the same non-blocking behaviour.

### 8.6 Existing data wired in

- Call `jacoco_importer` / `JacocoManager` (Phase 6a): line coverage per ModuleApi / controller → 1-9…1-11, 1-13.
- New surefire / failsafe XML importer → `:TestResult` (red ITs) → R-02, 5-11, 9-15.
- Embedding similarity between method / type summaries → near-duplicate candidates → SF-51, SF-22
  (21 activity-log providers).

### 8.7 RAG and MCP

- Inject attached findings into `prompt_manager` summaries. Add `riskScore` (max severity, count) on Type, Package
  and Module.
  - Note: `analyzer.py` hard-codes `llm_api = "fake"`, so summary injection only becomes useful once a real LLM is
    configured.
- New MCP tools in `mcp_server.py`:
  - `get_audit_findings(entity|file, min_severity)`
  - `get_rule_violations(rule_id)`
  - `get_audit_coverage()`
  - `explain_finding(fid)` (finding + source slice + covering rules + current violation state)
- Update `mcp_visible_neo4j_schema.txt` and `schema_analyzer.py`.
- Generate `audit-compliance-dashboard.md`: per audit ID → status from audit, covering rules, jQA state, new / known.

### 8.8 Plumbing

- New `input_params`: `--audit-dir`, `--jqa-report`, `--audit-rule-map`, `--jacoco-xml`, `--surefire-dir`.
- Pass them from `analyser/tools/java/jqassistant_graph_rag/analyzer.py`.
- Add a new `GraphOrchestrator` phase "Audit overlay" wrapped in `safe_pass`, so overlay errors never stop
  enrichment.

---

## 9. Delivery phases and acceptance criteria

| Phase | Content | Done when |
|---|---|---|
| 0 | Graph-model probe; enable test-classes, Spring plugin, YAML scopes; test broken-rule behaviour (§3 item 6) | `graph-model-notes.md` committed; `:Test` ≈ 287 classes; decision "single run" vs "per-pack runs" recorded |
| 1 | Non-blocking settings + analyzer wrapper changes (§3); fix existing template (§10); migrate to rule schema v1.10; add `requiresConcept` | Run with deliberately failing constraints exits 0 and prints a severity summary; `LinkSpringValueProperties` > 0 |
| 2 | Abstract label contract (§2.2) + tech packs: security-critical first (scripting, spring-web / security, jackson, redis, kafka), then the rest | Each rule has a passing positive and negative fixture in `gp-rules-fixtures` (CI runs jQA on fixtures and compares the XML report) |
| 3 | xc packs: transactional, resilience, security, testing first | xc rules fire on fixtures built only from abstract labels (technology swapped in fixtures still detected) |
| 4 | sam pack + parameters + `audit-rule-map.yaml` | Report shows SF-01 / 04 / 08 / 14 blockers as indications; analysis completes |
| 5 | graph-rag overlay (report, markdown, mapping, facts, jacoco, surefire) | `get_audit_coverage()` returns confirmed / resolved / contradiction / new / not-automatable for all EPIC, R, D and SF IDs |
| 6 | MCP tools, risk score, summary injection, dashboard | `explain_finding("V3-B0-01")` returns code + rule state; dashboard generated |
| 7 | Package `tech-*` + `xc-*` as `jqassistant-goodpractice-plugin` jar; optional opt-in CI gate on *new* blockers only | Second application consumes `gp:Default` with only `rule-parameters` |

---

## 10. Fixes to the existing generated rules (`analysis-rules-template.xml`)

1. Switch to namespace `http://schema.jqassistant.org/rule/v1.10`.
2. Replace the home-made `MarkSpring*` concepts with `spring-component:*` / `spring-mvc:*` through `providesConcept`.
   Add `requiresConcept` wherever a label is consumed (`MarkDomainObject`, `MarkInfrastructure*`,
   `MarkServiceAsUseCases`).
3. `MarkDeadCodeCandidates`: remove the unbounded `(main)-[:DEPENDS_ON|INVOKES*]->(c)`. Beans are reached by
   component scan, not by dependency. Replace with `tech-java:UnreferencedType`.
4. `LinkSpringValueProperties`: read `(a)-[:HAS]->(:Value{name:'value'})`, then link
   `(:Field)-[:USES_PROPERTY]->(<YAML key>)`.
5. `MarkComposition`: `f.type` does not exist; use `(f)-[:OF_TYPE]->(t)` with `t.fqn`.
6. `LinkExceptionToHandlers`: remove the cross product of every throwing method × every handler; match the
   `@ExceptionHandler` value types.
7. `Impact*` concepts label nearly every node (noise for RAG). Replace them with fan-in / fan-out metrics stored as
   properties.
8. `MarkResilience*`, `MarkCaching`, `MarkUsedInBpmn`: move into `tech-resilience4j` / `tech-spring-core` /
   a future `tech-camunda`, outside the SAM audit group (0 hits here).

---

## 11. What stays outside automated checking

| Item | Reason | Handling |
|---|---|---|
| Ops 🔍 rows: EPIC-13 (13-2…13-5), 17-1/3/4/7, 18-2…18-6, 4-1/4-2/4-10/4-11, D12, 11-4, 12-4 | Evidence outside the repository (K8s, platform, environments) | Imported as `:Audit:Requirement` with status "manual" |
| Document-service repo (D04, SF-44, EPIC-38) | Different repository | Scan that repo with the same tech / xc packs |
| Authorization correctness (SF-02 / 03 / 06), scoring and grid integrity (SF-29 / 30), TOCTOU (SF-23 / 31), token lifecycle (SF-11 / 13) | Behavioural, not structural | Candidate lists from rules + `explain_finding` for human or LLM review |
| Documentation content quality (EPIC-2, 18-1, 18-7) | Only file presence can be checked | `xc-documentation:RequiredDocumentation` + review |
