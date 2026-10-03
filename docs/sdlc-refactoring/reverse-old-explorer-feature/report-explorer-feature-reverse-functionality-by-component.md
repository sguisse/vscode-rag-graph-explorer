# 🏗️ Explorer Feature - Reverse Engineering & Functional Specification

This specification provides a technology-agnostic, 100% complete functional and technical reverse-engineering blueprint of the `ExplorerFeature` component suite (`webview/src/features/explorer`). It details all component attributes, state mechanisms, inter-component interactions, visual styles, timing constants, and message contracts required to reproduce this feature in any target technology stack.

---

## 🧭 Executive Summary & Architecture Overview

The `ExplorerFeature` domain serves as a multi-panel workspace within a VS Code webview extension for graph-based codebase exploration, AST analysis, impact propagation analysis, context compilation, prompt engineering, and interactive LLM chat.

```text
+---------------------------------------------------------------------------------------+
| Top Panel: Impacted Paths Input & Depth Controls (Upstream / Downstream Depths)      |
+-------------------+-----------------------------------+-------------------------------+
| Left Panel:       | Center Panel:                     | Right Panel:                  |
| Codebase Tree     | Interactive Dependency Graph      | - Inspector Panel             |
| - Views: Scope,   | - Canvas Rendering Modes:         | - Impact Context Builder      |
|   Folder, Layer,  |   UML, Rounded, Minized, Condensed| - Context Transformer         |
|   Typology, Tags  | - Node Selection & Member Focus   |                               |
| - AST Import/Export| - Overlaid Control Toolbar        |                               |
+-------------------+-----------------------------------+-------------------------------+
| Sidebar Right: Prompt Builder & LLM Studio (Presets, LLM Chat, Model Capabilities Specs) |
+---------------------------------------------------------------------------------------+
| Bottom Panel: Output & AST Compilation Status Logs                                    |
+---------------------------------------------------------------------------------------+
```

---

## 📐 Layout & Spatial Topology

The layout is orchestrated by `ExplorerFeature.tsx`, which registers a multi-container grid into `useLayoutStore`:


| Container Path     | Component Wrapper       | Visibility Default | Resizable | Hideable | Maximize Scope |
| :----------------- | :---------------------- | :----------------- | :-------- | :------- | :------------- |
| `header`           | *(System Header)*       | Visible            | `false`   | `false`  | N/A            |
| `sidebarLeft`      | *(Left Sidebar)*        | Visible            | `true`    | `true`   | N/A            |
| `workspace.top`    | `TopPanelContainer`     | Visible            | `true`    | `true`   | `Workspace`    |
| `workspace.left`   | `LeftPanelContainer`    | Visible            | `true`    | `true`   | `Workspace`    |
| `workspace.center` | `CenterPanelContainer`  | Visible            | `false`   | `true`   | `Main`         |
| `workspace.right`  | `RightPanelContainer`   | Visible            | `true`    | `true`   | `Workspace`    |
| `workspace.bottom` | `BottomPanelContainer`  | Hidden (`false`)   | `true`    | `true`   | `Workspace`    |
| `sidebarRight`     | `SidebarRightContainer` | Visible            | `true`    | `true`   | `Main`         |
| `footer`           | *(System Footer)*       | Visible            | `false`   | `false`  | N/A            |

---

## 📦 Exhaustive Component Breakdown

### 1. Left Panel Domain (`LeftPanelContainer` & `CodebaseExplorerPanel`)

* **Core File**: `CodebaseExplorerPanel.tsx`
* **Hooks**: `useCodebaseExplorerPanel`, `useTreeviewFinder`, `useImportAstDialog`
* **Child Components**: `TriStateCheckbox`, `RecursiveFolderNode`, `ImportAstDialog`, `FinderTree`
* **Attributes & State**:
  * `viewMode` (`ViewMode`): `'scope'` | `'folder'` | `'tags'` | `'layer'` | `'typology'`
  * `isImportOpen` (`boolean`): Dialog visibility state for JSON AST import.
  * `expandedFolders` (`Record<string, boolean>`): Tracks open/closed directory keys.
  * `visibleFiles` (`Record<string, boolean>`): Checkbox states controlling visibility of files in the center graph.
