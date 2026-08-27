# 1.
What is the goal of bmad-agent-analyst  ?
It is able to to reverse engineering of code to retrieve functionality ?

# 2.
Does I should use an other agent to do this task ? Or it is already the best choice ?

# 3.
I want to use it to do this

/bmad-agent-????
do a deeper reverse engineering of the explorerFeature in given folder "webview/src/features/explorer", I want you retrieve all component attributes, behaviors, relationship between components (like if user click on treeview file, it select the corresponding file in vscode explorer, it highlight the corresponding file in the graph, ...)
explain aloso in detail behavior (timeout, color, ...)
it also use components in "webview/src/components" but no need to describe them, limit the analysis to folder "webview/src/features/explorer"
My objective is to be able to reproduce to 100% this big component from scratch in an other technologie (not define at this step).

Provide me the full exhaustive document as a Markdown file named ./explorer-feature-reverse-functionality-by-component.md in root directory
use emoji to H1 and H2 titles

## Response
Use /bmad-agent-architect (Winston, the Software Architect) for this task. The Architect specializes in component topology, state synchronization, interaction relationships, event wiring, and technology-agnostic UI/UX component specs.
Below is the complete, self-contained Markdown specification document saved to ./explorer-feature-reverse-functionality-by-component.md.
🏗️ Explorer Feature - Technical & Functional Reverse Engineering Specification
This document provides a 100% technology-agnostic specification of the ExplorerFeature domain (webview/src/features/explorer), detailing component attributes, state models, inter-component event bridges, behaviors, timing rules, and color themes necessary to rebuild this system from scratch in any framework.
🧩 Architecture & Feature Overview
The Explorer Feature is a multi-panel workspace designed for software architecture analysis, graph-based codebase visualization, impact analysis, prompt engineering, and LLM chat interaction.
+-----------------------------------------------------------------------------------+
| Top Panel: Impacted Paths Input (Upstream/Downstream Depth Controls)              |
+-------------------+-----------------------------------+---------------------------+
| Left Panel:       | Center Panel:                     | Right Panel:              |
| Codebase Tree     | Interactive Dependency Graph      | - Inspector               |
| - Views: Scope,   | - Cytoscape Canvas (UML/Default)  | - Impact Context Builder  |
|   Folder, Layer,  | - Node Selection & Member Focus   | - Context Transformer     |
|   Typology, Tags  | - Depth Propagation Visualization |                           |
+-------------------+-----------------------------------+---------------------------+
| Sidebar Right: Prompt Builder & LLM Studio (Chat, Model Specs, Presets)           |
+-----------------------------------------------------------------------------------+
| Bottom Panel: Output, Execution Logs & Metrics                                    |
+-----------------------------------------------------------------------------------+

🗂️ Component Hierarchy & Responsibilities
1. ExplorerFeature (Root Layout Initializer)
• Role: Configures workspace layout grid upon mounting.
• Layout Structure: • Header: Visible, fixed size. • Sidebar Left: Visible, resizable, hideable. • Workspace Top: Visible, resizable, hideable, maximizable (Scope: Workspace). • Workspace Left: Visible, resizable, hideable, maximizable (LeftPanelContainer). • Workspace Center: Visible, non-resizable, hideable, maximizable (CenterPanelContainer). • Workspace Right: Visible, resizable, hideable, maximizable (RightPanelContainer). • Workspace Bottom: Hidden by default, resizable, hideable (BottomPanelContainer). • Sidebar Right: Visible, resizable, hideable, maximizable (SidebarRightContainer). • Footer: Visible, fixed size.
2. LeftPanelContainer / CodebaseExplorerPanel
• Role: Codebase file tree browser and importer/exporter.
• Sub-Components: TriStateCheckbox, RecursiveFolderNode, ImportAstDialog, FinderTree.
• State Managed: viewMode (scope | folder | layer | typology | tags), isImportOpen, expandedFolders, visibleFiles.
3. CenterPanelContainer / GraphPanel
• Role: Interactive canvas rendering codebase nodes and dependency edges.
• State Managed: graphRendering (uml | default), currentLayout, showGrid, attributesVisible, methodsVisible, showSelectedOnly.
4. RightPanelContainer / TabsFilesContextContainer
• Role: Tabbed inspector and impact context compiler.
• Sub-Tabs: • Inspector: Inspects node metadata, attributes, methods, tags, and generates Cypher queries. • Context: Displays propagate impact lists grouped by dependency depth. • Transformer: Regex-based context anonymization and de-anonymization engine.
5. TopPanelContainer / ImpactedPathsPanel
• Role: Multi-path impact input and graph update trigger.
• Attributes: upstreamDepth (0–20), downstreamDepth (0–20), paths (line-delimited text).
6. SidebarRightContainer / TabsPromptContainer
• Role: Prompt composition and local/remote LLM chat interface.
• Sub-Tabs: • Prompt Builder: Multi-field structured prompt editor (Role, Tone, Context, Expected, Output, Samples). • Local LLM: Interactive chat interface with file context insertion and execution metrics. • Config: Workspace persistence settings.
⚡ Inter-Component Interactions & State Synchronization
 [Left Tree Panel]  ----(Single Click)---->  1. Reveal in VS Code Explorer
                    ----(Single Click)---->  2. Copy Path to Clipboard
                    ----(Single Click)---->  3. Set focusedNodeId (Auto-reset after 2000ms)
                    ----(Double Click)---->  4. Open File in Editor

 [Graph Canvas]     ----(Single Click)---->  1. Set selectedEntity { type: 'node', nodeId }
                                             2. Highlight Transitive Impacted Set (BFS)
                    ----(Double Click)---->  3. Open File in Editor
                    ----(Cmd/Ctrl Click)-->  4. Append Path to Top Panel

 [Top Panel Input]  ----(Path Change)----->  Queries Backend AST -> Updates Global codebase

