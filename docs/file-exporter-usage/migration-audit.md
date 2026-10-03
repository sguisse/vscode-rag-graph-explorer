# 📊 Architectural & Behavioral Migration Audit: Codebase Explorer to Codebase Context Domain

## 🎯 Executive Summary & Audit Scope

This audit report presents a deep-dive, non-concession analysis comparing the legacy codebase exploration implementation in `webview/src/features/explorer-old` against the newly migrated business domain located at `webview/src/features/sdlc/domains/codebase-context`.

The audit evaluates feature parity, UI controls, interactive behaviors, state management persistence, custom layout engines, context transformation/anonymization capabilities, and extension RPC integrations across all primary application screens.

---

## 🧠 1. Store State & Persistence Architecture

**Old File:** `webview/src/features/explorer-old/store/useExplorerStore.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `store/useExplorerStore.ts` | `dataWorkflow` / `setSelectedWorkflowStep` | Workflow step progression and step status updates (`current`, `completed`). | ❌ No | Workflow state management is completely omitted in the new domain, causing step tracking isolation. |
| `store/useExplorerStore.ts` | `upstreamDepth` & `downstreamDepth` | Dynamic depth parameters for transitive BFS dependency graph traversal. | ⚠️ Partial | Hardcoded initial state exists, but dynamic store reactivity and persistence are missing. |
| `store/useExplorerStore.ts` | `graphRendering` | Mode switcher (`uml`, `rounded`, `minized`, `condensed`) for Cytoscape node visual representations. | ❌ No | Node rendering engine in the new domain is locked to a single view shape; rendering selector state omitted. |
| `store/useExplorerStore.ts` | `transformerRules` | Regex anonymization rule set (`DEFAULT_ANONYMIZATION_RULES`) for masking secrets, IP addresses, and DB URIs. | ❌ No | Entire Transformer domain slice removed from store state in the new implementation. |
| `store/useExplorerStore.ts` | `PERSISTED_KEYS` Sync | Whitelisted non-blocking store persistence via microtasks and debounced VS Code settings API sync (`600ms`). | ❌ No | Store state is ephemeral in the new feature; preference synchronization with `VsCodeSettingsKeys` was lost. |

---

## 🌲 2. Codebase Tree Explorer Panel Audit (Left Panel)

**Old Files:** `wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx`, `use-codebase-explorer-panel.ts`, `use-treeview-finder.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `CodebaseExplorerPanel.tsx` | ViewMode Selector (`#select-display-level`) | Multi-dimensional grouping view modes (`scope`, `folder`, `layer`, `typology`, `tags`). | ⚠️ Partial | Only `scope` and `folder` modes are present. `layer`, `typology`, and `tags` grouping calculations are absent. |
| `CodebaseExplorerPanel.tsx` | Treeview Finder (Loupe) | In-tree search bar with Regex, Case Sensitivity, Whole Word matching, match index counter, and jump navigation. | ❌ No | Finder bar (`FinderTree` & `FinderHtml`) replaced with simple string search; regex and match highlight lost. |
| `CodebaseExplorerPanel.tsx` | `Cmd+F` / `Ctrl+F` Listener | Panel-scoped keyboard shortcut listener focusing the Treeview Finder input. | ❌ No | Keydown event listener removed in new domain hook implementation. |
| `CodebaseExplorerPanel.tsx` | Single-click File / Folder | Reveals target path in native VS Code Explorer and copies absolute path to OS clipboard. | ❌ No | Single-click handler in new feature only sets local active state; native VS Code reveal and copy omitted. |
| `CodebaseExplorerPanel.tsx` | Double-click File | Opens file in active VS Code editor tab via `vsCodeApiService.openFile`. | ✅ Yes | Retained double-click behavior to trigger file opening in workspace editor. |
| `RecursiveFolderNode.tsx` | `TriStateCheckbox` | Visual indeterminate checkbox state for partially selected folder contents. | ❌ No | Replaced with standard binary checkboxes, losing visual feedback for partial folder selections. |
| `import-ast-dialog.tsx` | AST Schema Importer | Modal dialog allowing drag-and-drop or copy-paste of `.json` AST payloads with schema validation. | ❌ No | Dialog and toolbar trigger button (`#btn-open-import-ast-dialog`) omitted from left panel header. |
| `use-codebase-explorer-panel.ts` | AST Schema Exporter | Downloads current codebase AST structure directly to `codebase-ast.json`. | ❌ No | Export AST JSON button (`#btn-export-ast-json`) omitted in new panel. |
| `codebase-tree.utils.ts` | `compactFolderTree` | Collapses single-child empty folder chains (e.g., `com/example/service`) into unified tree nodes. | ❌ No | Tree generator no longer compacts redundant folder paths, causing deep vertical indentation clutter. |