* **Grouping Modes (`viewMode`)**:
  1. **`scope`**: Top-level scope categorization (`frontend`, `backend`, `config`, `other`).
  2. **`folder`**: Recursive directory tree with path compaction (merges single-child empty folders into `parent.child`).
  3. **`layer`**: Grouped by architectural layers (`domain.model`, `application`, `infrastructure`, `domain`, `other`).
  4. **`typology`**: Grouped by component typology (`Front-Component`, `Component`, `Service`, `RestController`, `Controller`, `Repository`, `Config`, `Model / Entity`, `Other`).
  5. **`tags`**: Grouped by assigned file tags (`ALLOWED_TAGS` + dynamic tags). Files belonging to multiple tags are flagged as duplicate (`duplicateFileIds`) and highlighted in `text-orange-500 font-bold`.
* **Toolbar Actions**:
  * **View Mode Selector**: Dropdown to switch codebase grouping view.
  * **Toggle Treeview Finder**: Opens `FinderTree` bar (`Cmd+F` or `Ctrl+F` inside panel).
  * **Collapse All / Expand All**: Resets folder expansion levels.
  * **Import AST Dialog (`Upload`)**: Opens modal supporting drag-and-drop or file selection for `.json` AST schema payloads (`files` and `dependencies` arrays).
  * **Export AST JSON (`Download`)**: Exports active codebase session as `codebase-ast.json`.

---

### 2. Center Panel Domain (`CenterPanelContainer` & `GraphPanel`)

* **Core Files**: `CenterPanelContainer.tsx`, `GraphPanel.tsx`, `GraphToolbar.tsx`, `GraphPanelHeader.tsx`
* **Hooks**: `useGraph`, `useGraphPanel`, `useGraphToolbar`, `useGraphPanelHeader`, `useCodebaseFilter`
* **Node Render Shapes**:
  * `uml`: Detailed UML Class/Config cards displaying properties, methods, visibility indicators, and member focus targets.
  * `rounded`: Circular badge nodes displaying file icons and truncated display names (`RoundClassNode`, `RoundConfigNode`).
  * `minized`: Horizontal bar nodes (`MinimizedClassNode`, `MinimizedConfigNode`).
  * `condensed`: Compact stat cards (`CondensedClassNode`, `CondensedConfigNode`).
* **Header & Overlaid Toolbar Controls**:
  * `graphRendering` selector: Dropdown switching between `uml`, `rounded`, `minized`, `condensed`.
  * `currentLayout` selector: Graph placement engine (`preset`, `dagre`, `cola`, `cose-bilkent`, etc.).
  * `maxNodesLimit` input: Integer node rendering limit (`1` to `100`, default `50`).
  * `callersDepth` input: Integer depth limit for upstream caller paths (`0` to `20`).
  * `calleesDepth` input: Integer depth limit for downstream callee paths (`0` to `20`).
  * `displayLevel` selector: Filter mode (`ALL`, `FILES_ONLY`, `CLASSES_ONLY`, etc.).
  * Action Toggles: Show Selected Only (`Target`), Toggle Attributes Visibility (`ListTree`), Toggle Methods Visibility (`SquareFunction`), Toggle Grid (`Grid`), Zoom In (`Plus`), Zoom Out (`Minus`), Fit View (`Focus`), Connect Neo4j (`Database`).

---

### 3. Top Panel Domain (`TopPanelContainer` & `ImpactedPathsPanel`)

* **Core Files**: `TopPanelContainer.tsx`, `ImpactedPathsPanel.tsx`, `ImpactedPathsPanelHeader.tsx`
* **Hook**: `useImpactedPaths`
* **Attributes & State**:
  * `paths` (`string`): Newline-separated target relative file paths.
  * `upstreamDepth` (`number`): Upstream impact depth (`0` to `20`).
  * `downstreamDepth` (`number`): Downstream impact depth (`0` to `20`).
* **Header Control Actions**:
  * Upstream/Downstream Depth inputs with validation (`Math.max(0, Math.min(20, value))`).
  * **Build Cypher Query (`Database` icon)**: Copies formatted Cypher parameter map (`:param { targetPath: "...", upstreamDepth: "...", downstreamDepth: "..." }`) to system clipboard.
* **Event Handlers**:
  * Listens for `selectedPath` message (replaces current paths).
  * Listens for `addPathToTop` message (appends path to the existing top list).

---

### 4. Right Panel Domain (`RightPanelContainer` & `TabsFilesContextContainer`)

* **Core File**: `TabsFilesContextContainer.tsx`
* **Hook**: `useTabsFilesContext`
* **Sub-Panels**:

#### A. Inspector Panel (`InspectorPanel.tsx` / `useInspectorPanel.ts`)

