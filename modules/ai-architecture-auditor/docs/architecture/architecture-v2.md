# 🏛️ Enterprise Architecture & System Blueprint — AI Architecture Auditor V6.0 (BMAD Multi-Agent Edition)

## 🎯 Executive Summary & Foundational Paradigm

The **Evidence-Driven AI Software Architecture Auditor V6.0** is an enterprise-grade platform designed to automate technical governance, architectural auditing, and documentation-as-code across large-scale software systems.

The core doctrine of the system is **"Deterministic First, SCIP-Guided Cross-Stack Lineage, LLM Second"**. Rather than relying on ungrounded AI heuristics that risk hallucinations, the platform evaluates deterministic static analysis rules, graph database traversals, and abstract syntax tree (AST) parsers before invoking Artificial Intelligence for higher-level triage or synthesis.

```mermaid
flowchart TD
    subgraph CLI ["Master Audit Orchestrator (Java 21 Project Loom DAG Engine)"]
        Runner["AuditorCliRunner"]
    end

    subgraph Deterministic ["Deterministic Evidence Layer"]
        StaticEngine["Deterministic Static Analysis Engine
(OpenRewrite / Tree-Sitter)"]
        Neo4jGraph["Neo4j Semantic Graph
(jQAssistant / Graph RAG Engine)"]
        PgStore["PostgreSQL Evidence Store
(JSONB Audit Logs)"]
    end

    subgraph LLMLayer ["AI & Governance Layer"]
        Anonymizer["Zero-Trust Anonymizer
(PII & Secret Scrubbing)"]
        LLMEngine["Grammar-Guided LLM Triage Engine
(Ollama / vLLM / OpenAI)"]
        OPAGovernance["OPA Rego Policy Evaluator
(Enterprise Compliance Gate)"]
    end

    Runner --> StaticEngine
    Runner --> Neo4jGraph
    Runner --> PgStore
    StaticEngine --> Anonymizer
    Neo4jGraph --> Anonymizer
    PgStore --> Anonymizer
    Anonymizer --> LLMEngine
    LLMEngine --> OPAGovernance
```

---

## 👥 BMAD Multi-Agent Team Orchestration Model

The platform architecture is fully orchestrated using the **BMAD Agentic Multi-Agent Framework** (BMad Builder V6 Alpha). Each architectural domain and audit phase is governed by dedicated BMAD agent personas:

```mermaid
flowchart LR
    subgraph BMADTeam ["BMAD Multi-Agent Personas"]
        Winston["Winston
(Lead System Architect)
• Graph RAG & Neo4j
• Formal Verification Z3"]
        Quinn["Quinn
(QA Architect)
• Fuzzing & Mutation Bench
• Red-Team PenTest Agent"]
        Morgan["Morgan
(SRE & Ops Lead)
• eBPF Kernel Probes
• Wasm Chicory Sandbox"]
        Amelia["Amelia
(Lead Developer)
• OpenRewrite & AST Solvers
• Polyglot Transpilation"]
        Sarah["Sarah
(CISO & Security)
• ZK-SNARK Compliance
• SLSA Level 4 & PQC"]
        Mary["Mary
(Product Owner / BA)
• FinOps & Carbon Tax
• Tech Debt Marketplace"]
        John["John
(Scrum Master)
• Sprint & Audit Velocity
• Debt Liquidation"]
    end

    subgraph Pipeline ["Audit Pipeline Stages"]
        PhaseAnalysis["1. Analysis & AST Hydration"]
        PhaseSolutioning["2. Static & Graph Audit"]
        PhaseTriage["3. Anonymized LLM Triage"]
        PhaseGovernance["4. Governance & PR Remediation"]
    end

    Winston --> PhaseAnalysis
    Amelia --> PhaseAnalysis
    Quinn --> PhaseSolutioning
    Morgan --> PhaseSolutioning
    Sarah --> PhaseTriage
    Mary --> PhaseGovernance
    John --> PhaseGovernance
```

---

## 🧱 Core System Components & Sub-Processes

The architecture is partitioned into four major sub-processes managed by the `AuditorCliRunner` main orchestrator:

