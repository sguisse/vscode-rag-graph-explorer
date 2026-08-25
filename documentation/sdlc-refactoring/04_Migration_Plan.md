# Token Razor SDLC - Full Architecture & Migration Plan

### 🎭 Role & Architectural Objective
Reverse-engineer and refactor the monolithic legacy feature located at `webview/src/features/explorer` into a clean, modular, memory-safe, and multi-instance domain architecture under `webview/src/features/sdlc/`.

---

### 🧱 1. Strict Architectural Patterns & Extensibility (CRITICAL)
This application operates on a strict Hexagonal/Port-Adapter RPC architecture communicating with a VS Code extension host backend. You must preserve this pattern.

* **DO NOT** rewrite existing data fetching logic into standard HTTP `fetch()` or Axios hooks. You MUST use the `webview/src/services/api/` layer extending `AbstractApiService`.
* **Extending the Shared & Backend Layers:** If the multi-session architecture or `ResultsManager` requires new backend capabilities (e.g., persisting session histories to disk), you **MAY** add new RPC services and Domain Objects.
* **Rules for New Additions:**
  1. **Domain Objects:** Define new models/DTOs inside `@/shared/services/[domain]/domain/model/`.
  2. **RPC Ports:** Define interface contracts in `@/shared/services/[domain]/domain/port-out/`.
  3. **Backend Adapters:** Implement the logic in `backend/src/services/[domain]/` extending `AbstractServiceAdapter`.
  4. **Webview API:** Create the frontend bridge in `webview/src/services/api/` extending `AbstractApiService`.

---

### 🏗️ 2. Target Directory Structure & Application Layer
Split the monolithic React codebase into a Foundation Core, 5 Core Domains, 1 Common Module, and 1 Master Orchestrator. Every domain MUST expose a clean public API via an `index.ts` barrel file.

```text
webview/src/features/sdlc/
├── core/                           # Foundation layer (No UI)
│   ├── store/
│   │   ├── useSdlcSessionStore.ts  # Lightweight multi-session state (metadata & history)
│   │   ├── useCodebaseCache.ts     # Heavy AST singleton cache (prevents OOM)
│   │   └── useGlobalConfigStore.ts # Global workspace-agnostic preferences
│   ├── workflow/
│   │   └── useSdlcWorkflowMachine.ts # Headless state machine for SDLC steps
│   └── vscode-sync/
│       └── session-persistence.manager.ts # Handles debounced RPC sync via vsCodeApiService
│
├── domains/                        # The DDD Feature Modules
│   ├── codebase-context/           # (Tree, Graph, Impact paths, Files selection)
│   ├── instructions/               # (Vibe, BMad, SpecKit prompt panels)
│   ├── llm-chat/                   # (Model selector, Provider routing, Stream UI)
│   ├── results-manager/            # (Session history table, Error logs, Reload actions)
│   └── configuration/              # (Global APIs, JQA Parsers, Security Policies)
│
├── ui-common/                      # Shared perimeter components
│   └── TopMiddleBottomPanel, TriStateCheckbox, etc.
│
└── SdlcLayoutOrchestrator.tsx      # Pure UI Controller mapping domains to layout
```

---

### 🏛️ 3. Domain Specifications & Source Mapping

#### A. CodebaseContext (`domains/codebase-context/`)
* **Focus:** Visualizing and selecting codebase elements via jQA/Neo4j graph and tree views.
* **Source Mapping:**
  * `wkp-lft-codebase-tree` -> `components/codebase-tree/`
  * `wksp-cnt-graph` -> `components/dependency-graph/`
  * `wkp-top-impacted-paths` -> `components/impacted-paths/`
  * `wkp-rgt-tabs-files-context/inspector-panel.tsx` -> `components/inspector/`
  * `wkp-rgt-tabs-files-context/files-context.tsx` (right-side logic) -> `components/files-selection/`

#### B. Instructions (`domains/instructions/`)
* **Focus:** Prompt building and coding strategy.
* **Internal UI Pattern:** A Segmented Tab Navigation bar hosting 3 distinct prompt sub-features:
  1. `VibeInstructionsPanel.tsx` (Rapid, unstructured prompting)
  2. `BMadInstructionsPanel.tsx` (Agent & Skill-driven structured framework)
  3. `SpecKitInstructionsPanel.tsx` (Specification-driven development prompts)
* **Source Mapping:** `sdb-rgt-prompt/prompt.tsx` and left-side prompt logic from `files-context.tsx`.

#### C. LLM Chat (`domains/llm-chat/`)
* **Focus:** Provider routing (Ollama, Gemini, Copilot), chat interface, and stream execution.
* **Source Mapping:** `sdb-rgt-prompt/llm-chat/` (including `llm-models-info.tsx` and message blocks).

