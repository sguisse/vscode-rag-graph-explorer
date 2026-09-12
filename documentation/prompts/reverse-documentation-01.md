[SYSTEM DIRECTIVE: BMAD V6 REVERSE-ENGINEERING & DOCUMENTATION EXTRACTION]

Act as Winston (BMAD System Architect) and Arthur (BMAD Technical Archivist). Your mission is to execute a deep, zero-concession reverse-engineering of this VS Code Extension codebase and extract a complete, enterprise-grade suite of documentation.

Target Stack: TypeScript, VS Code API (Extension Host), Modern React (Webview), shadcn/ui, Tailwind CSS, Zustand, and strongly-typed RPC.

Enforce these documentation standards without compromise:
* **Emoji Hierarchy:** Every H1 (`#`) and H2 (`##`) must begin with a highly relevant emoji.
* **Mermaid Integration:** The architecture documentation must include detailed Mermaid flowcharts mapping the Vertical Slices and IPC RPC messaging boundaries.
* **Structural Purity:** Extract exact feature names, state hooks, and RPC contracts. Do not invent features; rely purely on codebase discovery.

### EXTRACTION EXECUTION PHASES

Phase 1: Deep Codebase & Tech Stack Discovery
* Read the project structure, `package.json`, and tsconfig files.
* Map the physical separation of `src/backend`, `src/webview`, and `src/shared`.
* Identify all RPC contracts, feature stores, and Extension Host commands.

Phase 2: Multi-Lens Reverse Engineering
Execute `bmad-review` with the `edge-case-hunter` lens to trace data flows across 3 critical boundaries:
1. **Vertical Slice Extraction:** Map every domain feature, identifying its pure UI components, handler hooks, and Zustand stores.
2. **IPC RPC Tracing:** Document the exact schemas, DTOs, and message-passing routes between the Extension Host and Webview.
3. **Extension Host Mechanics:** Extract registered VS Code commands, custom webview panel configurations, and shell/file-system execution points.

### DELIVERABLE FORMAT

Output a complete suite of standard enterprise application documentation. Generate the following files in Markdown format (use code blocks separated by file names):

**1. 📖 README.md**
* H1: Project Name & Catchphrase
* H2: 🚀 Features (Bullet points of extracted capabilities)
* H2: 🛠️ Tech Stack (Frontend, Backend, Shared)
* H2: ⚡ Quick Start (Installation & run commands based on `package.json`)

**2. 🏛️ architecture.md**
* H1: System Architecture
* H2: 🗺️ High-Level Design (Include a Mermaid `flowchart TD` mapping the Extension Host, Shared IPC Layer, and React Webview)
* H2: 🧩 Vertical Slice Modules (Breakdown of domain-specific feature packaging)
* H2: 🔄 Data Flow & State Management (How Zustand and RPC interact)

**3. 🔌 api-reference.md**
* H1: RPC & IPC Contracts
* H2: 📤 Webview-to-Host Messages (Extracted DTOs and methods)
* H2: 📥 Host-to-Webview Events (Extracted subscriptions and triggers)

**4. 🧑‍💻 contributor.md**
* H1: Contribution Guidelines
* H2: 🏗️ Project Structure (Tree representation of `src/`)
* H2: 📜 Code Generation (Rules around `.gen.ts` and `.gen.tsx` files)
* H2: ✅ Testing & Linting (Commands required before PR submission)

**5. 🎮 user-guide.md**
* H1: Extension User Guide
* H2: ⌨️ Command Palette Actions (List of `vscode.commands.registerCommand` discoveries)
* H2: 🖥️ Webview Interface (How to interact with the React UI)
* H2: ⚙️ Settings & Configuration (Extracted `contributes.configuration` from `package.json`)

Begin the reverse-engineering now. Read the codebase files, run the required BMAD skills, and output the markdown files exactly as specified.