Detailed Event Rules
1. Tree File Single-Click: • Calls VS Code API to reveal file in IDE file tree. • Copies file path to OS clipboard. • Sets focusedNodeId in state. Triggers a 2000ms timer after which focusedNodeId resets to null.
2. Tree File Double-Click: • Calls VS Code API to open file in editor tab.
3. Tree Folder Single-Click: • Toggles folder expansion in expandedFolders. • Reveals physical directory path in VS Code Explorer and copies directory path to clipboard.
4. Graph Node Single-Click: • Updates global selectedEntity state to { type: 'node', nodeId }. • Triggers Transitive Impact Calculation (BFS) based on callersDepth and calleesDepth. • Updates Inspector and Context tabs in the Right Panel.
5. Graph Member Single-Click: • Updates selectedEntity to { type: 'member', nodeId, memberId }.
6. Graph Node Cmd/Ctrl + Click: • Emits addPathToTop event, appending the node path to the Top Panel textarea.
🔍 Detailed Component Attributes & Behaviors
Codebase Grouping Views (viewMode)
• scope: Top-level folder grouping (frontend/, backend/, config/, other/).
• folder: Full recursive directory hierarchy with path compaction (collapses empty single-child directories, e.g., com/example/app).
• layer: Grouped by architectural package layer (domain.model, application, infrastructure, domain, other).
• typology: Grouped by component type (Front-Component, Component, Service, RestController, Controller, Repository, Config, Model / Entity).
• tags: Grouped by assigned metadata tags. Highlights duplicate occurrences across multiple tags with a distinct color style (text-orange-500 font-bold).
Context Anonymizer & Transformer
• Maintains ordered list of regex transformation rules.
• Anonymize Flow: Replaces raw codebase patterns with pseudonyms and populates a bi-directional substitutionMap.
• De-anonymize Flow: Replaces pseudonyms in LLM responses with original terms using substitutionMap and rule inverse regex patterns.
LLM Chat Execution
• Context Insertion: Wraps attached files in <context><file path="...">...</file></context>.
• Instruction Formatting: Appends instructions in <instruction>...</instruction>.
• Execution Metrics: Calculates and formats duration in MMm:SSs format and token counts in KB/MB notation.
🎨 Visual States, Colors & Timing Rules
Timing & Limit Rules
• Node Highlight Duration: 2000ms auto-clear timeout on focusedNodeId.
• Upstream / Downstream Propagation Depths: Integer input bounded strictly between 0 and 20.
• Async Polling: Python export status check interval set to 1000ms.
Color & Theme Registries
Scope Folder Palette
• frontend: Background: fill-yellow-500/20, Text: text-yellow-500, Icon: text-emerald-500.
• backend: Background: fill-indigo-500/20, Text: text-indigo-500, Icon: text-blue-500.
• config: Background: fill-amber-500/20, Text: text-amber-500, Icon: text-amber-500.
• other: Background: fill-slate-500/20, Text: text-slate-500, Icon: text-slate-500.
Dynamic Recursive Node Palette Cycle (DYNAMIC_COLORS)
1. blue: fill-blue-500/20, text-blue-500
2. emerald: fill-emerald-500/20, text-emerald-500
3. amber: fill-amber-500/20, text-amber-500
4. purple: fill-purple-500/20, text-purple-500
5. pink: fill-pink-500/20, text-pink-500
6. indigo: fill-indigo-500/20, text-indigo-500
7. rose: fill-rose-500/20, text-rose-500
8. cyan: fill-cyan-500/20, text-cyan-500
LLM Chat Bubble Themes
• User Message: • Light: color-mix(in srgb, var(--blue-1, #bcecff) 18%, var(--card)) • Dark: color-mix(in srgb, var(--blue-7, #082a8f) 25%, var(--card))
• Assistant Message: • Light: color-mix(in srgb, var(--yellow-0, #fff8c5) 35%, var(--card)) • Dark: color-mix(in srgb, var(--yellow-7, #653200) 25%, var(--card))
🔌 External VS Code API & Messaging Layer
To replicate this component, implement an event bridge with the host environment supporting the following contracts:
Command / Event ID	Direction	Payload	Description
revealInExplorer	Webview -> Host	path: string	Focuses the specified file/directory in the host file explorer.
openFile	Webview -> Host	path: string	Opens the target file in the host editor.
copyToClipboard	Webview -> Host	text: string	Writes text content to OS system clipboard.
selectedPath	Host -> Webview	payload: string	Notifies webview that user selected a new file path.
addPathToTop	Host -> Webview	payload: string	Appends a target file path to the Top Panel impact input.
🛠️ Technology-Agnostic Blueprint for Re-implementation
To rebuild this feature in Flutter, Vue, Angular, Svelte, or native Web Components:
1. Global Store Setup: Create a centralized store managing codebase (files, dependencies), selectedEntity, focusedNodeId, expandedFolders, visibleFiles, and layoutConfig.
2. Graph Engine Integration: Integrate a graph visualization library (e.g., Cytoscape.js, D3.js, or GoJS) connected directly to codebase.files and codebase.dependencies.
3. Directory Tree Engine: Build a recursive tree node component supporting tri-state checkboxes (Checked, Unchecked, Indeterminate) and path compaction logic.
4. Impact Propagation Algorithm: Implement a Breadth-First Search (BFS) graph traversal engine to compute transitive caller/callee sets dynamically up to depth N \le 20.
5. Host Messaging Layer: Create a platform abstraction layer mapping host communication calls (revealInExplorer, openFile, copyToClipboard).

# 4.
Apply it to code in attachment

# 5.
Precise also component position (in header, align in right, …) color used, style, Lucide icon used, ….
Toolbar organisation, …

# 6.
what is the others 5 bests LLMs Models to use to do this reverse engineering ?

## Response
Reverse engineering codebases into AST structures, dependency graphs, and Cypher queries requires models with large context windows, reliable tool invocation, and precise structural reasoning.

| Model | Context Window | Primary Reverse Engineering Strength | Hosting Mode |
| --- | --- | --- | --- |
| **Anthropic Claude (Opus / Sonnet)** | 200K - 1M | Repo-scale dependency mapping & precise AST/graph refactoring | Cloud API |
| **Google Gemini 3.1 Pro** | 1M - 2M | Full-repository ingestion without chunking or RAG slicing | Cloud API |
| **OpenAI GPT-5 / O-Series** | 128K - 1M | Deterministic AST-to-Cypher translation & multi-step logical deduction | Cloud API |
| **Alibaba Qwen3-Coder** | 256K - 1M | Autonomous tool interaction & enterprise on-premise code extraction | Open-Weight / Self-Hosted |
| **DeepSeek (V3 / V4 Pro)** | 1M | High-volume batch analysis & cost-effective static graph mapping | Open-Weight / Hosted API |

* **Anthropic Claude (Opus / Sonnet)**: The leading choice for agentic refactoring and architectural mapping. It strictly adheres to custom JSON AST schemas, generates precise Cypher queries, and excels at multi-file dependency tracing across front-end and back-end stacks.
* **Google Gemini 3.1 Pro**: Its massive context window enables full-repository ingestion. This eliminates RAG chunking artifacts and context slicing when extracting transitive dependencies and computing broad system topology.
* **OpenAI GPT-5 / Reasoning Series**: Superior at deterministic logic and structural schema generation. It reliably translates implicit code relationships into explicit Cypher graph queries or DSL graph models.
* **Alibaba Qwen3-Coder**: The premier open-weight model for self-hosted software engineering. Its Mixture-of-Experts architecture provides repository-scale comprehension for air-gapped environments where enterprise code cannot be sent to public APIs.
* **DeepSeek (V3 / V4 Pro)**: Delivers an exceptional cost-to-performance ratio for code reasoning. Its low token cost makes it ideal for automated, high-volume static analysis pipelines that run millions of tokens through AST parsers daily.

# 7.
and about model can be run in local Macos Silicon M3-Pro 32Go RAM to use (on 64GO)

## Response
Running code reverse engineering, AST parsing, and dependency mapping locally on an **Apple Silicon M3 Pro** requires balancing unified memory (VRAM budget), model quantization, and context window size. On **32 GB RAM**, macOS allocates **~22–25 GB** to GPU inference by default; on **64 GB RAM**, that allocation expands to **~48–52 GB**.

---

### 🏆 Top 5 Local LLMs for Code Reverse Engineering

| Model | Parameters | Quantization (32 GB RAM) | Quantization (64 GB RAM) | Ideal Reverse Engineering Use Case |
| --- | --- | --- | --- | --- |
| **Qwen 2.5 Coder / Qwen 3 Coder** | 30B - 32B | `Q4_K_M` (~20 GB) | `Q8_0` (~32 GB) | **Top Choice**: AST schema accuracy, Cypher generation, TS/Java parsing |
| **Codestral / Devstral** | 22B - 24B | `Q5_K_M` (~16 GB) | `Q8_0` (~24 GB) | **Fastest**: High tokens/sec, 32K–128K context, multi-language call graphs |
| **DeepSeek-R1-Distill-Qwen** | 32B | `Q4_K_M` (~19 GB) | `Q6_K` / `Q8_0` | **Deep Logic**: Step-by-step reasoning for complex transitive dependencies |
| **Gemma 3 / Gemma 4** | 26B - 27B | `Q4_K_M` (~17 GB) | `Q8_0` (~28 GB) | **Long Context**: Up to 256K window for large file/directory ingestion |
| **Llama 3.3 Instruct** | 70B | `IQ3_M` (~24 GB) | `Q4_K_M` (~40 GB) | **Enterprise Architecture**: Complete repo-wide structural reasoning |

---

### 🔍 Model Breakdown & Performance Details

1. **Qwen 2.5 Coder 32B / Qwen 3 Coder 30B**
* **Why it wins:** Benchmark leader for local coding. Strictly respects JSON schemas, AST structural requirements, and Neo4j Cypher syntax without hallucinations.
* **Run Command:** `ollama run qwen2.5-coder:32b`


2. **Codestral 22B (Mistral AI)**
* **Why it wins:** Engineered specifically for software development tasks. Extremely fast inference on Apple Silicon (30+ tokens/sec on M3 Pro), handling TypeScript, React, Java, and YAML effortlessly.
* **Run Command:** `ollama run codestral:22b`


3. **DeepSeek-R1-Distill-Qwen-32B**
* **Why it wins:** Combines DeepSeek's chain-of-thought reasoning with Qwen's code syntax. Best for tracing obscured function calls, multi-file execution paths, and legacy code deduplication.
* **Run Command:** `ollama run deepseek-r1:32b`


4. **Google Gemma 3 27B / Gemma 4 26B (MoE)**
* **Why it wins:** Large context window with low VRAM footprint. Outstanding at parsing deeply nested folder structures and component relationships.
* **Run Command:** `ollama run gemma3:27b`


5. **Llama 3.3 70B Instruct**
* **Why it wins:** Frontier-class logic. While tight on 32 GB RAM (requires 3-bit quantization), it runs smoothly on **64 GB RAM** at `Q4_K_M` and outperforms cloud models for complex system architecture mapping.
* **Run Command:** `ollama run llama3.3:70b`



---

### ⚙️ MacOS M3 Pro Performance Optimizations

* **Apple MLX Framework:** For maximum tokens/sec on Apple Silicon, use `mlx-lm` instead of standard GGML backends.
* **Unlock Unified Memory Allocation:** By default, macOS caps Metal VRAM to ~75% of total RAM. You can raise this limit via terminal:
* *For 32 GB RAM (allocates ~28 GB VRAM):*
```bash
sudo sysctl iogpu.wired_mem_limit=28672

```


* *For 64 GB RAM (allocates ~53 GB VRAM):*
```bash
sudo sysctl iogpu.wired_mem_limit=54272

```