---

## 🎯 3. Impacted Paths Analysis Panel Audit (Top Panel)

**Old Files:** `wkp-top-impacted-paths/impacted-paths-panel.tsx`, `ImpactedPathsPanelHeader.tsx`, `use-impacted-paths.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `ImpactedPathsPanelHeader.tsx` | Depth Inputs (`#input-upstream-depth`, `#input-downstream-depth`) | Interactive numeric inputs (0-20) controlling upstream/downstream BFS propagation depth. | ⚠️ Partial | Input elements missing from top panel header; depth hardcoded to static default values. |
| `ImpactedPathsPanelHeader.tsx` | Cypher Parameter Builder (`#btn-build-cypher`) | Generates Neo4j `:param` JSON payload for target paths and depth, copying result to OS clipboard. | ❌ No | Database icon button and parameter generator omitted in new top panel header. |
| `use-impacted-paths.ts` | Inter-window RPC Listeners | Event listeners for `selectedPath` and `addPathToTop` to automatically insert paths from external extension events. | ❌ No | `vsCodeHandleMessage` subscriber omitted in new domain hook; external selection events unhandled. |
| `impacted-paths-panel.tsx` | Real-time Impact Fetching | Debounced call to `getPathsChangeImpacts` on path textarea edits to recompute impacted nodes. | ✅ Yes | Core impact retrieval logic preserved on manual textarea changes. |

---

## 🕸️ 4. Workspace Graph Visualizer Audit (Center Panel)

**Old Files:** `wksp-cnt-graph/GraphPanel.tsx`, `GraphToolbar.tsx`, `GraphPanelHeader.tsx`, `useCytoscapeInstance.ts`, `useGraphTopology.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `GraphToolbar.tsx` | Floating Overlay Toolbar | Overlay panel containing Node Limit, Callers Depth, Callees Depth, and Display Level controls. | ❌ No | Floating `GraphToolbar` overlay completely missing in center workspace canvas. |
| `GraphPanelHeader.tsx` | Shape Rendering Selector (`#select-graph-rendering`) | Switches canvas shape rendering modes (`uml`, `rounded`, `minized`, `condensed`). | ❌ No | Dropdown control and underlying rendering shape components (`CondensedShapes`, `RoundedShapes`, `MinimizedShapes`) omitted. |
| `GraphPanelHeader.tsx` | Layout Engine Selector (`#select-graph-layout`) | Switcher for layout algorithms (`preset`, `cose`, `circle`, `grid`, `concentric`, `breadthfirst`, `dagre`, `hierarchical`). | ⚠️ Partial | Layout selector present, but custom hierarchical topological algorithm is missing. |
| `GraphPanelHeader.tsx` | Neo4j Browser Launcher (`#btn-neo4j-connect`) | Direct link launching external Neo4j Web Browser instance (`vscodeSettings.graphRagExplorer.neo4j.url`). | ❌ No | Header button removed in new domain. |
| `GraphPanelHeader.tsx` | Display Selected Only (`#btn-toggle-show-selected-only`) | Filters graph canvas to display exclusively selected entity and its direct/transitive connections. | ❌ No | Toggle button and canvas filtering state (`effectiveSearchFilteredFiles`) removed. |
| `useCytoscapeInstance.ts` | Canvas Custom Wheel Zooming & Panning | `Cmd/Ctrl + Wheel` zooms centered on mouse cursor; `Wheel` pans canvas without triggering webview container scroll. | ❌ No | Default Cytoscape wheel listener used, causing webview container scroll jumps. |
| `useCytoscapeInstance.ts` | Node Hover Cursor & Tooltip | Changes canvas cursor to pointer and populates global `data-tooltip` on node hover. | ❌ No | Mouseover/mouseout canvas event handlers removed. |
| `useGraphTopology.ts` | `applyCustomHierarchicalLayout` | Custom topological sorting algorithm calculating node levels and dynamic X-gap spacing based on edge label lengths. | ❌ No | Custom layout calculation omitted; relies on standard Cytoscape layout presets which overlap labeled edges. |