| Sub-Process | Primary Components | Key Responsibilities | Lead Persona |
| :--- | :--- | :--- | :--- |
| **AnalysisSubProcess** | `GitDeltaResolver`, `ScipIndexer`, `OpenRewriteTypeSolver`, `Neo4jSemanticGraphClient` | Resolves AST topology, incremental Git diffs, and executes deterministic static analysis rules. | **Winston** & **Amelia** |
| **DocumentationAndGreenItSubProcess** | `C4DiagramExtractor`, `WorkflowStateRenderer`, `GreenItProfiler`, `BusinessRuleInverter` | Generates PlantUML/Mermaid C4 diagrams, renders workflow execution DAGs, and profiles carbon footprints. | **Mary** & **Morgan** |
| **LlmTriageSubProcess** | `ZeroTrustAnonymizer`, `GraphRAGContextFetcher`, `LlmTriageEngine` | Scrubs sensitive data, extracts minified 2-hop graph context, and performs grammar-guided LLM evaluation. | **Sarah** & **Winston** |
| **GovernanceAndRemediationSubProcess** | `OpaPolicyEvaluator`, `ExecutiveReportExporter`, `SarifReportExporter`, `DoubleLoopRemediator` | Evaluates OPA Rego governance policies, produces SARIF 2.1.0 reports, and applies OpenRewrite auto-remediations. | **Quinn** & **John** |

---

## 🔀 Master DAG Workflow Execution Architecture

The core runtime uses **Java 21 Virtual Threads (`Executors.newVirtualThreadPerTaskExecutor()`)** to execute a Directed Acyclic Graph (DAG) of non-blocking audit steps.

```mermaid
flowchart TD
    Start([START]) --> A1[A1: Predictive Blast Radius]
    A1 --> A2[A2: Static Rules Execution]
    
    A2 --> A3[A3: Aligner Engine]
    A2 --> A4[A4: OTel Trace Hydration]
    A2 --> A5[A5: K8s Infrastructure Fusion]
    A2 --> C1[C1: Zero-Trust Anonymization]

    A3 --> B1[B1: Doc-as-Code Sync & Diagrams]
    A4 --> B1
    A5 --> B1

    C1 --> C2[C2: Grammar-Guided LLM Triage]
    C2 --> D4[D4: Model Distillation & Fine-Tuning]

    B1 --> D1[D1: OPA Policy Evaluation]

    D1 --> D2[D2: Executive PDF Exporter]
    D1 --> D3[D3: Auto-PR Remediation]
    D1 --> D5[D5: SARIF 2.1.0 Exporter]

    D2 --> End([END])
    D3 --> End
    D5 --> End
    D4 --> End
```

---

## 📊 Dual-Graph Acceleration & Neo4j Cypher Data Model

The platform integrates **jQAssistant** to automatically ingest bytecode, AST nodes, and package structures into **Neo4j 5.18+**. All graph nodes are isolated by audit `runId`.

```mermaid
flowchart LR
    subgraph Neo4jSchema ["Neo4j Semantic Code Graph Schema"]
        TypeNode[":Type
(fqn, name, fileName, runId)"]
        MethodNode[":Method
(signature, name, runId)"]
        ApiNode[":ApiEndpoint
(path, method, operationId)"]
        AsyncNode[":AsyncChannel
(channelName, protocol, messageType)"]
        ThreatNode[":MitreTechnique
(id, name, tactic)"]
    end

    TypeNode -- ":DECLARES" --> MethodNode
    TypeNode -- ":DEPENDS_ON" --> TypeNode
    MethodNode -- ":INVOKES" --> MethodNode
    TypeNode -- ":EXPOSES_ENDPOINT" --> ApiNode
    MethodNode -- ":PUBLISHES_TO" --> AsyncNode
    MethodNode -- ":EXPOSES_THREAT_TECHNIQUE" --> ThreatNode
```

### Key Graph Schema Elements
* `:Type`: Represents Java classes, interfaces, TypeScript components, or Python modules.
* `:Method`: Represents declared functions and methods with signature parameters.
* `:ApiEndpoint`: Represents OpenAPI REST endpoints (`path`, `method`, `operationId`).
* `:AsyncChannel`: Represents AsyncAPI Kafka/RabbitMQ message channels.
* `:MitreTechnique`: Represents mapped MITRE ATT&CK cybersecurity threat nodes.

---

## ⚡ Incremental SCIP Subgraph Diffing (Epic 13)

For large repositories (100k+ LOC), full graph re-indexing is cost-prohibitive. The `IncrementalAuditEngine` delegates to `GitDeltaResolver` and `ScipIndexer`:

```mermaid
flowchart TD
    GitDiff["1. Git Delta Resolver
(git diff --name-status)"] --> ModFiles["Modified & Deleted Files List"]
    ModFiles --> CypherPurge["2. Atomic Cypher Purge
(DETACH DELETE modified file nodes in Neo4j)"]
    CypherPurge --> SCIPIngest["3. SCIP / AST Subgraph Re-Indexer"]
    SCIPIngest --> GraphMerge["4. Incremental Graph Merge
(Update only impacted subgraphs)"]
```

```cypher
UNWIND $files AS fileName
MATCH (t:Type {fileName: fileName})
DETACH DELETE t;
```

---

## 🛡️ Sandboxed Execution & Wasm Worker Pools (Epic 14)

