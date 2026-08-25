# Token Razor SDLC - Full Architecture & Migration Plan

### 🎭 Role & Architectural Objective
Reverse-engineer and refactor the monolithic legacy feature located at `webview/src/features/explorer` into a clean, modular, memory-safe, and multi-instance domain architecture under `webview/src/features/sdlc/`.

---

### 🧱 1. Strict Architectural Patterns & Extensibility (CRITICAL)
This application operates on a strict Hexagonal/Port-Adapter RPC architecture communicating with a VS Code extension host backend.
* Existing data fetching logic correctly uses the `webview/src/services/api/` layer extending `AbstractApiService`.
* **New Additions:** To support the multi-session architecture and the `ResultsManager` reload functionality, we introduced the `ISdlcSessionServicePort` inside the shared domain, and a backend disk persistence adapter (`SdlcSessionAdapter`).

---

### ⚡ 2. Memory-Safe State Architecture (Zustand Refactoring)
The monolithic `useExplorerStore.ts` was dismantled into a normalized model protecting the Webview from Out-Of-Memory (OOM) crashes:
1. **The Heavy Cache** (`useCodebaseCache.ts`): Stores the raw AST `CodebaseData` as a singleton.
2. **The Session State** (`useSdlcSessionStore.ts`): Stores lightweight parameters (Callers Depth, Selected IDs, Chat History) per workflow session.

---

### 🔄 3. Orchestration & Handoff Flow (`SdlcLayoutOrchestrator.tsx`)
The orchestrator successfully decouples business logic from layout manipulation:
1. **The Machine:** `useSdlcWorkflowMachine.ts` manages the current step (e.g., `CODEBASE_CONTEXT -> INSTRUCTIONS -> LLM_CHAT -> RESULTS_MANAGER`).
2. **The Controller:** `SdlcLayoutOrchestrator.tsx` mounts the active feature into `useLayoutStore` containers.
3. **Sidebar Trigger:** The `SdlcSidebarMenu.tsx` provides the navigation commands to alter the active state machine step.

---

## Migration Status Tracking

| Batch | Phase | Components / Modules | Status |
| :--- | :--- | :--- | :--- |
| **0** | Documentation | Functional, Technical, User Guide, Plan | ✅ **COMPLETED** |
| **1** | Core Foundation | Shared DTOs, RPC Ports, Backend Adapters, Zustand Stores | ✅ **COMPLETED** |
| **2** | Context UI | `ui-common/` shared components, `domains/codebase-context/` | ✅ **COMPLETED** |
| **3** | Instruct & Config | `domains/instructions/`, `domains/configuration/` | ✅ **COMPLETED** |
| **4** | LLM & Results | `domains/llm-chat/`, `domains/results-manager/` | ✅ **COMPLETED** |
| **5** | Orchestration | `SdlcLayoutOrchestrator.tsx`, integration into `App.tsx` | ✅ **COMPLETED** |
| **6** | Finalization | Final documentation updates | ✅ **COMPLETED** |