* Renders active `selectedEntity` properties (`{ type: 'node' | 'member', nodeId, memberId }`).
* Displays: File type icon, language badge, full path (with RTL truncation), LOC volume, complexity level $V(g)$, AI summary box.
* Sections:
  1. **Attributes / Fields**: Grouped by visibility (`public`, `protected`, `package`, `private`).
  2. **Methods / Exports**: List of member signatures. Includes a Cypher copy button per method (`MATCH (t:Type)-[:DECLARES]->(m:Member)...`).
  3. **Codebase Tags**: Categorized into *Domain & Architecture*, *OOP & Structures*, *Patterns & Frameworks*, *Traceability & Analysis*, *Others*.

#### B. Context Panel (`FilesContextPanel.tsx` / `useFilesContext.ts`)

* Calculates transitive impact propagation (BFS) based on `selectedEntity`, `enableUpstream`, and `enableDownstream`.
* Groups files by depth: `target`, `upstream-1..N`, `downstream-1..N`, `other-impacted`.
* Renders tri-state group checkboxes and file selection list.
* Context Metrics Bar: Selected file count, Upstream file count, Downstream file count, Token size in KB.
* Integrated `FilesCtxExportPanel`:
  * Output format selector (`xml`, `markdown`, `json`, `plaintext`).
  * Max chunk input (KB).
  * Split by extension checkbox.
  * Copy as files to clipboard checkbox.
  * `Copy files ctx` button (executes python background script via API service).

#### C. Context Transformer Panel (`ContextTransformerPanel.tsx` / `useTransformerPanel.ts`)

* Anonymizes source context before LLM transmission and de-anonymizes LLM responses back to original names.
* **Anonymization Regex Rules Table**:
  * Rules attributes: `id`, `name`, `pattern` (regex), `replacement`, `inversePattern`, `enabled`.
  * Allows creating, toggling, editing, and deleting rules.
* **Action 1 (Transform & Anonymize)**: Runs active regex rules against unified codebase context, generates `anonymizedResult`, and stores substitution mappings (`substitutionMap`).
* **Action 2 (De-anonymize Output)**: Takes raw LLM response text, applies `substitutionMap` and inverse regex patterns, and outputs `deanonymizedResult`.

---

### 5. Sidebar Right Domain (`SidebarRightContainer` & `TabsPromptContainer`)

* **Core File**: `TabsPromptContainer.tsx`
* **Hook**: `useTabsPrompt`
* **Sub-Panels**:

#### A. Prompt Builder (`PromptPanel.tsx` / `usePrompt.ts`)

* **Predefined Presets**: Dropdown loading presets from `predefined-prompts.yaml`.
* **Mode Selector**: Radio toggle for `Role` vs `Agent`.
* **Agent Selector**: Dropdown selection from `AGENTS_LIST` (`CodeRefactoringAgent`, `SecurityAuditAgent`, `ASTGraphAgent`, `TestGeneratorAgent`, `DocumentationAgent`). "Add Agent to Field" prepends agent name to role.
* **Structured Input Textareas**: Tone, Task Context, Expected Deliverables, Output Constraints, Reference Samples.
* **Template Generator**: Combines field values with selected template from `template-prompts.yaml` replacing placeholders (`{{ ROLE_AGENT }}`, `{{ TONE }}`, `{{ GLOBAL_CONTEXT_SCOPE }}`, `{{ TASK_CONTEXT_SCOPE }}`, `{{ EXPECTED_DELIVERABLES }}`, `{{ OUTPUT_FORMAT_CONSTRAINTS }}`, `{{ REFERENCE_SAMPLES }}`) and copies result to system clipboard.

#### B. Local LLM Studio (`LLMChat.tsx` / `useLlmChat.ts`)

* **Top Toolbar**: Expand All / Collapse All message cards, Scroll to Top / Scroll to Bottom.
* **Message History**:
  * `UserMessageBlock`: Displays user prompt card with optional nested attached file context card.
  * `AssistantMessageBlock`: Displays assistant response card with token counts (`In`/`Out`) and execution time (`MMm:SSs`).
* **Footer Controls**:
  * Provider selector (`ollama`, `gemini`, `copilot`).
  * Model selector (dynamically populated based on active provider).
  * Temperature slider (`0.0` to `1.0`).
  * Model Specs Popup Button (`Info` icon): Opens floating `LLMModelsInfoModal`.
  * File Context Attachment: Path input + "Add Context" button reads file content via API. Renders removable file tag pills.
  * Prompt Textarea + "Send" button.

