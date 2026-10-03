# 📊 Architectural & Behavioral Migration Audit: Codebase Explorer vs Codebase Context

## 🎯 Executive Summary & Scope

This audit report delivers a deep, un-compromised comparative analysis between the legacy codebase exploration feature (`webview/src/features/explorer-old`) and the newly migrated business domain (`webview/src/features/sdlc/domains/codebase-context`).

Following a complete inspection of both codebases (including store slices, layout orchestration, Cytoscape graph rendering hooks, tree view finders, inspector panels, exporter integration, and VS Code API RPC bridges), this document pinpoints all migrated behaviors, orphaned components, stubbed functionalities, and architectural gaps.

---

## 💾 1. Store State & Persistence Architecture

**Old File:** `webview/src/features/explorer-old/store/useExplorerStore.ts`
**New File:** `webview/src/features/sdlc/domains/codebase-context/store/useCodebaseDomainState.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `store/useCodebaseDomainState.ts` | `ImpactedPathsPanelState` | Stores `currentPath`, `pathsList`, `paths`, `upstreamDepth`, `downstreamDepth`, and `codebase`. | ✅ Migrated | State slice cleanly extracted and active in the domain store. |
| `store/useCodebaseDomainState.ts` | `CodebaseTreePanelState` | Stores `expandedFolders` and provides `toggleFolder`. | ✅ Migrated | Basic tree expansion state migrated. |
| `store/useCodebaseDomainState.ts` | `DependencyGraphPanelState` | Stores `graphRendering`, `currentLayout`, `maxNodesLimit`, `callersDepth`, `calleesDepth`, `displayLevel`. | ✅ Migrated | Graph configuration parameters fully present in domain state. |
| `store/useCodebaseDomainState.ts` | `FilesContextPanelState` | Stores `selectedEntity`, `targetFilePaths`, `selectedContextFiles`, `selectAllFiles`, `toggleFileCheckbox`, `toggleFolderCheckbox`. | ✅ Migrated | File selection and inspector entity targets active in state. |
| `store/useExplorerStore.ts` | Store Persistence (`hydrateStore` / `saveUserPreferences`) | Asynchronous hydration via `readUserPreferences` and microtask-debounced subscriber syncing user state with VS Code settings. | ❌ Not Migrated | Store state in `useCodebaseDomainState` is ephemeral. All user settings reset on webview reload. |
| `store/useExplorerStore.ts` | Workflow State (`dataWorkflow` / `setSelectedWorkflowStep`) | Tracks workflow steps and step completion statuses. | ❌ Not Migrated | Omitted from domain store (intended separation of concerns for domain modularization). |
| `store/useExplorerStore.ts` | Prompt Builder State (`config` / `promptFields`) | Manages prompt field configurations and system prompt assembly (`getFullPrompt`). | ❌ Not Migrated | Prompt builder moved outside codebase context domain scope. |
| `store/useExplorerStore.ts` | LLM Chat State (`llmMessages` / `llmAttachedFiles`) | Tracks active chat messages, temperature, attached context files, and LLM provider model selection. | ❌ Not Migrated | LLM chat state isolated from context domain store. |
| `store/useExplorerStore.ts` | Context Transformer State (`transformerRules`) | Anonymization rules state array (`DEFAULT_ANONYMIZATION_RULES`). | ❌ Not Migrated | Anonymization rules slice omitted in new store. |

---

## 🌲 2. Codebase Explorer Tree Panel (`components/codebase-tree`)

**Old Directory:** `webview/src/features/explorer-old/wkp-lft-codebase-tree/`
**New Directory:** `webview/src/features/sdlc/domains/codebase-context/components/codebase-tree/`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `CodebaseExplorerPanel.tsx` | ViewMode Groupings (`scope`, `folder`, `layer`, `typology`, `tags`) | Multi-view grouping mode selector and dynamic category grouping calculation logic. | ✅ Migrated | All 5 view modes fully functional in `useCodebaseExplorerPanel.ts`. |
| `CodebaseExplorerPanel.tsx` | Treeview Finder (Loupe) | Finder bar (`FinderTree` & `FinderHtml`) supporting Regex, Case Sensitivity, Whole Word, Match Index counter, and match auto-scroll. | ✅ Migrated | Migrated into `use-treeview-finder.ts` utilizing `useFinderBase`. |
| `CodebaseExplorerPanel.tsx` | Keyboard Shortcut (`Cmd+F` / `Ctrl+F`) | Panel-scoped keyboard listener opening treeview finder. | ✅ Migrated | Keydown listener active in `CodebaseExplorerPanel.tsx`. |
| `CodebaseExplorerPanel.tsx` | Single & Double Click Actions | Single-click reveals & copies path (`revealAndCopyFile`); double-click opens in editor (`openFileInEditor`). | ✅ Migrated | Refactored cleanly using custom hook `useCodebaseActions`. |
| `TriStateCheckbox.tsx` & `RecursiveFolderNode.tsx` | Tri-State Folder Checkboxes & Event Isolation | Indeterminate visual state for partial folder selections with event propagation stops (`e.stopPropagation()`). | ✅ Migrated | Migrated with improved event propagation isolation to prevent accidental tree collapses on check. |
| `codebase-tree.utils.ts` | Tree Utilities (`compactFolderTree`, `buildFolderTreeForScope`) | Collapses single-child folder chains (`com.example.service`) and builds scope trees. | ✅ Migrated | Utility suite completely preserved. |
| `import-ast-dialog.tsx` | AST Schema JSON Importer & Exporter | Modal for drag & drop or direct JSON AST input and AST JSON exporter button. | ✅ Migrated | Dialog and top toolbar trigger buttons (`Upload`, `Download`) fully functional. |

---

## 🎯 3. Impacted Paths Analysis Panel (`components/impacted-paths`)

**Old Directory:** `webview/src/features/explorer-old/wkp-top-impacted-paths/`
**New Directory:** `webview/src/features/sdlc/domains/codebase-context/components/impacted-paths/`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `ImpactedPathsPanelHeader.tsx` | Depth Inputs (`#input-upstream-depth`, `#input-downstream-depth`) | Interactive numeric inputs (0-20) driving upstream and downstream propagation depths. | ✅ Migrated | Component and controls fully migrated. |
| `ImpactedPathsPanelHeader.tsx` | Cypher Parameter Builder (`buildDefaultCypherQueryParameters`) | Generates Neo4j `:param` JSON payload for active paths & depth, copying to OS clipboard. | ✅ Migrated | Database button and hook logic preserved in `use-impacted-paths.ts`. |
| `use-impacted-paths.ts` | Inter-Window RPC Message Handlers | Event listeners for `selectedPath` and `addPathToTop` commands from extension backend. | ✅ Migrated | Registered via `vsCodeHandleMessage.on()`. |
| `use-impacted-paths.ts` | Real-time Impact Retrieval | Fetches Neo4j graph impact data via `getPathsChangeImpacts` API call on textarea change. | ✅ Migrated | Preserved with auto `selectAllFiles()` trigger on data load. |