Non-Java language parsing (e.g. TypeScript via `ts-morph`, Python via `LibCST`) runs in a **pure JVM-native WebAssembly (Wasm) sandbox** powered by **Chicory Wasm** (`com.dylibso.chicory:wasm`).

```mermaid
flowchart LR
    HostJVM["JVM Main Application"] --> WorkerPool["WasmWorkerPool
(Thread Bounded by CPU Cores)"]
    
    subgraph ChicorySandbox ["Chicory Wasm Bounded Sandbox"]
        Worker1["Wasm Worker 1
(512MB RAM Bounded)"]
        Worker2["Wasm Worker 2
(512MB RAM Bounded)"]
        Worker3["Wasm Worker N
(512MB RAM Bounded)"]
    end

    WorkerPool --> Worker1
    WorkerPool --> Worker2
    WorkerPool --> Worker3

    Worker1 --> ParserTS["TS-Morph / LibCST Parser"]
    Worker2 --> ParserPy["Python AST Parser"]
```

* **Memory Bounding**: The `WasmWorkerPool` enforces a strict **512MB RAM memory limit per worker** to prevent heap exhaustion.
* **Worker Allocation**: Worker threads are capped dynamically based on available CPU cores (`Math.max(2, Runtime.getRuntime().availableProcessors())`).

---

## 🧠 Semantic AST & Symbol Caching Engine (Epic 15)

To maximize performance across iterative audit runs, `SemanticAstCache` implements a thread-safe, access-ordered LRU caching layer:

```mermaid
flowchart TD
    SourceFile["Source Code File"] --> HashKey["Compute SHA-256 Content Hash + Version Tag"]
    HashKey --> LRUCache{"SemanticAstCache
(LRU 10k items / 512MB)"}
    LRUCache -- "Cache Hit" --> FastAST["Return Cached Resolved Symbols"]
    LRUCache -- "Cache Miss" --> OpenRewriteSolver["Run OpenRewrite Type Solver & AST Parser"]
    OpenRewriteSolver --> StoreCache["Store in LRU Cache"]
    StoreCache --> FastAST
```

---

## 🎯 Call-Graph Test Slicing (Epic 16)

The `CallGraphTestSlicer` analyzes Neo4j call graphs to run only the tests impacted by code changes:

```mermaid
flowchart LR
    GitChange["Modified Class
(e.g., OrderService.java)"] --> Neo4jTraversal["Neo4j 2-Hop Method Traversal
((mTest)-[:INVOKES*1..4]->(:Method))"]
    Neo4jTraversal --> TestList["Impacted Test Classes
(OrderServiceTest, OrderServiceIT)"]
    TestList --> MavenExec["Execute Targeted Sliced Test Suite
(mvn test -Dtest=OrderServiceTest,OrderServiceIT)"]
```

```cypher
UNWIND $classes AS modifiedClass
MATCH (target:Type {fqn: modifiedClass})
MATCH (test:Type)-[:DECLARES]->(mTest:Method)
WHERE (test.name ENDS WITH 'Test' OR test.name ENDS WITH 'IT')
  AND (mTest)-[:INVOKES*1..4]->(:Method)<-[:DECLARES]-(target)
RETURN DISTINCT test.fqn AS testClass, mTest.name AS testMethod
```

---

## 📜 OpenAPI & AsyncAPI Schema Graph Alignment (Epic 17)

The `ApiContractIndexer` parses `openapi.yaml` and `asyncapi.yaml` specifications and binds REST/async contract definitions directly to Spring Controller classes (`:EXPOSES_ENDPOINT` edges) and Kafka listeners (`:PUBLISHES_TO` / `:SUBSCRIBES_TO` edges) in Neo4j, detecting broken API contracts or unmapped endpoints automatically.

---

## ⚖️ Evidence Store & Double-Loop Governance

Audit findings are stored immutably in **PostgreSQL 16** using JSONB columns (`audit_observation` and `audit_finding` tables). Liquibase manages database schema evolution.

```mermaid
flowchart TD
    Findings["Audit Findings & Observations"] --> OpaEval["OpaPolicyEvaluator
(evaluates .auditor/policy.rego)"]
    OpaEval -- "PASSED" --> SarifGen["SARIF 2.1.0 Exporter"]
    OpaEval -- "PASSED" --> ExecPDF["Executive PDF Exporter"]
    OpaEval -- "FAILED" --> BlockPR["Block CI/CD Build & Trigger DoubleLoopRemediator"]
    DoubleLoopRemediator["DoubleLoopRemediator
(Synthesizes OpenRewrite Auto-PR)"] --> GitHubPR["Push Auto-Remediation PR"]
```

Governance rules are evaluated via the Open Policy Agent (`OpaPolicyEvaluator`), verifying compliance against corporate security standards before exporting standardized **SARIF 2.1.0** reports or auto-generating GitHub remediation Pull Requests.
