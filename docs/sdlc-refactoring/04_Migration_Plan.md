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