---

## 🕸️ 4. Workspace Dependency Graph Visualizer (`components/dependency-graph`)

**Old Directory:** `webview/src/features/explorer-old/wksp-cnt-graph/`
**New Directory:** `webview/src/features/sdlc/domains/codebase-context/components/dependency-graph/`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `GraphToolbar.tsx` | Floating Canvas Overlay Toolbar | Overlay toolbar controlling Max Nodes Limit, Callers Depth, Callees Depth, and Display Level filter. | ✅ Migrated | Component and state wiring active on graph canvas top overlay. |
| `GraphPanelHeader.tsx` | Shape Rendering Switcher (`#select-graph-rendering`) | Switches node visual shapes (`uml`, `condensed`, `minized`, `rounded`). | ✅ Migrated | Toolbar dropdown and rendering components fully wired. |
| `GraphPanelHeader.tsx` | Layout Engine Switcher & Custom DAG Layout | Layout selector (`preset`, `cose`, `grid`, `breadthfirst`) with custom topological algorithm (`applyCustomHierarchicalLayout`). | ✅ Migrated | Custom topological level layout with edge-label gap calculation fully functional in `useGraphTopology.ts`. |
| `GraphPanelHeader.tsx` | Neo4j Browser Link & Controls | Button launching Neo4j web browser, zoom in/out, fit view, grid toggle, and attributes/methods toggles. | ✅ Migrated | Preserved in `GraphPanelHeader.tsx`. |
| `useCytoscapeInstance.ts` | Custom Wheel Zooming & Panning Engine | Intercepts `Wheel` events: `Cmd/Ctrl + Wheel` zooms toward cursor; standard `Wheel` pans without scrolling webview. | ✅ Migrated | Event listener with `{ capture: true, passive: false }` preserved. |
| `useCytoscapeInstance.ts` | Canvas Mouse Hover & Click Events | Cursor pointer changes, tooltip updates (`data-tooltip`), single-click reveal/copy, and double-click editor open. | ✅ Migrated | Cytoscape event delegation completely intact. |

---

## 🔍 5. Inspector Panel (`components/inspector`)

