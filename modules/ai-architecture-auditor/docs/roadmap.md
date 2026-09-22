# 🗺️ Enterprise Product Roadmap (Epics 01–17) — AI Architecture Auditor V4.1

## 📋 Roadmap Overview & Strategic Phases

The **Evidence-Driven AI Software Architecture Auditor V4.1** product roadmap details 17 production Epics spanning Phase 1 MVP, Phase 2 Resilience & Execution Isolation, and Phase 3 Contract Graph Alignment.

```
+-----------------------------------------------------------------------------------+
|                            ENTERPRISE ROADMAP PHASES                              |
+-----------------------------------------------------------------------------------+
| PHASE 1: Core MVP & Evidence Store (Epics 01 - 04)                                |
|   - Neo4j Hydration, Java SPI, Counter-Evidence, SARIF & CI/CD                     |
+-----------------------------------------------------------------------------------+
| PHASE 2: Doc-as-Code, Governance & AI Triage (Epics 05 - 12)                      |
|   - C4 Diagrams, Green IT, VEX, Anonymization, OPA, Remediation, Executive Report  |
+-----------------------------------------------------------------------------------+
| PHASE 3: Resilience, Incremental SCIP & Contracts (Epics 13 - 17)                 |
|   - Git SCIP Diffing, Wasm Sandbox, AST Cache, Test Slicing, OpenAPI/AsyncAPI      |
+-----------------------------------------------------------------------------------+
```

---

## 🏛️ Epic 01: Code Graph Hydration & Evidence Store
**Status**: `COMPLETED`  
**Goal**: Integrate Java 21 execution runtime with operational jQAssistant and Neo4j graph instances, establishing AST schema and PostgreSQL JSONB evidence storage.

* **Story 1.1: jQAssistant Java AST & Dependency Ingestion**
  * *Role Story*: As a platform architect, I want jQAssistant scanning configured so that Java AST nodes (`:Type`, `:Method`, `:Field`) and edges (`:DEPENDS_ON`, `:DECLARES`) are ingested into Neo4j.
  * *Acceptance Criteria*: Ingests 50k LOC repo in under 30s; isolates graph nodes by `runId`.
* **Story 1.2: Neo4j Virtual Thread Cypher Client**
  * *Role Story*: As a lead dev, I want a high-throughput Neo4j client using Virtual Threads so that concurrent Cypher queries execute without thread pool exhaustion.
  * *Acceptance Criteria*: Executes 50 concurrent queries with <200ms batch latency via `Executors.newVirtualThreadPerTaskExecutor()`.
* **Story 1.3: PostgreSQL Evidence Store Schema & DAO**
  * *Role Story*: As a compliance auditor, I want raw observations persisted in PostgreSQL JSONB tables for immutable audit trails.
  * *Acceptance Criteria*: Saves indexed JSONB records to `audit_observation` and `audit_finding` tables with SHA-256 code hashes.

---

## ☕ Epic 02: Java/Spring Boot Language Driver & Static Rules
**Status**: `COMPLETED`  
**Goal**: Build core `LanguageDriver` SPI for Java, integrating OpenRewrite for deep symbol resolution and executing static rule checks.

* **Story 2.1: `LanguageDriver` SPI Scaffolding**
  * *Role Story*: As a developer, I want a clean SPI interface (`LanguageDriver.java`) so that language drivers plug into the DAG runtime.
  * *Acceptance Criteria*: Exposes lifecycle hooks `supports()`, `initialize()`, `extractAST()`, and `executeStaticRules()`.
* **Story 2.2: OpenRewrite TypeSolver Integration**
  * *Role Story*: As a static analysis engineer, I want OpenRewrite type-solving integrated to resolve structural type symbols across multi-module Maven projects.
  * *Acceptance Criteria*: Resolves fully qualified class names and method signatures without missing symbol warnings.
* **Story 2.3: Core Static Architecture Rule Suite**
  * *Role Story*: As an architect, I want deterministic static rules for Hexagonal isolation (`HEX-001`), `@Transactional` demarcation (`DB-001`), and JPA N+1 detection (`ORM-001`).
  * *Acceptance Criteria*: Flags core domain classes importing web adapters or non-read-only transactions on query methods.

---

## ⚖️ Epic 03: Deterministic Counter-Evidence & Graph RAG
**Status**: `COMPLETED`  
**Goal**: Implement Counter-Evidence Cypher engine to eliminate false positives and integrate jQAssistant Graph RAG for minified LLM context.