---

## 🔍 5. Inspector Panel Audit (Right Tab 1)

**Old Files:** `wkp-rgt-tabs-files-context/inspector-panel.tsx`, `use-inspector-panel.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `inspector-panel.tsx` | Entity Path Display (`<bdi>`) | Right-To-Left (RTL) text direction handling for clean truncation of long file paths. | ✅ Yes | Path rendering structure maintained. |
| `inspector-panel.tsx` | File Cypher Query Copy (`handleCopyFileCypherQuery`) | Database icon button generating and copying Cypher match query for inspected file. | ❌ No | Database copy button removed from file header. |
| `inspector-panel.tsx` | Attribute Visibility Grouping | Attributes categorized by visibility (`public`, `private`, `protected`) with type tooltips and batch copy. | ⚠️ Partial | Attributes displayed in flat list without visibility categorization or batch copy feature. |
| `inspector-panel.tsx` | Method Cypher Copy (`handleCopyMethodCypherQuery`) | Individual database copy icon for each class method/export signature. | ❌ No | Per-method Cypher query generation button omitted. |
| `inspector-panel.tsx` | Categorized Tag Display | Codebase tags grouped into semantic categories (Domain, OOP, Patterns, Traceability). | ❌ No | Tags displayed as un-categorized flat list. |

---

## 📦 6. Files Context & Impact Propagation Audit (Right Tab 2)

**Old Files:** `wkp-rgt-tabs-files-context/files-context.tsx`, `use-files-context.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `files-context.tsx` | Propagation Direction Toggles | Interactive Upstream & Downstream toggle buttons (`GitFork`) with real-time node counts. | ❌ No | Top header toggles removed; direction cannot be toggled independently in right panel. |
| `files-context.tsx` | Impact Plan Depth Grouping | Files grouped into collapsible cards by transitive depth level (Depth 0, Depth 1, Depth 2+). | ⚠️ Partial | Files listed linearly without depth level breakdown or depth-level batch checkboxes. |
| `files-context.tsx` | Context Size Metrics | Detailed token size estimation (KB selected / KB total) and upstream/downstream selected counts. | ⚠️ Partial | Displays total file counts, but upstream/downstream context token size metrics omitted. |

---

## 🛡️ 7. Context Transformer & Anonymization Audit (Right Tab 3)

**Old Files:** `wkp-rgt-tabs-files-context/transformer-panel.tsx`, `ContextTransformerContainer`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `TabsFilesContextContainer.tsx` | Transformer Tab Switcher | Tab button enabling navigation to the Context Transformer view. | ❌ No | Tab option removed from right panel header container. |
| `transformer-panel.tsx` | Anonymization Rules Management | Interactive list allowing users to toggle, add, or edit regex replacement rules (Secrets, IPv4, DB URIs). | ❌ No | Entire Transformer UI panel and underlying store actions omitted in new domain. |

---

## 📤 8. Codebase Context Exporter Audit

