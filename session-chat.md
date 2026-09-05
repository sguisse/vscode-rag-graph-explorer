# Finalize exporter Webview migration

> # ROLE
>
> You are an Expert Software Architect specializing in VS Code Extension development, specifically in migrating legacy native extensions to a modern React-based Webview architecture using strict RPC communication.
>
> # CONTEXT & ARCHITECTURAL CONSTRAINTS
>
> We are finalizing the migration of a legacy native VS Code extension (source code in `sandbox\sources-vscode-files-exporter.yaml`) to a new React-based Webview architecture.
>
> - **Frontend (UI) & Strict Feature Pattern:** Located in `webview\src\features\exporter`. You MUST strictly adhere to the React "Feature Pattern". You must cleanly separate concerns by splitting the code into dedicated sub-directories:
>   - `/components`: Pure presentational or layout components.
>   - `/hooks`: Custom hooks for logic, event handlers, and value management.
>   - `/store`: State management and stores.
>   - `/types`: UI-specific types and UI Models (strictly for the view layer).
> - **Shared Domain (****`/shared`****):** All core business models, common types, DTOs, VOs, and interfaces used for Webview/Backend communication MUST be extracted and centralized here. Do not duplicate domain models in the frontend or backend.
> - **Python Scripts:** Already migrated to `scripts\codebase_exporter`.
> - **Backend (****`/backend`****):** Contains services interacting with the VS Code API, File System, Database, etc. The entry point `backend\src\extension.ts` MUST remain extremely lightweight; all logic must be extracted to external files and imported.
> - **Target Backend Adapters to use/expand:**
>   - `backend\src\services\file-exporter\fe-history-service.adapter.ts` (for history management)
>   - `backend\src\services\file-exporter\files-exporter-service.adapter.ts` (for all other core services)
> - **Frontend API:** Webview calls backend services via RPC defined in `webview\src\services\api`. The Webview has NO direct access to the VS Code API.
>
> # OBJECTIVE
>
> Your goal is to successfully finalize the migration by first generating an ultra-exhaustive Markdown migration plan (`migration-plan-report-remaining-tasks.md`), and then executing the implementation step-by-step while keeping the plan updated.
>
> # INSTRUCTIONS
>
> ## Phase 1: Deep Gap Analysis (Think Step-by-Step)
>
> 1. **Analyze Legacy Code:** Deeply inspect `sandbox\sources-vscode-files-exporter.yaml` to catalog every single feature, UI component, event listener, state change, and VS Code API interaction.
> 2. **Analyze Current State:** Inspect the new codebase (`webview\src\features\exporter`, `/backend`, and `/shared`) to map exactly what has already been migrated.
> 3. **Identify the Gap:** Cross-reference step 1 and 2 to identify all missing functionalities, UI elements, custom hooks needed, missing RPC endpoints, and backend services required to achieve 100% compliance with the legacy extension.
>
> ## Phase 2: Generate the Markdown Report
>
> Create the file `migration-plan-report-remaining-tasks.md` on disk. It must be highly detailed, provide architectural guidelines for developers, and be structured exactly as follows (using emojis for all H1 and H2 headers):
>
> # 🚀 File Exporter Migration Plan
>
> ## 📊 1. Gap Analysis Summary
>
> (A brief executive summary of what is already done vs what is missing).
>
> ## 🧩 2. Webview / UI Remaining Tasks
>
> (For each missing feature: detail the specific UI components, the custom hooks needed for handlers/state, the store updates, and the UI-specific types. Explicitly state how the code will be split according to the Feature Pattern).
>
> ## ⚙️ 3. Backend & RPC Remaining Tasks
>
> (For each missing service: specify if it belongs in `fe-history-service.adapter.ts` or `files-exporter-service.adapter.ts`. Detail the required VS Code API calls, file system interactions, and the RPC interface definitions).
>
> ## 📦 4. Shared Domain & DTOs
>
> (Define the exact data structures, core models, DTOs, and VOs that need to be added to the `/shared` folder to support the missing features).
>
> ## 📋 5. Actionable Task Tracker
>
> (A Markdown table tracking every required task. Columns: `Task ID` | `Domain (UI/Backend/Shared)` | `Description` | `Status` | `Notes`.
> Use emojis for Status: ⏳ Pending | 🚧 In Progress | ✅ Done | ❌ Error).
> *Note: The initial state for all tasks must be ⏳ Pending.*
>
> ## Phase 3: Execution & Continuous Tracking
>
> Once the Markdown file is completely written and saved to disk:
>
> 1. Begin implementing the pending tasks one by one, strictly adhering to the architectural constraints (Feature pattern, Shared separation, lightweight extension.ts).
> 2. After completing (or failing) each task, you MUST update the `migration-plan-report-remaining-tasks.md` task tracker with the new status (✅ Done or ❌ Error with explanations) before moving to the next task.