* **Story 3.1: Cypher Counter-Evidence Validation Engine**
  * *Role Story*: As an auditor, I want a Cypher counter-evidence engine so that candidate violations with valid compensating patterns are downgraded.
  * *Acceptance Criteria*: Automatically downgrades findings when compensating Kafka handlers or `@TransactionalEventListener` annotations are found in Neo4j.
* **Story 3.2: jQAssistant Graph RAG Context Fetcher**
  * *Role Story*: As an AI engineer, I want Graph RAG to extract minified AST sub-trees so LLM prompts receive minimal, highly targeted graph context.
  * *Acceptance Criteria*: Generates 2-hop minified JSON sub-trees keeping prompt context footprint under 1,500 tokens.
* **Story 3.3: LLM Gateway & Grammar-Guided JSON Triage**
  * *Role Story*: As a security engineer, I want LLM Gateway output constrained by JSON-schema grammar decoding.
  * *Acceptance Criteria*: Enforces strict JSON decoding via `AuditTriageResponse.json` schema with automatic retry logic.

---

## 📊 Epic 04: SARIF Reporting, CI/CD Pipeline & Observability
**Status**: `COMPLETED`  
**Goal**: Produce standardized SARIF 2.1.0 report artifacts, integrate with CI/CD build gates, and track token cost metrics.

* **Story 4.1: SARIF 2.1.0 Exporter**
  * *Role Story*: As a DevOps engineer, I want audit results formatted in standard SARIF 2.1.0 JSON for GitHub Actions Security tabs.
  * *Acceptance Criteria*: Produces `audit-results.sarif` adhering strictly to OASIS SARIF 2.1.0 specs.
* **Story 4.2: CI/CD Build Gate & Exit Code Controls**
  * *Role Story*: As a release engineer, I want configurable build break thresholds (`--fail-on=HIGH`) to block non-compliant PRs.
  * *Acceptance Criteria*: Exits with non-zero status code `1` when unmitigated high/critical findings remain.
* **Story 4.3: Token Economics & Performance Tracking**
  * *Role Story*: As an SRE, I want LLM token usage, latency, and financial costs logged in PostgreSQL per audit execution.
  * *Acceptance Criteria*: Logs prompt tokens, completion tokens, latency (ms), and USD cost in `audit_token_metrics`.

---

## 📐 Epic 05: Doc-as-Code Synchronization & C4 Export
**Status**: `COMPLETED`  
**Goal**: Automatically extract live C4 Architecture component diagrams and render PlantUML and Mermaid PNG visual artifacts.

* **Story 5.1: PlantUML & Mermaid C4 Diagram Exporter**
  * *Role Story*: As a software architect, I want living C4 diagrams generated from code AST topology.
  * *Acceptance Criteria*: Generates `c4-architecture.puml` and `c4-architecture.mmd` files and renders `c4-architecture.png`.
* **Story 5.2: Workflow Execution State Visualizer**
  * *Role Story*: As an operator, I want visual PNG flowcharts of master DAG execution states with status-colored nodes.
  * *Acceptance Criteria*: Renders `workflow-execution-state.png` highlighting executed steps in green (`#28a745`) and errors in red (`#dc3545`).

---

## 🔄 Epic 06: Business Rule Inversion Engine
**Status**: `COMPLETED`  
**Goal**: Reverse-engineer domain AST logic into natural language business rule documentation.

* **Story 6.1: AST Logic Extractor**
  * *Role Story*: As a business analyst, I want code decision branches translated into structured business rules.
  * *Acceptance Criteria*: Extracts `@Service` conditional logic and formats markdown business specifications.
* **Story 6.2: Markdown Specification Sync**
  * *Role Story*: As a tech lead, I want business rules synchronized with `docs/business-rules.md`.
  * *Acceptance Criteria*: Updates business specification files automatically during CI runs.

---

## 🌿 Epic 07: Green IT Profiling & Sustainability Metrics
**Status**: `COMPLETED`  
**Goal**: Estimate compute carbon footprints and energy consumption per audit execution.

* **Story 7.1: CPU & Memory Energy Profiler**
  * *Role Story*: As a sustainability officer, I want execution energy metrics logged in kWh.
  * *Acceptance Criteria*: `GreenItProfiler` estimates kWh and gCO2e footprint based on thread execution time.
* **Story 7.2: Green IT Report Generator**
  * *Role Story*: As an SRE, I want carbon footprint metrics saved in JSON and PostgreSQL.
  * *Acceptance Criteria*: Generates `target/green-it-profile.json` and updates `audit_green_it` tables.

---

