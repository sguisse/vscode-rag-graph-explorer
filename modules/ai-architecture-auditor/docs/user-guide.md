# 📖 Enterprise User & Operator Guide — AI Architecture Auditor V4.1

## 🚀 Getting Started & Installation

Welcome to the **Evidence-Driven AI Software Architecture Auditor V4.1** operations manual. This guide provides step-by-step instructions for deploying, configuring, and operating the auditor platform in local development environments and CI/CD automated pipelines.

### Prerequisites & System Requirements
* **Java Development Kit (JDK)**: JDK 21+ with Project Loom Virtual Thread support.
* **Build Tool**: Apache Maven 3.9+.
* **Graph Database**: Neo4j 5.18+ (Enterprise or Community Edition with Bolt protocol enabled on port `7687`).
* **Relational Evidence Store**: PostgreSQL 16+ (with JSONB support enabled on port `5432`).
* **Optional Containers**: Docker / Podman for containerized Neo4j and PostgreSQL instances.

---

## 💻 Command Line Interface (CLI) Execution

The auditor platform provides a powerful CLI driven by **Picocli** (`AuditorCliRunner`).

### Basic Command Syntax
```bash
java -jar ai-architecture-auditor-1.0.0-SNAPSHOT.jar \
  --target-dir=/path/to/target-codebase \
  --ruleset=ENTERPRISE_CORE \
  --fail-on=HIGH
```

### Supported CLI Flags & Options

| Option / Flag | Short Flag | Description | Default Value |
| :--- | :---: | :--- | :--- |
| `--target-dir` | `-t` | Path to the target source code repository to be audited. | Current Directory (`.`) |
| `--base-commit` | `-b` | Git base commit SHA for incremental SCIP diff auditing. | `null` (Full Audit) |
| `--head-commit` | `-h` | Git head commit SHA for incremental SCIP diff auditing. | `null` (Full Audit) |
| `--ruleset` | `-r` | Target ruleset category (`ENTERPRISE_CORE`, `HEXAGONAL`, `SECURITY`). | `ENTERPRISE_CORE` |
| `--fail-on` | `-f` | Severity threshold to exit with non-zero status code (`CRITICAL`, `HIGH`, `MEDIUM`). | `CRITICAL` |
| `--export-diagrams` | `-d` | Enable generation of PlantUML and Mermaid C4/DAG diagrams as PNGs. | `true` |
| `--wasm-sandbox` | `-w` | Enable sandboxed Chicory WebAssembly parsing for Python/TypeScript. | `true` |

### Incremental Audit Example
```bash
java -jar ai-architecture-auditor-1.0.0-SNAPSHOT.jar \
  --target-dir=/workspace/my-spring-app \
  --base-commit=a1b2c3d \
  --head-commit=e4f5g6h \
  --export-diagrams
```

---

## 🌐 REST API Endpoints & Automation

The platform exposes a Spring Boot REST API for programmatic automation and web dashboard integration.

### Endpoint Overview

#### 1. Trigger Audit Run
* **HTTP Method**: `POST`
* **Path**: `/api/v1/audits`
* **Request Body**:
```json
{
  "repositoryPath": "/workspace/my-spring-app",
  "baseCommit": "a1b2c3d",
  "headCommit": "e4f5g6h",
  "ruleset": "ENTERPRISE_CORE",
  "failOnSeverity": "HIGH"
}
```
* **Response**:
```json
{
  "runId": "run-f83d9a12-4211-4b10-8e12-998877665544",
  "status": "IN_PROGRESS",
  "timestamp": 1774154400000
}
```

#### 2. Fetch Audit Results & Observations
* **HTTP Method**: `GET`
* **Path**: `/api/v1/audits/{runId}`
* **Response**:
```json
{
  "runId": "run-f83d9a12-4211-4b10-8e12-998877665544",
  "status": "COMPLETED",
  "totalObservations": 3,
  "findings": [
    {
      "findingId": "find-001",
      "ruleId": "HEX-001",
      "severity": "HIGH",
      "message": "Hexagonal Boundary Violation: OrderDomainService imports org.springframework.web.bind.annotation.RestController",
      "location": {
        "file": "src/main/java/com/company/domain/OrderDomainService.java",
        "lineStart": 14
      }
    }
  ]
}
```

---

## 📐 Architectural Diagram Generation & Exporters

When `--export-diagrams` is enabled, the platform automatically generates PlantUML and Mermaid diagram artifacts in the `target/` directory:

1. **C4 Component Architecture**:
   * `target/c4-architecture.puml` (PlantUML source)
   * `target/c4-architecture.png` (Rendered PNG image)
   * `target/c4-architecture.mmd` (Mermaid flowchart source)
   * `target/c4-architecture-mermaid.png` (Styled Mermaid PNG image)

2. **Master Workflow Execution State**:
   * `target/workflow-execution-state.puml` (BPMN DAG state source)
   * `target/workflow-execution-state.png` (Status-colored PlantUML PNG)
   * `target/workflow-execution-state.mmd` (Mermaid flowchart source)
   * `target/workflow-execution-state-mermaid.png` (Status-colored Mermaid PNG)

---

## 🛡️ Interpreting Audit Reports & SARIF Output

The auditor produces an OASIS standard **SARIF 2.1.0** report file at `target/audit-results.sarif`.

### GitHub Actions Integration Example
```yaml
name: "Architecture Governance Audit"
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run Architecture Auditor
        run: java -jar ai-architecture-auditor.jar --target-dir=. --fail-on=HIGH
      - name: Upload SARIF to GitHub Security Tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: target/audit-results.sarif
```

---

## 📊 Green IT Profiling & Carbon Footprint Metrics

The `GreenItProfiler` measures the software's compute energy consumption and carbon impact during the execution phase:

* **Estimated kWh**: Calculated based on CPU execution duration and thread allocation.
* **Estimated gCO2e**: Calculated using global average grid carbon intensity (e.g. 475 gCO2e/kWh).
* **Metrics Output**: Saved to `target/green-it-profile.json` and logged in PostgreSQL `audit_green_it` tables.

---

## 🔍 Troubleshooting & Operational Runbooks

### 1. Neo4j Connection Refused (`BoltHandshakeException`)
* **Cause**: Neo4j database service is offline or unreachable on `bolt://localhost:7687`.
* **Remediation**: Check Neo4j container status using `docker ps` or start local instance via `docker-compose up -d neo4j`.

### 2. Wasm Sandbox RAM Limit Exceeded (`WasmWorkerMemoryException`)
* **Cause**: Non-Java AST parsing for an extremely large file exceeded the 512MB RAM cap per worker.
* **Remediation**: Increase worker RAM cap via JVM system property `-Dwasm.worker.memory.limit=1024MB`.

### 3. Cache Misconfiguration
* **Cause**: High memory usage due to excessive AST cache storage.
* **Remediation**: Configure `-Dast.cache.max.entries=5000` or invoke `POST /api/v1/cache/clear`.
