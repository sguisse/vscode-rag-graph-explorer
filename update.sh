#!/bin/bash

# ==============================================================================
# Token Razor SDLC Refactoring - Exhaustive Documentation Generator
# Generates comprehensive, deep-dive Markdown documentation without any loss
# of technical or functional detail.
# ==============================================================================

echo "📝 Generating exhaustive SDLC documentation in /documentation/sdlc-refactoring/..."

mkdir -p documentation/sdlc-refactoring

# ------------------------------------------------------------------------------
# 1. EXHAUSTIVE FUNCTIONAL DOCUMENTATION
# ------------------------------------------------------------------------------
cat << 'EOF' > documentation/sdlc-refactoring/01_Functional_Documentation.md
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
EOF

# ------------------------------------------------------------------------------
# 2. EXHAUSTIVE TECHNICAL DOCUMENTATION
# ------------------------------------------------------------------------------
cat << 'EOF' > documentation/sdlc-refactoring/02_Technical_Documentation.md
# Token Razor SDLC — Comprehensive Technical Documentation

## 1. System Architecture & Hexagonal RPC Bridge

The application enforces a strict separation between the React Webview UI (`webview/`), the shared contract boundary (`shared/`), and the VS Code extension backend host (`backend/`).

```text
+---------------------------------------------------------------------------------------+
| WEBVIEW LAYER (webview/src/features/sdlc/)                                            |
| React Components + Zustand Stores (useSdlcSessionStore, useCodebaseCache)             |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| WEBVIEW API SERVICES (webview/src/services/api/)                                      |
| Extends AbstractApiService -> Calls RpcProtocol.call(RpcMethodEnum.*)                 |
+---------------------------------------------------------------------------------------+
                                           | (postMessage RPC Protocol over Webview)
                                           v
+---------------------------------------------------------------------------------------+
| SHARED CONTRACT LAYER (shared/)                                                       |
| Enums (ServiceEnum, RpcMethodEnum), DTOs, and Port Interfaces (ISdlcSessionService)   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| BACKEND ADAPTER LAYER (backend/src/services/)                                         |
| Extends AbstractServiceAdapter -> Implements Port Interfaces & Handles Disk I/O       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Memory-Safe Zustand State Architecture

To prevent Out-Of-Memory (OOM) crashes inside the VS Code Webview host process during large codebase scans, state is strictly normalized:

```typescript
// 1. Singleton Heavy AST Cache (webview/src/features/sdlc/core/store/useCodebaseCache.ts)
export interface CodebaseCacheState {
  currentAst: CodebaseData | null; // Single shared AST tree
  lastUpdated: number;
  setAst: (data: CodebaseData) => void;
  clearAst: () => void;
}

// 2. Lightweight Multi-Session Store (webview/src/features/sdlc/core/store/useSdlcSessionStore.ts)
export interface SdlcSession {
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'running' | 'error' | 'success';
  errorMessage?: string;
  activeStepId: string;
  contextPointers: {
    selectedEntityId: string | null;
    impactedNodeIds: string[];
    callersDepth: number;
    calleesDepth: number;
  };
  instructionsPayload: {
    strategy: 'vibe' | 'bmad' | 'speckit';
    promptText: string;
  };
  llmChat: {
    provider: LlmProvider;
    selectedModel: string;
    temperature: number;
    messages: IChatMessageDto[];
  };
}

// 3. Global Workspace Store (webview/src/features/sdlc/core/store/useGlobalConfigStore.ts)
export interface GlobalConfigState {
  globalConfig: GraphRagExplorerConfig;
  anonymizationRules: AnonymizationRule[];
  updateGlobalConfig: (partial: Partial<GraphRagExplorerConfig>) => void;
  updateAnonymizationRules: (rules: AnonymizationRule[]) => void;
}