## 🛡️ Epic 08: VEX & Reachability Analysis
**Status**: `COMPLETED`  
**Goal**: Cross-reference dependency CVEs against Neo4j call graphs to establish true vulnerability reachability.

* **Story 8.1: Vulnerability Call-Graph Traversal**
  * *Role Story*: As a security engineer, I want to verify if vulnerable library methods are actually invoked in code.
  * *Acceptance Criteria*: Downgrades CVE severity if vulnerable method signatures are unreachable in call graphs.
* **Story 8.2: VEX (Vulnerability Exploitability eXchange) Export**
  * *Role Story*: As a compliance lead, I want standardized VEX JSON documents exported.
  * *Acceptance Criteria*: Generates CycloneDX/VEX json files documenting vulnerability reachability status.

---

## 🔒 Epic 09: Zero-Trust Anonymization & Data Privacy
**Status**: `COMPLETED`  
**Goal**: Anonymize proprietary code, credentials, and PII before dispatching context to external LLM providers.

* **Story 9.1: AST Token & Secret Sanitizer**
  * *Role Story*: As a CISO, I want API keys, passwords, and proprietary variables scrubbed from LLM prompts.
  * *Acceptance Criteria*: `ZeroTrustAnonymizer` replaces sensitive literals with SHA-256 tokens (`TOKEN_A1B2`).
* **Story 9.2: Re-Identification Map Handler**
  * *Role Story*: As a developer, I want LLM triage responses mapped back to original code symbols locally.
  * *Acceptance Criteria*: Re-identifies anonymized tokens safely in local report outputs.

---

## ⚙️ Epic 10: OPA Policy Evaluation & Governance
**Status**: `COMPLETED`  
**Goal**: Enforce enterprise compliance policies using Open Policy Agent (OPA) Rego rules.

* **Story 10.1: OPA Rego Engine Integration**
  * *Role Story*: As a governance manager, I want OPA Rego policies evaluated against audit findings.
  * *Acceptance Criteria*: Evaluates `policy.rego` against finding JSON payloads and outputs pass/fail status.
* **Story 10.2: Custom Compliance Ruleset Binding**
  * *Role Story*: As a compliance officer, I want custom Rego policies loaded dynamically from `--ruleset`.
  * *Acceptance Criteria*: Binds policy bundles dynamically at runtime.

---

## 🔄 Epic 11: Double-Loop Remediation Engine
**Status**: `COMPLETED`  
**Goal**: Generate OpenRewrite auto-remediation refactoring recipes for confirmed architectural violations.

* **Story 11.1: OpenRewrite Recipe Synthesizer**
  * *Role Story*: As a developer, I want automated fix proposals for static rule violations.
  * *Acceptance Criteria*: Synthesizes OpenRewrite YAML recipes for `HEX-001` and `DB-001` findings.
* **Story 11.2: Shadow-Mode Remediation Verification**
  * *Role Story*: As a tech lead, I want auto-remediations tested in shadow mode before PR creation.
  * *Acceptance Criteria*: Applies fixes in temp directory and re-runs static rules to confirm resolution.

---

## 🎨 Epic 12: Executive Reporting & Model Distillation
**Status**: `COMPLETED`  
**Goal**: Generate executive PDF compliance reports and export high-quality fine-tuning dataset pairs for local model distillation.

* **Story 12.1: Executive PDF Report Exporter**
  * *Role Story*: As an executive, I want concise PDF summary reports detailing compliance scores and trend charts.
  * *Acceptance Criteria*: Produces PDF reports with executive metrics and risk matrices.
* **Story 12.2: Model Distillation Dataset Exporter**
  * *Role Story*: As an AI research engineer, I want verified audit triage pairs exported in JSONL format.
  * *Acceptance Criteria*: Exports `distillation-dataset.jsonl` formatted for fine-tuning smaller local models.

---

## ⚡ Epic 13: Incremental SCIP Subgraph Diffing
**Status**: `COMPLETED`  
**Goal**: Parse Git diffs and execute atomic Cypher graph mutations for incremental codebase updates.

* **Story 13.1: Git Delta AST Extractor**
  * *Role Story*: As a platform engineer, I want changed files resolved between Git commits for fast auditing.
  * *Acceptance Criteria*: `GitDeltaResolver` parses `git diff --name-status baseCommit..headCommit` for `.java`, `.ts`, and `.py`.
* **Story 13.2: Neo4j Cypher Delta Mutator**
  * *Role Story*: As a database engineer, I want atomic Cypher mutations to update modified file subgraphs.
  * *Acceptance Criteria*: `Neo4jSemanticGraphClient.applyIncrementalDelta(...)` detaches deleted subgraphs and merges updated AST nodes.