**Old Directory:** `webview/src/features/explorer-old/wkp-rgt-tabs-files-context/`
**New Directory:** `webview/src/features/sdlc/domains/codebase-context/components/inspector/`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `inspector-panel.tsx` | Inspector UI Card Suite | Displays File header, LOC, Complexity, AI summary, Attributes card, Methods card, and Tag categories. | ✅ Migrated | Component code fully created in `components/inspector/inspector-panel.tsx`. |
| `use-inspector-panel.ts` | Cypher Query Generators | Generates type-level (`handleCopyFileCypherQuery`) and method-level (`handleCopyMethodCypherQuery`) Neo4j Cypher queries. | ✅ Migrated | Hook logic completely implemented. |
| `CodebaseContextFeature.tsx` | Inspector Panel Rendering & Accessibility | Renders Inspector Panel inside the right workspace panel when a node/member is selected. | ⚠️ Orphaned | **CRITICAL GAP:** `CodebaseContextFeature.tsx` mounts `FilesContextPanel` directly in `workspace.right` without a tab container. `InspectorPanel` is never rendered! |

---

## 📦 6. Files Selection & Impact Propagation (`components/files-selection`)

**Old Directory:** `webview/src/features/explorer-old/wkp-rgt-tabs-files-context/`
**New Directory:** `webview/src/features/sdlc/domains/codebase-context/components/files-selection/`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `files-context.tsx` | Impact Propagation Toggles | Upstream and Downstream toggle buttons with BFS impact node counts. | ✅ Migrated | Header controls active. |
| `files-context.tsx` | Transitive Depth Level Grouping | Groups impacted files by BFS depth (Target File, Upstream Depth N, Downstream Depth N) with tri-state group checkboxes. | ✅ Migrated | Grouping and depth styling fully functional. |
| `files-context.tsx` | Context Size Metrics | Displays Selected count, Upstream count, Downstream count, and Token Size KB ratio. | ✅ Migrated | Metrics grid present in panel footer. |
| `files-context.tsx` | Exporter Footer Component Mount (`FilesCtxExportPanel`) | Mounts export configuration panel for file context export. | ❌ Stubbed Out | **CRITICAL GAP:** In `FilesContextPanel.tsx` (line 9), `FilesCtxExportPanel` is defined as `const FilesCtxExportPanel = (props: any) => null;`. The export footer controls are missing! |

---

## 🛡️ 7. Context Transformer & Anonymization Panel

**Old File:** `webview/src/features/explorer-old/wkp-rgt-tabs-files-context/transformer-panel.tsx`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `transformer-panel.tsx` | Anonymization Rules Management | Panel for toggling, adding, and configuring regex rules (Secret Tokens, IPv4, JDBC URIs, DB Usernames). | ❌ Not Migrated | Entire Context Transformer panel and underlying anonymization engine omitted from the domain. |

---

## 📤 8. Codebase Context Exporter (`files-ctx-export-panel`)

**Old Directory:** `webview/src/features/explorer-old/components/files-ctx-export/`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `files-ctx-export-panel.tsx` | Export Configuration Controls | UI controls for Output Format (YAML/JSON/TOML/XML/TXT), Max Chunk KB, Split by Extension, Copy as Files, and "Copy files ctx" trigger. | ❌ Not Migrated | Export panel folder was not created in `codebase-context/components/`. |
| `use-files-ctx-export-panel.ts` | Async Python Script Exporter Bridge | Triggers `codebaseExporterApiService.exportSelectedFiles`, polls execution status PID, and formats clipboard output. | ❌ Not Migrated | Hook omitted in new domain due to stubbing of export panel. |

---

## 📋 9. Summary Matrix of Non-Migrated Behaviors & Action Plan

| Priority | Category | Identified Defect / Non-Migrated Behavior | Affected File(s) | Recommended Remediation Action |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 **CRITICAL** | UI Architecture | **Inspector Panel is Orphaned**: Selected entity inspector cannot be viewed because `workspace.right` renders `FilesContextPanel` directly without tabs. | `CodebaseContextFeature.tsx` | Re-introduce tab container (Inspector / Context) or split `workspace.right` into collapsible sub-panels. |
| 🔴 **CRITICAL** | Feature Loss | **Context Exporter is Stubbed Out**: `FilesCtxExportPanel` is rendered as `null`, disabling "Copy files ctx" export functionality. | `components/files-selection/files-context.tsx` | Re-create `files-ctx-export-panel` component/hook and import real panel into `FilesContextPanel`. |
| 🟠 **HIGH** | State Persistence | **Ephemeral Store State**: User preference changes (depths, layouts, selected files) reset on webview reload. | `store/useCodebaseDomainState.ts` | Restore `hydrateStore` and microtask subscriber syncing with `vsCodeApiService.saveUserPreferences`. |
| 🟡 **MEDIUM** | Privacy / Security | **Context Transformer Omitted**: Regex anonymization rules panel for masking production credentials and secrets is absent. | `components/transformer/` | Port `transformer-panel.tsx` and add Transformer tab to right panel container. |
