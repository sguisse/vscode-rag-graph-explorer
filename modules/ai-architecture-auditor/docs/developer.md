# 💻 Developer & Contributor Guide — AI Architecture Auditor V4.1

## 🛠️ Local Development Environment Setup

This guide provides technical contributors with the necessary setup, architectural conventions, and coding guidelines for extending the **Evidence-Driven AI Software Architecture Auditor V4.1**.

### System Prerequisites
* **Java Development Kit**: JDK 21+ (Amazon Corretto, Eclipse Temurin, or Oracle JDK).
* **Build System**: Apache Maven 3.9+.
* **Docker / Container Engine**: Docker Desktop or Finch for running Neo4j 5.18 and PostgreSQL 16 containers.
* **IDE**: IntelliJ IDEA 2023.3+ or VS Code with Java Extension Pack.

### Quick Start: Environment Initialization
```bash
# 1. Clone project repository
git clone https://github.com/company/ai-architecture-auditor.git
cd ai-architecture-auditor

# 2. Start local Neo4j & PostgreSQL infrastructure
docker-compose up -d

# 3. Build project and run unit test suite
mvn clean test
```

---

## 🏗️ Codebase Structure & Directory Layout

The codebase follows a modular Maven structure organized around hexagonal domain boundaries:

```
modules/ai-architecture-auditor/
├── src/main/java/com/company/auditor/
│   ├── config/                     # Spring Boot & DAG workflow renderers
│   ├── core/
│   │   ├── api/                    # OpenAPI & AsyncAPI indexers (Epic 17)
│   │   ├── ast/cache/              # Semantic AST & Symbol Caching (Epic 15)
│   │   ├── domain/                 # Core domain records (Finding, Observation)
│   │   ├── graph/                  # Neo4j Semantic Graph Client & Cypher mutators
│   │   ├── scip/                   # Git Delta & Incremental SCIP engine (Epic 13)
│   │   ├── spi/                    # LanguageDriver SPI interfaces
│   │   └── testslice/             # Call-Graph Test Slicer engine (Epic 16)
│   ├── docgen/                     # PlantUML, Mermaid & C4 diagram exporters
│   ├── drivers/
│   │   ├── java/                   # Java / Spring Boot OpenRewrite driver
│   │   └── wasm/                   # Chicory Wasm Worker Pool sandbox (Epic 14)
│   └── runner/                     # AuditorCliRunner & ProcessStepConstants
└── src/test/java/com/company/auditor/  # Unit & Integration test suites
```

---

## 🔌 LanguageDriver SPI Extension Framework

To support new technology stacks (e.g. Go, Rust, C#), developers implement the `LanguageDriver` Service Provider Interface (`com.company.auditor.core.spi.LanguageDriver`):

```java
package com.company.auditor.core.spi;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import java.nio.file.Path;
import java.util.List;

public interface LanguageDriver {

    /**
     * Determines whether this driver supports the target project structure.
     */
    boolean supports(Path projectRoot);

    /**
     * Initializes parser symbols and type-solving engines.
     */
    void initialize(AnalysisContext context);

    /**
     * Extracts AST topology and populates Neo4j graph nodes.
     */
    void extractAST(Path projectRoot, String runId);

    /**
     * Executes language-specific static analysis rules.
     */
    List<Observation> executeStaticRules(String runId);
}
```

### Registering a Custom Driver via ServiceLoader
Create a file at `src/main/resources/META-INF/services/com.company.auditor.core.spi.LanguageDriver`:
```text
com.company.auditor.drivers.custom.GoLanguageDriver
```

---

## ⚡ Working with Virtual Threads & Project Loom

All concurrent graph traversals and I/O-bound tasks in the auditor runtime MUST execute on Java 21 **Virtual Threads**.

### Recommended Concurrent Task Pattern
```java
public List<Observation> executeConcurrentRules(List<StaticRule> rules, String runId) {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<List<Observation>>> futures = rules.stream()
                .map(rule -> executor.submit(() -> rule.evaluate(runId)))
                .toList();

        List<Observation> allObservations = new ArrayList<>();
        for (var future : futures) {
            allObservations.addAll(future.get());
        }
        return allObservations;
    } catch (Exception e) {
        throw new AuditorEngineException("Concurrent rule evaluation failed", e);
    }
}
```

---

## 🧪 Testing Guidelines & Suite Execution

The repository maintains strict test coverage requirements (>80% line coverage for core engine modules).

### Test Suite Execution Commands
```bash
# Run standard unit tests
mvn test

# Run specific epic test class
mvn test -Dtest=GitDeltaResolverTest

# Run full integration test suite with Testcontainers
mvn verify -Pintegration-tests
```

### Mocking Guidelines
* Use **Mockito** (`mock(Neo4jSemanticGraphClient.class)`) for isolating graph database interactions in unit tests.
* Use `@TempDir` JUnit 5 annotations for file-system and workspace testing.

---

## 📜 BMAD Method Workflow & Coding Standards

Contributors MUST follow the **BMAD Method (Agile AI-Driven Development)** protocols:

1. **Deterministic First**: Ensure all AST rules and graph queries return deterministic results before adding LLM heuristics.
2. **Immutable Domain Records**: Use Java `record` types for all domain models (`Finding`, `Observation`, `ScipDeltaPayload`, `WasmTaskResult`).
3. **No Uncaught Exceptions**: Wrap all lower-level I/O or Cypher exceptions in `AuditorEngineException`.
4. **Structured Logging**: Use SLF4J loggers with explicit parameter placeholders (`log.info("Processing runId={}", runId)`).