* **Story 13.3: Incremental Audit Orchestrator**
  * *Role Story*: As a developer, I want automatic fallback to full graph scanning if commit ranges are absent.
  * *Acceptance Criteria*: `IncrementalAuditEngine` routes commit ranges or falls back gracefully.

---

## 🛡️ Epic 14: Adaptive Wasm Worker Pools & Memory Limiter
**Status**: `COMPLETED`  
**Goal**: Isolate non-Java AST parsers inside a memory-bounded Chicory WebAssembly runtime sandbox.

* **Story 14.1: Chicory Wasm Runtime Integration**
  * *Role Story*: As a security architect, I want non-Java parsers isolated from JVM native memory space.
  * *Acceptance Criteria*: Adds `com.dylibso.chicory:wasm` dependencies for zero-JNI WebAssembly execution.
* **Story 14.2: Adaptive Worker Pool & Memory Bounding**
  * *Role Story*: As an SRE, I want worker threads bounded by CPU cores and a 512MB RAM cap per worker.
  * *Acceptance Criteria*: `WasmWorkerPool` enforces 512MB RAM cap per task and limits active workers to CPU count.
* **Story 14.3: Sandboxed Multi-Language AST Parsing**
  * *Role Story*: As a developer, I want TypeScript (`ts-morph`) and Python (`LibCST`) parsed in Wasm sandboxes.
  * *Acceptance Criteria*: `WasmAstParserSandbox` executes sandboxed tasks with timeout and fault isolation.

---

## 🧠 Epic 15: Semantic AST & Symbol Caching
**Status**: `COMPLETED`  
**Goal**: Maintain high-throughput LRU cache for parsed AST subgraphs and OpenRewrite type-solver symbols.

* **Story 15.1: Cryptographic SHA-256 LRU Cache**
  * *Role Story*: As a performance engineer, I want AST sub-trees cached by content hash to prevent re-parsing unmodified files.
  * *Acceptance Criteria*: `SemanticAstCache` implements access-ordered `LinkedHashMap` with `ReentrantReadWriteLock`.
* **Story 15.2: OpenRewrite Symbol Cache**
  * *Role Story*: As a static analysis lead, I want resolved FQNs and interface hierarchies cached across multi-module builds.
  * *Acceptance Criteria*: `OpenRewriteSymbolCache` stores and reuses type symbols.
* **Story 15.3: Capacity & Memory Bounding**
  * *Role Story*: As an operator, I want cache size capped at 10,000 entries and 512MB memory limit.
  * *Acceptance Criteria*: Automatically evicts eldest entries and tracks hit/miss metrics (`CacheMetrics`).

---

## 🎯 Epic 16: Call-Graph Test Slicing
**Status**: `COMPLETED`  
**Goal**: Traverse Neo4j call graphs to identify and execute only tests impacted by code changes.

* **Story 16.1: Neo4j Call-Graph Traversal**
  * *Role Story*: As a DevOps engineer, I want to identify unit/integration tests that call modified methods.
  * *Acceptance Criteria*: `CallGraphTestSlicer` queries `:Method -[:INVOKES*1..N]-> :Method` to find impacted `*Test` classes.
* **Story 16.2: Targeted Build Command Generator**
  * *Role Story*: As a developer, I want an optimized Maven test execution string generated automatically.
  * *Acceptance Criteria*: Outputs `mvn test -Dtest=OrderServiceTest,OrderServiceIT` for targeted CI test execution.

---

## 📜 Epic 17: OpenAPI & AsyncAPI Schema Indexing
**Status**: `COMPLETED`  
**Goal**: Index REST and AsyncAPI schema specifications and bind contract definitions to Spring Controller AST nodes in Neo4j.

* **Story 17.1: Contract Specification Parser**
  * *Role Story*: As an API architect, I want OpenAPI (`openapi.yaml`) and AsyncAPI (`asyncapi.yaml`) specifications parsed into graph payloads.
  * *Acceptance Criteria*: `ApiContractIndexer` extracts REST endpoints, JSON schemas, operation IDs, and Kafka message channels.
* **Story 17.2: Code-to-Contract Graph Binding**
  * *Role Story*: As a developer, I want REST endpoints linked to Spring `@RestController` classes in Neo4j.
  * *Acceptance Criteria*: `Neo4jSemanticGraphClient.ingestApiContractPayload(...)` creates `:ApiEndpoint` nodes and `:EXPOSES_ENDPOINT` edges.
