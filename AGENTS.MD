<!-- bmad:context -->
<!-- Verified 2026-09-11 against Token Razor Codebase. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

# 🪒 Token Razor - Global LLM Agent Instructions & Repository Context

Token Razor is a VS Code Extension Host application (TypeScript/Node.js ES2022) with a React Webview UI (React 19, Tailwind CSS, shadcn/ui, Zustand) and Python/GraphRAG background services (Python 3.11+, Neo4j, jQAssistant). It enables surgical file selection from codebase dependency graphs to construct token-optimized LLM prompts.

* Notice :
  * Effective relative paths defined relative to the project root (`./`)

---

## 🛡️ Policy & Security Invariants

- 🛑 **No Shell Injection**: Never use raw string template interpolation when calling shell commands or scripts (`execSync`, `exec`). Always use parameterized argument arrays (`child_process.execFile` or `spawn`) with `shell: false` and strict path escaping.
- 🧟 **Process Lifecycle & Zombie Cleanup**: All child processes (Python interpreter scripts, external tools) must be managed using process group detachment (`detached: true`) and registered with `vscode.Disposable` or Webview `onDidDispose` handlers using `tree-kill` / `SIGKILL` on process groups.
- 🔐 **Secret Isolation**: Never store sensitive credentials (e.g., Gemini API keys) in `package.json` settings or unencrypted `.vscode/settings.json`. Always use VS Code's native `SecretStorage` API (`context.secrets`).
- ⚡ **Immutable Code Generation**: Never manually edit auto-generated files (`.gen.ts`, `.gen.tsx`). Always run `npm run generate:code` (or `npm run generate:rpc-registrator`) and verify zero uncommitted diffs using `npm run verify:generated` in CI pipelines.
- 🚧 **Workspace Path Containment**: Always validate that resolved absolute paths remain strictly within authorized workspace roots (`isPathInsideWorkspace` using `path.relative`) before performing file system read/write operations.

---

## 🗺️ Where Things Are (Effective Relative Paths)

- 🔌 **Backend Extension Host**: `./backend/src/services/` (or `./backend/src/services/` for domain adapters), `./backend/src/managers/` (VS Code settings and process managers), `./backend/src/core/` (`ServiceRegistry`, `AbstractServiceAdapter`).
- 🎨 **Webview Frontend**: `./webview/src/` and `./webview/src/features/sdlc/` (React UI components, custom hooks, Zustand domain state stores).
- 🔀 **Shared RPC Layer**: `./shared/rpc/` (`RpcProtocol`), `./shared/config/` (service enums, RPC method constants), `./shared/services/` (strongly-typed DTOs and port interfaces).
- 🐍 **Python Background Engines**: `./backend/src/services/_python-scripts/` (bridge wrappers), `.token-razor/` (local workspace execution directory).
- 🕸️ **GraphRAG & Neo4j Integration**: `./backend/src/services/graph-rag-explorer/`, `./backend/src/services/neo4j/` (Cypher query builders, jQAssistant GraphRAG normalization).

### 📂 Directory Structure