// 4. Headless Workflow State Machine (webview/src/features/sdlc/core/workflow/useSdlcWorkflowMachine.ts)
export type SdlcStep = 'CODEBASE_CONTEXT' | 'INSTRUCTIONS' | 'LLM_CHAT' | 'RESULTS_MANAGER' | 'CONFIGURATION';
export interface SdlcWorkflowMachineState {
  currentStep: SdlcStep;
  transitionTo: (step: SdlcStep) => void;
}
```

---

## 3. Neo4j Cypher Traversal Queries

The `GraphRagExplorerAdapter` queries Neo4j to retrieve change impacts using `apoc.path.expandConfig`:

```cypher
// Upstream and Downstream Impact Traversal Pattern
CALL () {
  MATCH (target:File)
  WHERE target.absolute_path = $targetPath
     OR target.fileName = $targetPath
     OR apoc.convert.toMap(target)['absoluteFileName'] = $targetPath
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "<DEPENDS_ON",
    labelFilter: "+File",
    minLevel: 0,
    maxLevel: $upstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path

  UNION

  MATCH (target:File)
  WHERE target.absolute_path = $targetPath
     OR target.fileName = $targetPath
     OR apoc.convert.toMap(target)['absoluteFileName'] = $targetPath
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "DEPENDS_ON>",
    labelFilter: "+File",
    minLevel: 0,
    maxLevel: $downstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path
}
WITH collect(path) AS allPaths
UNWIND allPaths AS p
UNWIND nodes(p) AS sfNode
WITH collect(DISTINCT sfNode) AS impactedFiles,
     [pathItem IN allPaths | relationships(pathItem)] AS relArrays
WITH impactedFiles, [r IN apoc.coll.flatten(relArrays) WHERE r IS NOT NULL] AS traversedRels
UNWIND impactedFiles AS sf
WITH sf, traversedRels,
     [(sf)<-[:WITH_SOURCE]-(tJava:Type) WHERE NOT tJava.name CONTAINS '$' | tJava] AS javaTypes,
     [(sf)-[rTS]->(tTS) WHERE type(rTS) IN ['DECLARES', 'EXPORTS'] AND ANY(lbl IN labels(tTS) WHERE lbl IN ['Class', 'Interface', 'TypeAlias', 'Enum']) | tTS] AS tsTypes
WITH sf, coalesce(head(javaTypes), head(tsTypes), sf) AS t, traversedRels
RETURN sf.fileName AS fileName, sf.absolute_path AS path, t.fqn AS fqn
```

---

## 4. Workflow State Diagram

```mermaid
stateDiagram-v2
    [*] --> CodebaseContext: Launch Task

    state "Active Session Container" as Active {
        CodebaseContext --> Instructions: Select AST Nodes
        Instructions --> LLMChat: Build Prompt Payload
        LLMChat --> ResultsManager: Execute Stream
    }

    ResultsManager --> [*]: Task Complete

    state "Error Diagnostics & Recovery" as Recovery {
        ResultsManager --> LLMChat: Action "Reload Session"
        LLMChat --> LLMChat: Inject Error Log & Re-run
    }

    note right of Recovery
        Restores session pointers without
        duplicating AST graph in memory.
    end note