#### C. LLM Model Specs Modal (`LLMModelsInfoModal.tsx` / `LLMModelsInfo.tsx` / `useLlmModelsInfo.ts`)

* Floating popup window with drag handle, maximize button, minimize-to-dock button, resize handle.
* Table displaying model specs: Provider, Model Name, Cost Rating (star rating 1-5), Category badge, Max Context Window, Max Prompt Tokens, Max Output Tokens, Adaptive Thinking status, Reasoning Effort badges, Parallel Tool Calls (`//` badge), Vision support, Tokenizer type, Streaming support, Structured Outputs support, Token Pricing break-down.
* Support for multi-column sorting (`Shift + Click`) and global text filtering.

#### D. Configuration Panel (`ConfigurationPanel.tsx` / `useConfiguration.ts`)

* Global explorer settings: Backend JSON config path, default provider, default model, max tokens, temperature, system prompt prefix, save history locally switch.
* Includes real-time JSON mock payload preview and save action button.

---

### 6. Bottom Panel Domain (`BottomPanelContainer` & `WkpBottomPanel`)

* **Core File**: `WkpBottomPanel.tsx`
* **Hook**: `useWkpBottomPanel`
* Displays execution status text ("AST Compilation Log: Matrix Active").

---

## ⚡ Component Inter-relationships, Events & State Synchronization

```text
+-----------------------+
|   useExplorerStore    |
+-----------+-----------+
|
+----------------------+---------------+-----------------------+
|                      |               |                       |
v                      v               v                       v
[Left Panel Tree]      [Center Graph]  [Top Impact Panel]     [Right Panel Context]
| Single Click         | Click Node    | Path Textarea Change  | Checkbox Toggles
+--> revealInExplorer  +--> selectNode +--> fetchImpacts       +--> update targetFilePaths
+--> copyToClipboard   +--> highlight  +--> setCodebaseData    +--> exportSelectedFiles
+--> setFocusedNodeId  | Double Click  |                       |
| Double Click         +--> openFile   | Event Message         |
+--> openFile          | Cmd+Click     | 'addPathToTop'        |
+-------------->+---------------------->+
```

### Synchronized Event Flows

1. **Tree Node Single-Click**:
   * Calls `vsCodeApiService.revealInExplorer(file.path)` and `vsCodeApiService.copyToClipboard(file.path)`.
   * Invokes `onFocusNode(file.id)` -> updates `focusedNodeId` in `useExplorerStore`. Sets a **2000ms timer** to reset `focusedNodeId` back to `null`.
2. **Tree Node Double-Click**:
   * Calls `vsCodeApiService.revealInExplorer(file.path)` and `vsCodeApiService.openFile(file.path)`.
3. **Tree Folder Single-Click**:
   * Toggles folder key in `expandedFolders`. Reveals directory in VS Code Explorer and copies directory path to system clipboard.
4. **Graph Node Single-Click**:
   * Updates `selectedEntity` state to `{ type: 'node', nodeId }`.
   * Triggers Transitive Impact Calculation (BFS algorithm) -> updates `impactedSet`.
   * Synchronizes Inspector and Context tabs in the Right Panel.
5. **Graph Member Single-Click**:
   * Updates `selectedEntity` to `{ type: 'member', nodeId, memberId }`.
6. **Graph Node Cmd/Ctrl + Click**:
   * Emits `addPathToTop` event via message handler.
   * Top Panel receives event, appends path to `paths` string, and triggers impact calculation.
7. **Top Panel Path Change**:
   * Debounces path input, executes `getPathsChangeImpacts(paths, upstreamDepth, downstreamDepth)`, and updates global `codebase` state.

---

## 🔍 Exhaustive Behavioral Rules & User Interactions

* **Keyboard Shortcuts**:
  * `Cmd+F` or `Ctrl+F` focused inside Left Panel -> Opens Treeview Finder bar and focuses input.
  * `Enter` / `Shift+Enter` inside Treeview Finder -> Navigates to Next / Previous search match.
  * `Escape` inside Treeview Finder -> Closes finder bar.
  * `Enter` (without `Shift`) in LLM Chat input -> Submits message.
* **Auto-Reset Focus Highlight**: Focusing a node sets `focusedNodeId` which applies a pulsing ring (`ring-4 ring-amber-400 animate-pulse`). Resets to `null` automatically after `2000ms`.
* **Path Compaction**: In `folder` view mode, empty single-child directories are collapsed into a single node (e.g. `com/example/domain`).
* **Depth Input Limits**: Upstream and Downstream depth controls strictly enforce bounds between `0` and `20`.