**Old Files:** `components/files-ctx-export/files-ctx-export-panel.tsx`, `use-files-ctx-export-panel.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `files-ctx-export-panel.tsx` | Format Selector (`exportFormat`) | Format selection dropdown (YAML, JSON, Markdown, XML). | ✅ Yes | Output format selection migrated. |
| `files-ctx-export-panel.tsx` | Split by Extension Checkbox | Checkbox forcing partition of output export chunks when file extension changes. | ❌ No | Control removed from export footer panel. |
| `files-ctx-export-panel.tsx` | Copy as Files Checkbox | Stores exported context directly in OS clipboard as actual filesystem file attachments. | ❌ No | Fallback to text clipboard copy; file payload clipboard writer (`storeExportedFilesInClipboard`) omitted. |
| `use-files-ctx-export-panel.ts` | Async Script Execution Polling | Asynchronous polling loop querying Python exporter script execution status via PID. | ❌ No | Replaced with simplified synchronous call missing error handling and process tracking. |

---

## 🔌 9. VS Code API & Message Handling Bridge Audit

**Old Files:** `services/api/vs-code-api.service.gen.ts`, `services/listener/vscode-message.handler.ts`

| Screen / File Correspondence | Field / Feature | Identified Behavior / Capability | Migrated | Audit Notes & Technical Gap |
| :--- | :--- | :--- | :---: | :--- |
| `vsCodeApiService` | Explorer Item Reveal (`revealInExplorer`) | Commands VS Code native sidebar to reveal and focus target file or directory path. | ❌ No | Callbacks omitted from single-click handlers in codebase tree and graph canvas. |
| `vsCodeApiService` | Preference Synchronization (`saveUserPreferences` / `readUserPreferences`) | Asynchronous persistence of webview layout settings to VS Code workspace configuration. | ❌ No | Preference persistence bridge unhooked in new domain. |
| `vsCodeHandleMessage` | External Selection RPC Receiver | Receives native editor active tab change events to automatically update graph selection. | ❌ No | Listener missing in new feature root component. |

---

## 📋 10. Summary Matrix of Non-Migrated Behaviors & Action Plan

| Priority | Category | Non-Migrated Behavior / Feature | Target File to Restore |
| :--- | :--- | :--- | :--- |
| 🔴 **CRITICAL** | Graph Visualizer | Custom Hierarchical Layout & Wheel Zoom/Pan Engine | `wksp-cnt-graph/hooks/useGraphTopology.ts` |
| 🔴 **CRITICAL** | State & Persistence | Non-blocking VS Code Settings Persistence Bridge | `store/useExplorerStore.ts` |
| 🟠 **HIGH** | Codebase Tree | In-Tree Regex Finder (Loupe) & Keyboard Shortcut (`Cmd+F`) | `wkp-lft-codebase-tree/hooks/use-treeview-finder.ts` |
| 🟠 **HIGH** | Codebase Tree | View Modes: Layer, Typology, Tags & Compact Folder Tree | `wkp-lft-codebase-tree/utils/codebase-tree.utils.ts` |
| 🟠 **HIGH** | Exporter | OS Clipboard File Attachment Exporter (`storeExportedFilesInClipboard`) | `components/files-ctx-export/hooks/use-files-ctx-export-panel.ts` |
| 🟡 **MEDIUM** | Graph Visualizer | Shape Rendering Modes (`uml`, `rounded`, `minized`, `condensed`) | `wksp-cnt-graph/components/*` |
| 🟡 **MEDIUM** | Right Panels | Context Transformer / Anonymization Rules Panel | `wkp-rgt-tabs-files-context/transformer-panel.tsx` |
| 🟡 **MEDIUM** | Inspector | Neo4j Cypher Query Generators for Files & Methods | `wkp-rgt-tabs-files-context/inspector-panel.tsx` |
| 🟢 **LOW** | Top Panel | AST Schema JSON Import & Export Dialogs | `wkp-lft-codebase-tree/import-ast-dialog.tsx` |
