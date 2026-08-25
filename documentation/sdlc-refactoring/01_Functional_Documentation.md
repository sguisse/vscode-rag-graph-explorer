# Token Razor SDLC — Comprehensive Functional Documentation

## 1. Executive Summary & Vision
The **Token Razor SDLC Engine** accelerates the Software Development Life Cycle by bridging static codebase intelligence with Generative AI models. By indexing Java, TypeScript, YAML, and configuration files into a Neo4j property graph using jQAssistant rules, Token Razor enables developers to perform precise impact analysis and feed structured, anonymized context into Large Language Models (LLMs).

This refactoring transitions the extension from a monolithic, single-session explorer into a modular, multi-session **Domain-Driven Workflow Platform**.

---

## 2. Core Functional Domains

### A. Codebase Context Domain (`CodebaseContextFeature`)
* **Impact Analysis Engine:** Calculates upstream (ascending callers) and downstream (descending callees) propagation paths up to configurable depths (1–5 hops).
* **Dependency Graph Visualizer:** Interactive Cytoscape/UML rendering of classes, interfaces, components, methods, and configuration nodes. Supports layout algorithms (`cose`, `concentric`, `breadthfirst`) and attribute/method visibility toggles.
* **Codebase Tree Explorer:** Hierarchical view of files and packages with tri-state selection checkboxes (`checked`, `unchecked`, `indeterminate`) for granular context assembly.
* **Inspector Panel:** Displays signature details, cyclomatic complexity, effective line counts, annotations (`@RestController`, `@Service`, `@Entity`), and fields for selected AST elements.
* **Files Selection & Target Exporter:** Manages active file selections, allowing batch copying or export formatting (Markdown, XML, JSON, Plain Text).

### B. Instructions Domain (`InstructionsFeature`)
A segmented prompt engineering workstation offering three distinct development paradigms:
1. **Vibe Coding Panel:** Unstructured, rapid-response prompting for open-ended refactoring and feature requests.
2. **BMad Agent Framework Panel:** Role-driven agent selector featuring pre-configured personas:
   * `CodeRefactoringAgent`: Focuses on SOLID principles and DRY refactoring.
   * `SecurityAuditAgent`: Scans selected context for OWASP vulnerabilities and sanitization gaps.
   * `ASTGraphAgent`: Focuses on structural integrity and design pattern conformance.
   * `TestGeneratorAgent`: Produces unit and integration test suites.
3. **SpecKit Panel:** Specification- and test-driven development engine. Accepts Gherkin/Cucumber feature files, OpenAPI contracts, or Markdown spec sheets to enforce test-first code generation.

### C. LLM Chat Domain (`LlmFeature`)
* **Multi-Provider Routing:** Seamlessly switches between local and remote LLM providers:
  * **Ollama Daemon:** Local HTTP API (`http://localhost:11434`) for offline models (`llama3`, `deepseek-coder`).
  * **Google Gemini:** Direct REST API (`generativelanguage.googleapis.com`) or CLI fallback.
  * **GitHub Copilot:** Integrated Copilot SDK Client for enterprise models (`mai-code-1-flash-picker`, `gpt-4o`).
* **Real-time Streaming & Diagnostics:** Line-buffered streaming response rendering, token computation heuristics (prompt vs. completion tokens), execution timer (`0m:12s`), and raw payload preview.
* **Attachment Manager:** Attaches single-file context payloads and image attachments (base64 encoded).

### D. Results Manager Domain (`ResultsManagerFeature`)
* **Session Tracking Table:** Displays all recorded workflow runs with columns for `Status` (`draft`, `running`, `error`, `success`), `Session ID`, `Timestamp`, `Diagnostics`, and `Actions`.
* **State Restoration Loop ("Reload Session"):** Clicking **Reload Session** restores the exact `SdlcSession` payload into active memory (file selection pointers, callers/callees depths, instruction strategy, and prompt text) and automatically transitions the workflow machine back to `LLM_CHAT` for rapid error recovery.

### E. Configuration & Policies Domain (`ConfigurationFeature`)
* **Global Settings:** Workspace-wide settings for default provider, target model, temperature, max tokens, and local history persistence.
* **Codebase Parsers Config:** Configuration for jQAssistant concept/group validation rules, graphify regex rules, and Neo4j connection parameters (`uri`, `username`, `password`).
* **Security & Anonymization Policies:** Regex transformer rules (e.g., masking passwords, secrets, JWT tokens, and PII) applied dynamically to single-file context before transmission to LLMs.

---

## 3. Multi-Session Lifecycle & Error Recovery Flow

```
 [User Selects Nodes] -> [Configures Prompt] -> [Executes LLM Generation]
                                                        |
                                            +-----------+-----------+
                                            |                       |
                                     (Build Success)         (Build Failure)
                                            |                       |
                                            v                       v
                                    [Session Saved]      [Logged in Results Manager]
                                                                    |
                                                            (Click "Reload")
                                                                    |
                                                                    v
                                                         [State Restored to LLM Chat]
```