---

## 🎨 Visual States, Color Palettes & Timing Constants

### 1. Timing Constants

* **Focused Node Auto-Reset**: `2000ms`
* **Finder Element Scroll Delay**: `120ms`
* **Python Export Status Polling Interval**: `1000ms`

### 2. Folder Theme Registry (`FOLDER_THEME_REGISTRY_CONFIG`)

* **`frontend`**: Fill: `fill-yellow-500/20`, Text: `text-yellow-500`, Icon: `text-emerald-500`
* **`backend`**: Fill: `fill-indigo-500/20`, Text: `text-indigo-500`, Icon: `text-blue-500`
* **`config`**: Fill: `fill-amber-500/20`, Text: `text-amber-500`, Icon: `text-amber-500`
* **`other`**: Fill: `fill-slate-500/20`, Text: `text-slate-500`, Icon: `text-slate-500`

### 3. Dynamic Recursive Folder Node Palette (`DYNAMIC_COLORS`)

1. `blue`: Fill `fill-blue-500/20`, Text `text-blue-500`
2. `emerald`: Fill `fill-emerald-500/20`, Text `text-emerald-500`
3. `amber`: Fill `fill-amber-500/20`, Text `text-amber-500`
4. `purple`: Fill `fill-purple-500/20`, Text `text-purple-500`
5. `pink`: Fill `fill-pink-500/20`, Text `text-pink-500`
6. `indigo`: Fill `fill-indigo-500/20`, Text `text-indigo-500`
7. `rose`: Fill `fill-rose-500/20`, Text `text-rose-500`
8. `cyan`: Fill `fill-cyan-500/20`, Text `text-cyan-500`

### 4. LLM Chat Color Themes

* **User Message Card**:
  * Light Mode: `color-mix(in srgb, var(--blue-1, #bcecff) 18%, var(--card))`
  * Dark Mode: `color-mix(in srgb, var(--blue-7, #082a8f) 25%, var(--card))`
* **Assistant Message Card**:
  * Light Mode: `color-mix(in srgb, var(--yellow-0, #fff8c5) 35%, var(--card))`
  * Dark Mode: `color-mix(in srgb, var(--yellow-7, #653200) 25%, var(--card))`

---

## 🔌 Host Integration & Messaging Contract (VS Code)

When reproducing in another stack, implement the following platform message bridge:


| Message / Method Command | Target Direction  | Payload Schema        | Action                                                          |
| :----------------------- | :---------------- | :-------------------- | :-------------------------------------------------------------- |
| `revealInExplorer`       | Webview -> Host   | `path: string`        | Highlights target file/folder in host file tree.                |
| `openFile`               | Webview -> Host   | `path: string`        | Opens target file in host editor.                               |
| `copyToClipboard`        | Webview -> Host   | `text: string`        | Writes text payload to system OS clipboard.                     |
| `selectedPath`           | Host -> Webview   | `{ payload: string }` | Notifies webview when a path is selected in host environment.   |
| `addPathToTop`           | Webview Event Bus | `{ payload: string }` | Internal bus event appending target path to Top Panel textarea. |

---

## 🚀 Technology-Agnostic Re-implementation Blueprint

To recreate `ExplorerFeature` 100% faithfully in Flutter, Vue, Angular, Svelte, React Native, or Native Web Components:

1. **Global State Store**: Maintain global reactive stores for `codebase` (files, dependencies), `selectedEntity`, `focusedNodeId`, `expandedFolders`, `visibleFiles`, `promptFields`, `llmMessages`, and `layoutContainers`.
2. **Layout Engine**: Use a grid/docking layout component capable of handling collapsible, resizable, and maximizable panels.
3. **Graph Renderer**: Integrate a 2D graph engine (e.g. Cytoscape.js, D3, or GoJS) supporting custom shape templates (`uml`, `rounded`, `minized`, `condensed`) and pan/zoom transforms.
4. **Impact Analysis Engine**: Implement a Breadth-First Search (BFS) graph traversal function to compute transitive caller/callee sets up to depth $N \le 20$.
5. **Treeview & Finder**: Build a virtualized or recursive tree component supporting tri-state parent checkboxes, path compaction, regex search highlighting, and node focus scrolling.
6. **Host Integration Adapter**: Implement an abstract API service layer mapping `revealInExplorer`, `openFile`, and `copyToClipboard` to native host APIs.