```
EOF

# ------------------------------------------------------------------------------
# 3. EXHAUSTIVE USER GUIDE
# ------------------------------------------------------------------------------
cat << 'EOF' > documentation/sdlc-refactoring/03_User_Guide.md
# Token Razor SDLC — Comprehensive User Guide

## 1. Navigating the Extension
Navigation is managed through the **Left Sidebar Menu** (`SdlcSidebarMenu`).

### A. SDLC Workflow Menu Group
1. **1. Codebase Context:** Select target files or classes from the tree or Neo4j dependency graph. Configure callers (upstream) and callees (downstream) search depth.
2. **2. Instructions:** Define the execution instructions using one of three tabs:
   * **Vibe Coding:** Plain text description of the desired change.
   * **BMad Agent:** Select an AI Agent role (e.g., `SecurityAuditAgent`) from the dropdown.
   * **SpecKit:** Paste formal Markdown or Gherkin specifications.
3. **3. LLM Chat:** Select the model provider (Ollama, Gemini, Copilot) and model name. Click **Send** to stream the response.
4. **4. Results Manager:** View execution history, status badges, and error diagnostics.

### B. Configuration Menu Group
* **App Configuration:** Adjust global parameters, default models, temperature, jQAssistant parser settings, and regex anonymization rules.

---

## 2. Step-by-Step Workflows

### Scenario 1: Refactoring a Java Service with Impact Analysis
1. Open **Codebase Context**.
2. Locate `FundTransferServiceImpl.java` in the tree or graph.
3. Set **Upstream Depth** to `2` and **Downstream Depth** to `2`.
4. Click **Fetch Impacts**. Token Razor highlights all dependent controllers and repositories.
5. Switch to **Instructions**, choose **BMad Agent**, and select `CodeRefactoringAgent`.
6. Switch to **LLM Chat**, select `Copilot` / `gpt-4o`, and click **Execute**.

### Scenario 2: Recovering from a Failed Script Execution
1. If an AI-generated script fails during execution, open **Results Manager**.
2. Locate the failed session (marked with a red warning badge).
3. Click **Reload Session**.
4. The application automatically reloads your context pointers and prompt, transitioning you back to **LLM Chat**.
5. Paste the build error into the chat and ask the LLM to patch the issue.

---

## 3. Privacy & Security Policies
To protect sensitive credentials:
1. Go to **Configuration > Policies & Security**.
2. Enable default anonymization rules or click **Add Rule**.
3. Define a regex pattern (e.g., `(?i)(password|secret)\s*=\s*['"][^'"]+['"]`).
4. Set the replacement token (e.g., `ANONYMIZED_SECRET`).
5. All matching credentials will be masked automatically before context is sent to external LLMs.
EOF

# ------------------------------------------------------------------------------
# 4. EXHAUSTIVE MIGRATION PLAN
# ------------------------------------------------------------------------------
cat << 'EOF' > documentation/sdlc-refactoring/04_Migration_Plan.md
# Token Razor SDLC — Refactoring Master Plan & Status Report

## 1. Architectural Objectives & Constraints
* **DDD Structure:** Re-organize `webview/src/features/explorer` into domain modules under `webview/src/features/sdlc/domains/`.
* **Hexagonal RPC Integrity:** Preserve auto-generated API services (`webview/src/services/api/`) and backend adapters (`backend/src/services/`).
* **OOM Prevention:** Separate heavy AST cache (`useCodebaseCache.ts`) from lightweight session metadata (`useSdlcSessionStore.ts`).

---

## 2. Legacy-to-DDD Source Mapping Table

| Legacy Path (`webview/src/features/explorer/`) | Target DDD Path (`webview/src/features/sdlc/`) |
| :--- | :--- |
| `wkp-lft-codebase-tree/` | `domains/codebase-context/components/codebase-tree/` |
| `wksp-cnt-graph/` | `domains/codebase-context/components/dependency-graph/` |
| `wkp-top-impacted-paths/` | `domains/codebase-context/components/impacted-paths/` |
| `wkp-rgt-tabs-files-context/inspector-panel.tsx` | `domains/codebase-context/components/inspector/` |
| `wkp-rgt-tabs-files-context/files-context.tsx` | `domains/codebase-context/components/files-selection/` |
| `sdb-rgt-prompt/prompt.tsx` | `domains/instructions/` (Vibe, BMad, SpecKit) |
| `sdb-rgt-prompt/llm-chat/` | `domains/llm-chat/` |
| `transformer-panel.tsx` | `domains/configuration/sub-features/PoliciesConfigFeature.tsx` |

---

## 3. Migration Status Tracking

| Batch | Phase | Components & Modules | Status |
| :--- | :--- | :--- | :--- |
| **0** | Documentation | Functional Doc, Technical Doc, User Guide, Migration Plan | ✅ **COMPLETED** |
| **1** | Core Foundation | Shared DTOs, RPC Ports, Backend Adapters, Zustand Stores (`useSdlcSessionStore`, `useCodebaseCache`, `useGlobalConfigStore`), `useSdlcWorkflowMachine` | ✅ **COMPLETED** |
| **2** | Context UI | `ui-common/` shared components, `domains/codebase-context/` (Tree, Graph, Inspector, Impact Paths) | ✅ **COMPLETED** |
| **3** | Instruct & Config | `domains/instructions/` (Vibe, BMad, SpecKit), `domains/configuration/` (Global, Parsers, Policies) | ✅ **COMPLETED** |
| **4** | LLM & Results | `domains/llm-chat/`, `domains/results-manager/` (Session Table & Reload Handoff) | ✅ **COMPLETED** |
| **5** | Orchestration | `SdlcLayoutOrchestrator.tsx`, `SdlcSidebarMenu.tsx`, `App.tsx` Integration, and TS Type Fixes | ✅ **COMPLETED** |
| **6** | Finalization | Final documentation synchronization | ✅ **COMPLETED** |

EOF

echo "✅ Exhaustive Markdown documentation successfully generated in /documentation/sdlc-refactoring/."

# Rebuild the project to ensure complete compilation
npm run build