#### D. ResultsManager (`domains/results-manager/`)
* **Focus:** Session history, error tracking, and actionable script handling. *(Exclude `files-ctx-export`)*.
* **UI Requirements:** Center Panel Data Table rendering recorded workflow sessions. Columns: `Launch Time`, `Status`, `Error Message`, and `Actions` (`Reload Session`, `Delete Session`).
* **Session Reloading Protocol:** Clicking "Reload Session" loads the lightweight `SdlcSession` payload into memory (restoring `CodebaseContext` pointers and `Instructions` inputs) and triggers `useSdlcWorkflowMachine` to transition to the `LLM_CHAT` step to view iteration history.

#### E. Configuration (`domains/configuration/`)
* **Focus:** Global, workspace-agnostic settings and system policies.
* **Sub-Features:**
  1. `GlobalConfigFeature.tsx`: App settings, APIs, paths.
  2. `CodebaseParsersConfigFeature.tsx`: JQAssistant rules, graphify regex filters.
  3. `PoliciesConfigFeature.tsx`: Anonymization regex rules (`transformer-panel.tsx`), context minifiers, legal controls.

---

### ⚡ 4. Memory-Safe State Architecture (Zustand Refactoring)

You MUST dismantle the monolithic `useExplorerStore.ts` into a normalized model. To prevent VS Code Webview Out-Of-Memory (OOM) crashes, **Session State** MUST be strictly separated from heavy **Cache State**:

```typescript
// 1. THE HEAVY CACHE (Singleton, never duplicated across sessions)
// webview/src/features/sdlc/core/store/useCodebaseCache.ts
export interface CodebaseCacheState {
  currentAst: CodebaseData | null;
  lastUpdated: number;
  setAst: (data: CodebaseData) => void;
}

// 2. THE LIGHTWEIGHT SESSION (Safe to duplicate, persist, and reload)
// webview/src/features/sdlc/core/store/useSdlcSessionStore.ts
export interface SdlcSession {
  sessionId: string;
  createdAt: number;
  status: 'draft' | 'running' | 'error' | 'success';
  errorMessage?: string;

  // Pointers only, no heavy AST objects
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

  chatHistory: IChatMessageDto[];
}

export interface SdlcSessionStoreState {
  sessions: Record<string, SdlcSession>;
  activeSessionId: string | null;
  createSession: () => string;
  setActiveSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateActiveSession: (updater: (draft: SdlcSession) => void) => void;
}

// 3. THE GLOBAL STORE (Workspace-Agnostic Preferences)
// webview/src/features/sdlc/core/store/useGlobalConfigStore.ts
export interface GlobalConfigState {
  globalConfig: GraphRagExplorerConfig;
  anonymizationRules: AnonymizationRule[];
  // ... update methods
}
```

---

### 🔄 5. Orchestration & Handoff Flow (`SdlcLayoutOrchestrator.tsx`)

The orchestrator must strictly decouple business logic from layout manipulation.
1. **The Machine:** `useSdlcWorkflowMachine.ts` manages the current step (e.g., `START -> CONTEXT -> INSTRUCTIONS -> LLM -> RESULTS`).
2. **The Layout Controller:** `SdlcLayoutOrchestrator.tsx` listens to the machine and mounts the correct domain Feature into `useLayoutStore` containers (`workspace.center`, `workspace.left`, etc.).
3. **Sidebar Integration:** Exposes route triggers for `sidebarLeft` under two top-level groups:
   * **"SDLC Workflow Steps"** (`CodebaseContext`, `Instructions`, `LLM`, `ResultsManager`)
   * **"Configuration"** (`GlobalConfig`, `CodebaseParsersConfig`, `PoliciesConfig`)

---

## Migration Status Tracking

| Batch | Phase | Components / Modules | Status |
| :--- | :--- | :--- | :--- |
| **0** | Documentation | Functional, Technical, User Guide, Plan | ✅ **COMPLETED** |
| **1** | Core Foundation | Shared DTOs, RPC Ports, Backend Adapters, Zustand Stores (`useSdlcSessionStore`, `useCodebaseCache`, `useGlobalConfig`), `useSdlcWorkflowMachine` | ⏳ PENDING |
| **2** | Context UI | `ui-common/` shared components, `domains/codebase-context/` (Tree, Graph, Inspector) | ⏳ PENDING |
| **3** | Instruct & Config | `domains/instructions/` (Vibe, BMad, SpecKit), `domains/configuration/` (Global, Parsers, Policies) | ⏳ PENDING |
| **4** | LLM & Results | `domains/llm-chat/`, `domains/results-manager/` (Session Table & Reload) | ⏳ PENDING |
| **5** | Orchestration | `SdlcLayoutOrchestrator.tsx`, integration into `App.tsx` | ⏳ PENDING |
| **6** | Finalization | Final documentation updates | ⏳ PENDING |