```text
./
├── .token-razor/                                # 🐍 Local workspace execution directory (when extension is installed)
├── backend/                                     # 🔌 Backend Extension Host
│   └── src/
│       ├── core/                                # 🔌 ServiceRegistry, AbstractServiceAdapter
│       ├── managers/                            # 🔌 VS Code settings and process managers
│       └── services/                            # 🔌 Domain adapters & extension host services
│           ├── _python-scripts/                 # 🐍 Bridge wrappers
│           ├── <feature-name>/                  # 🔌 Feature Backend Domain Adapter
│           │   └── <feature-name>-service.adapter.ts # 🔌 Domain service adapter implementation
│           └── neo4j/                           # 🕸️ Cypher query builders, jQAssistant GraphRAG normalization
├── shared/                                      # 🔀 Shared RPC Layer
│   ├── config/                                   # 🔀 Service enums, RPC method constants
│   ├── rpc/                                     # 🔀 RpcProtocol implementation
│   └── services/                                # 🔀 Strongly-typed DTOs and port interfaces
│       └── <feature-name>/                      # 🔀 Feature Contracts, DTOs & Ports
│           ├── index.ts                         # 📦 Shared service export barrel
│           ├── model/                           # 📐 interface of Domain DTOs & Data Transfer Models
│           │   ├── index.ts                     # 📦 Models export barrel
│           │   ├── <sample-report>.ts             # 📐 Assessment report model schema
│           │   └── <sample-result>.ts             # 📐 Assessment result model schema
│           ├── types/                           # 📐 Domain Enum, type with list of values
│           │   ├── index.ts                     # 📦 Types export barrel
│           │   ├── <sample-pillar>.enum.ts        # 📐 Sample enum
│           │   └── <sample-status>.type.ts        # 📐 Sample status type
│           └── port-out/                        # 🔌 Service Output Ports
│               └── <feature-name>-service.port.ts # 🔌 Service port interface definition
└── webview/                                     # 🎨 Webview Frontend
    └── src/
        ├── components/                          # 🧩 UI Primitives & Design System
        │   └── ui/                              # 🧩 Adapted shadcn/ui Primitives (Base UI + Tailwind v4 Styled)
        │       ├── button.tsx                   # 🔘 Button primitive with variants
        │       └── input.tsx                    # ✏️ Styled native input component
        │
        └── features/                            # ⚛️ Isolated Feature Domains
            └── <feature-name>/                  # ⚛️ Main Isolated Feature Domain
                ├── <FeatureName>Feature.tsx     # 🚀 Primary Entry Point Component
                ├── index.ts                     # 📦 Feature Export Barrel
                │
                ├── components/                  # 🧩 <FeatureName> Core Layout Components
                │   ├── <FeatureName>Panel.tsx   # 🖼️ Main Content Layout Wrapper
                │   ├── <FeatureName>ToolBar.tsx # 🛠️ Toolbar
                │   ├── <FeatureName>Header.tsx  # 📌 Feature Header with native action buttons
                │   ├── <sample-kpis>.tsx        # 📈 Summary KPI Metric Cards container
                │   ├── <sample-legend>.tsx      # 🎨 Status color rules & badge indicator legends
                │   └── tabs/                    # 📑 Feature Views / Tab Panels
                │       ├── <FeatureName>Tab.tsx # 📑 Primary Assessment Matrix view
                │       ├── <sample-extracts-and-assessors-tab>.tsx # 📑 Extracts & Assessors tabular view
                │       └── <sample-pillar-delta-analytics-tab>.tsx # 📑 Analytics & Delta comparison view
                │
                ├── data/                        # ⚙️ YAML/JSON/CSV used for Webview rendering like select options, legends, and sample datasets
                │   ├── <feature-name>.csv       # 📊 Source CSV data
                │   └── <feature-name>.json      # 📄 Structured domain JSON dataset
                │
                ├── hooks/                       # ⚓ Custom React Hooks
                │   ├── use<FeatureName>Handlers.ts # ⚡ Action & event handlers hook
                │   └── use<FeatureName>State.ts # 🔄 Reactive state selectors hook
                │
                ├── layout-ctns/                 # 📐 Scoped Layout Containers
                │   └── CenterPanelContainer.tsx # 📐 Centered panel wrapper container
                │
                ├── store/                       # 🗃️ State Store Layer
                │   └── use<FeatureName>Store.ts # 🔄 Zustand domain state store
                │
                ├── types/                       # 📐 TypeScript Contracts
                │   └── <feature-name>.types.ts  # 📐 Domain types & data contracts
                │
                └── utils/                       # 🛠️ Helper Utilities
                    └── htmlSanitizer.ts         # 🧹 HTML & DOM sanitization utility
```

---

## 🚀 Running and Verifying

- ⚙️ **Build Backend**: `npm run compile` (compiles TypeScript Extension Host via esbuild).
- 🖥️ **Build / Run Webview**: `npm run dev:webview` / `npm run build:webview` (Vite / React 19).
- 🧪 **Verify Code Generation**: `npm run verify:generated` (runs RPC/service code generators and asserts `git diff --exit-code`).
- ✅ **Run Test Suite**: `npm run test` (Vitest unit tests for Webview components and backend service adapters).

---

## 📐 Conventions That Differ From Defaults

- 🏗️ **Declarative Webview Architecture**: Enforce pure separation of concerns into `[Feature].component.tsx` (view), `use[Feature]Handlers.ts` (event handlers), `use[Feature]State.ts` (local state), and `[feature].store.ts` (Zustand global store). Never embed inline regex parsing or multi-step async orchestration in JSX render functions.
- 🔄 **RPC Exception Boundaries**: Every RPC protocol handler must wrap backend service calls in top-level try-catch blocks and explicitly post structured error objects `{ id, error: string }` back to the Webview to prevent promise hanging.
- 🧹 **Safe Inter-Process File Cleanup**: Wrap all temporary file creations in system temp directories inside explicit `try ... finally` blocks to guarantee immediate `fs.unlinkSync` deletion regardless of process exit status.
- 🌊 **Payload Chunking / Streaming**: Paginate or stream IPC payloads exceeding 1 MB across `postMessage` to prevent main-thread UI freezing in the Webview.
- 🎨 **CSS Design Tokens**: Use semantic CSS theme variables (`var(--primary)`) instead of hardcoded hex strings to ensure seamless dark/light theme switching.

---

## ⚠️ Known Pitfalls

- 🚫 **No `any` Casts on RPC Bridge**: Do not pass untyped `any` objects across RPC service adapters. Use strongly-typed DTOs validated with Zod schemas.
- 📦 **Deprecate Legacy Features**: Do not add or edit code in `./webview/src/features/explorer-old/`. All active codebase explorer and graph context logic belongs exclusively under `./webview/src/features/sdlc/domains/codebase-context/`.
- 🎣 **Catch Floating VS Code Promises**: Always attach `.catch()` rejection handlers or try-catch blocks to asynchronous VS Code API calls (`vscode.workspace.openTextDocument`, `vscode.env.openExternal`).
- 📁 **Exclude Sample Artifacts**: Never include sample AST JSON benchmark files in production VSIX packages (exclude via `.vscodeignore`).

<!-- /bmad:context -->