<details><summary>36 previous messages</summary>

> I’ll start by reading the legacy export YAML and the current exporter/backend/shared structure, then I’ll write the migration plan before touching implementation. This is a fairly wide migration, so I’ll keep the report grounded in actual code paths instead of guessing.
>
> <details><summary>Ran 3 commands</summary>
>
> - Ran `Get-ChildItem -Force`
> - Ran `rg --files`
> - Ran `git status --short`
>
> </details>
>
> I see the repository already has a fairly complete exporter slice plus generated API services, so the next step is to inventory the legacy YAML precisely and compare it against those files. I’m going to pull targeted slices first: exported legacy commands/events, shared ports/models, backend adapters, and the current React feature.
>
> <details><summary>Explored 3 files, ran 4 commands</summary>
>
> - Ran `rg -n "command|registerCommand|postMessage|onDidReceiveMessage|workspace|window|showOpenDialog|showSaveDialog|clipboard|Terminal|QuickPick|createTerminal|FileType|exclude|include|history|recent|template|token|format|clipboard|output|export" sandbox\sources-vscode-files-exporter.yaml`
>
> - Ran `rg --files webview\src\features\exporter backend\src\services\file-exporter shared\services\file-exporter webview\src\services\api | rg "(exporter|file-exporter)"`
>
> - Ran `(Get-Item sandbox\sources-vscode-files-exporter.yaml).Length`
>
> <details><summary>Explored 3 files</summary>
>
> - Read `./shared/services/file-exporter/port-out/fe-history-service.port.ts`
> - Read `./shared/services/file-exporter/port-out/file-exporter-service.port.ts`
> - Read `./shared/services/file-exporter/model/file-exporter-model.ts`
>
> </details>
>
> - Ran `rg -n "^\s*- filename:|^\s+path:" sandbox\sources-vscode-files-exporter.yaml`
>
> </details>
>
> The first gap is already visible: the shared exporter ports are empty, while the webview has generated API services for exporter/history. I’m checking whether those generated services are currently stubs or wired to backend methods, because that determines whether the implementation is mostly contract work or real behavior.
>
> <details><summary>Explored 15 files</summary>
>
> - Read `./webview/src/services/api/files-exporter-history-api.service.gen.ts`
> - Read `./webview/src/services/api/files-exporter-api.service.gen.ts`
> - Read `./backend/src/services/file-exporter/files-exporter-service.adapter.ts`
> - Read `./backend/src/extension.ts`
> - Read `./backend/src/services/file-exporter/fe-history-service.adapter.ts`
> - Read `./backend/src/config/rpc-method-registrator.gen.ts`
> - Read `./shared/config/service-enum.gen.ts`
> - Read `./backend/src/config/service-registrator.gen.ts`
> - Read `./webview/src/services/api/abstract-api.service.ts`
> - Read `./shared/config/rpc-methods.enum.gen.ts`
> - Read `./webview/src/features/exporter/store/useExporterStore.ts`
> - Read `./webview/src/features/exporter/ExporterFeature.tsx`
> - Read `./webview/src/features/exporter/hooks/use-export-configuration.ts`
> - Read `./webview/src/features/exporter/hooks/use-exporter-execution.ts`
> - Read `./webview/src/features/exporter/hooks/use-exporter-state.ts`
>
> </details>
>
> The current React side is split into the requested directories, but it is still partly local-storage driven and partly routed through the older `codebaseExporterApiService`. That means the migration plan needs to call out replacing local profile behavior with backend history RPC and adding exporter-specific service RPC for the VS Code interactions.
>
> <details><summary>Explored 24 files</summary>
>
> - Read `./webview/src/features/exporter/components/ExporterPanel.tsx`
> - Read `./webview/src/features/exporter/components/DestinationSection.tsx`
> - Read `./webview/src/features/exporter/components/ExportConfigurationPanel.tsx`
> - Read `./webview/src/features/exporter/components/SourcePathsSection.tsx`
> - Read `./webview/src/features/exporter/components/HistoryBar.tsx`
> - Read `./webview/src/features/exporter/components/FiltersSection.tsx`
> - Read `./webview/src/features/exporter/components/ActionToolbar.tsx`
> - Read `./webview/src/features/exporter/components/OutputFormattingSection.tsx`
> - Read `./webview/src/features/exporter/types/exporter.types.ts`
> - Read `./webview/src/features/exporter/constants/exporter-constants.ts`
> - Read `./webview/src/features/exporter/components/tabs/HelpTab.tsx`
> - Read `./webview/src/features/exporter/components/tabs/ReportTab.tsx`
> - Read `./webview/src/features/exporter/components/tabs/TerminalTab.tsx`
> - Read `./webview/src/features/exporter/components/tabs/SimulationTab.tsx`
> - Read `./webview/src/features/exporter/components/tabs/FilesTab.tsx`
> - Read `./webview/src/features/exporter/layout-ctns/CenterPanelContainer.tsx`
> - Read `./webview/src/features/exporter/index.ts`
> - Read `./webview/src/features/exporter/layout-ctns/TopPanelContainer.tsx`
> - Read `./webview/src/features/exporter/layout-ctns/LeftPanelContainer.tsx`
> - Read `./shared/services/codebase-exporter/port-out/codebase-exporter-service.port.ts`
> - Read `./backend/src/services/codebase-exporter/codebase-exporter-service.adapter.ts`
> - Read `./shared/services/codebase-exporter/model/export-result.ts`
> - Read `./shared/services/codebase-exporter/model/export-status.ts`
> - Read `./shared/services/codebase-exporter/model/export-args.ts`
>
> </details>
>
> Exporter execution is functional through the generic codebase exporter service, but the dedicated `FilesExporterAdapter` is empty. I’m checking the Python wrapper and settings now so the dedicated adapter can call the migrated script with the same semantics as legacy.
>
> <details><summary>Explored 12 files</summary>
>
> - Read `./backend/src/managers/VsCodeSettings.manager.ts`
> - Read `./backend/src/services/_python-scripts/copy-files-to-clipboard-py.service.ts`
> - Read `./backend/src/services/_python-scripts/file-exporter-py.service.ts`
> - Read `./shared/services/vscode/model/VsCodeSettings.gen.ts`
> - Read `./backend/src/services/_python-scripts/error-parser-py.service.ts`
> - Read `./scripts/codebase_exporter/error-parser.py`
> - Read `./scripts/codebase_exporter/files-exporter.py`
> - Read `./scripts/codebase_exporter/copy-files-to-clipboard.py`
> - Read `./package.json`
> - Read `./dev-tools/generate-rpc-method-registrator.js`
> - Read `./dev-tools/generate-rpc-methods-enum.js`
> - Read `./dev-tools/generate-webview-api-services.js`
>
> </details>
>
> The generator derives RPC methods directly from shared port interfaces, so the clean path is to define exporter/history ports in `/shared`, regenerate, and implement the matching adapter methods. I’ll keep generated files regenerated rather than hand-patching them.
>
> <details><summary>Explored 5 files, ran 3 commands</summary>
>
> <details><summary>Explored 5 files</summary>
>
> - Read `./shared/services/file-exporter/index.ts`
> - Read `./backend/src/services/vscode/vscode-service.adapter.ts`
> - Read `./shared/services/vscode/port-out/vscode-service.port.ts`
> - Read `./shared/services/file-system/port-out/file-system-service.port.ts`
> - Read `./backend/src/services/file-system/file-system-service.adapter.ts`
>
> </details>
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 920 -First 900`
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 3035 -First 870`
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 1790 -First 1230`
>
> </details>
>
> Legacy coverage is broad: native commands did more than open the UI. They performed headless path export, recursive OS file clipboard copy with size guardrails, backend filter simulation, error-stack parsing, latest-export copy, destination cleanup, history file management, and a tree view. I’m reading those exact legacy handlers/components now so the tracker can be specific.
>
> <details><summary>Ran 4 commands</summary>
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 3660 -First 245`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 1260 -First 540`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 2290 -First 230`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 1890 -First 265`
>
> </details>
>
> The legacy webview itself had more result-surface behavior than the current React tabs: file content regex was backend-backed, logs/reports were distinct lists, and the tree manifest had selectable tri-state nodes that synced source paths. I’m pulling those view services next so the plan doesn’t miss UI-level interactions.
>
> <details><summary>Ran 4 commands</summary>
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 4630 -First 745`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 3895 -First 125`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 4285 -First 350`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 5365 -First 220`
>
> </details>
>
> There are also legacy guardrails and modals that the new UI doesn’t yet represent: invalid path validation, a “crawling risk” confirmation before broad exports, and conflict handling when moving extensions between include/exclude lists. I’m going to treat those as distinct tasks in the report instead of burying them inside general UI cleanup.
>
> <details><summary>Ran 7 commands</summary>
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 5730 -First 465`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 5520 -First 205`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 6210 -First 230`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 6425 -First 575`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 6984 -First 550`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 7530 -First 170`
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 6190 -First 45`
>
> </details>
>
> The new feature already includes most visible blocks, but a few buttons are placeholders and several legacy tabs are thinner than before. I’m checking the current utility/services around filters, pricing, git/error APIs so I can separate “already migrated but thinner” from “missing outright.”
>
> <details><summary>Explored 9 files</summary>
>
> - Read `./webview/src/features/exporter/utils/filter-simulator.ts`
> - Read `./backend/src/services/errors/blast-radius-error-files-identificator-service.adapter.ts`
> - Read `./webview/src/services/api/blast-radius-error-files-identificator-api.service.gen.ts`
> - Read `./webview/src/features/exporter/utils/pricing-calculator.ts`
> - Read `./webview/src/services/api/git-api.service.gen.ts`
> - Read `./backend/src/managers/PythonScriptExecution.manager.ts`
> - Read `./shared/services/errors/port-out/blast-radius-error-files-identificator-service.port.ts`
> - Read `./shared/rpc/rpc-protocol.ts`
> - Read `./shared/services/errors/types/type-blast-radius-scope.gen.ts`
>
> </details>
>
> One small but important API issue popped up: the existing generated error-file API does not forward `includeOutWorkspace`, so the modal would silently ignore that checkbox if we wire it today. I’ll include that in implementation because it is directly tied to migrating the error-stack feature.
>
> <details><summary>Explored 4 files, ran a command</summary>
>
> <details><summary>Explored a file</summary>
>
> - Read `./shared/services/git/port-out/git-service.port.ts`
>
> </details>
>
> - Ran `Get-Content sandbox\sources-vscode-files-exporter.yaml | Select-Object -Skip 7635 -First 120`
>
> <details><summary>Explored 3 files</summary>
>
> - Read `./backend/src/services/git/git-service.adapter.ts`
> - Read `./shared/services/git/model/git-model.ts`
> - Read `./webview/tsconfig.json`
>
> </details>
>
> </details>
>
> At this point the implementation shape is clear. I’ll write the migration plan file first with every task initially marked pending, then I’ll start knocking down the highest-value gaps: shared contracts, generated RPC, dedicated backend adapter methods, frontend hooks/store wiring, error analysis modal, and tree/files/report parity.
>
> I’m creating the report now. I’ll keep the task table as the canonical tracker and update that table after each implementation step, per your instruction.
>
> <details><summary>Created a file</summary>
>
> - Wrote `./migration-plan-report-remaining-tasks.md` (+370 -0)
>
> </details>
>
> The plan is on disk. I’m starting with shared contracts, because the generated RPC layer is only as good as those interfaces; once they exist, the backend and React feature can meet on typed DTOs instead of ad hoc message names.
>
> <details><summary>Explored 8 files</summary>
>
> - Read `./backend/src/core/ServiceRegistry.ts`
> - Read `./backend/src/core/AbstractServiceAdapter.ts`
> - Read `./backend/src/utils/utils-vscode.ts`
> - Read `./backend/src/utils/utils-datetime.ts`
> - Read `./webview/src/components/ui/select.tsx`
> - Read `./webview/src/components/ui/dialog.tsx`
> - Read `./webview/package.json`
> - Read `./webview/src/components/ui/button.tsx`
>
> </details>
>
> I’m editing the shared model and ports now. The key is to make the exporter’s real message surface explicit: initialization, history, process lifecycle, generated-file browsing, and utility actions all become typed RPC methods.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./shared/services/file-exporter/model/file-exporter-model.ts` (+184 -2)
>
> </details>
>
> Shared model DTOs are in place. I’m marking that task done in the tracker before moving to the port interfaces.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./migration-plan-report-remaining-tasks.md` (+1 -1)
>
> </details>
>
> Next I’m expanding the two shared ports. I’ll keep function-typed callbacks out of new RPC method signatures because they don’t serialize across the webview boundary.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./shared/services/file-exporter/port-out/file-exporter-service.port.ts` (+37 -1)
>
> </details>
>
> The exporter service port is now explicit. I’m adding the history service port next, including the legacy selected/all hard/soft clear semantics and history file open/reveal helpers.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./shared/services/file-exporter/port-out/fe-history-service.port.ts` (+25 -1)
>
> </details>
>
> System error
>

</details>
