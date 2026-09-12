# 🪒 Token Razor — Surgical Codebase Context & Prompt Engineering for LLMs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-v1.85.0+-blue.svg)](https://marketplace.visualstudio.com)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v19-61dafb.svg)](https://react.dev)

**Token Razor** is an enterprise-grade VS Code extension designed to analyze, filter, and extract token-optimized codebase context from graph-based dependency topologies for Large Language Model (LLM) prompts.

---

## 🚀 Key Features

* 🕸️ **AST Dependency Graph Exploration**: Visualize file, class, and method dependency topologies using interactive Cytoscape.js canvases (`fcose` and `dagre` layout engines).
* 🎯 **Transitive Impact Analysis**: Measure upstream caller and downstream callee impact radii across multi-language codebases (`.java`, `.kt`, `.ts`, `.py`).
* 🧠 **GraphRAG Bottom-Up Summarization**: Leverage a Neo4j graph database and tree-sitter AST parsers to summarize code hierarchical levels from individual methods up to project-level architecture.
* 🧮 **Token Budget & Prompt Engineering Studio**: Estimate LLM prompt token costs, customize instruction strategies (BMAD, SpecKit, GSD, Vibe), and tune context injection.
* 🔒 **Context Anonymization & Transformation**: Protect sensitive codebase terms using regex-based substitution rules with inverse de-anonymization support.
* 📦 **Multi-Format Serialization**: Export filtered file context into XML, YAML, JSON, Markdown, and prompt-ready clipboard payloads.

---

## 🏛️ System Architecture Overview

Token Razor operates on a tri-layer hybrid architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         VS Code Workspace                              │
├───────────────────────────────┬────────────────────────────────────────┤
│     Webview Panel (React 19)  │      Extension Host (Node.js)          │
│  - Cytoscape.js AST Visualizer│  - Service Adapters & Registries       │
│  - Context Selection Store    │  - Secret Storage & Command Handlers   │
│  - Strongly-Typed RPC Client   │  - IPC Message Dispatcher              │
└───────────────┬───────────────┴───────────────────┬────────────────────┘
                │   webview.postMessage (RPC)       │
                └───────────────────────────────────┘
                                  │
                                  ▼
               ┌──────────────────────────────────────┐
               │    Background Engine (Python/Neo4j)   │
               │  - jQAssistant Bytecode Scanner      │
               │  - Tree-sitter Source Code Linker    │
               │  - GraphRAG Bottom-Up Summarizer     │
               └──────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites
* **Node.js**: v18+ and `npm`
* **VS Code**: v1.85.0+
* **Python**: v3.11+ (for GraphRAG background features)

### Installation & Development Setup

```bash
# 1. Clone the repository and install dependencies
git clone https://github.com/your-org/token-razor.git
cd token-razor
npm install

# 2. Compile Extension Host backend (esbuild)
npm run compile

# 3. Start Webview development server (Vite / React 19)
npm run dev:webview

# 4. Verify auto-generated RPC code contracts
npm run verify:generated

# 5. Execute Vitest unit test suite
npm run test
```

---

## 📂 Repository Layout (Effective Relative Paths)

* `🔌 ./src/services/` — Extension Host domain service adapters (`FileExporterAdapter`, `GitServiceAdapter`).
* `🔌 ./src/core/` — Central `ServiceRegistry` and `AbstractServiceAdapter` base classes.
* `🎨 ./webview/src/` — React 19 Webview UI application.
* `🎨 ./webview/src/features/sdlc/` — Vertical slice feature modules (`codebase-context`, `instructions`, `llm-chat`).
* `🎨 ./webview/src/features/` — Domain feature modules (`exporter`, `references`, `transformer`).
* `🔀 ./shared/rpc/` — Bi-directional strongly-typed `RpcProtocol` bridge.
* `🐍 ./src/services/_python-scripts/` — Python execution bridge wrappers.
* `🕸️ ./src/services/graph-rag-explorer/` — GraphRAG and Neo4j Cypher query services.

---

## 📖 Documentation & Guidelines

* 🏛️ **[Architecture Specification](architecture.md)**: System design paradigm, layer contracts, and stack decisions.
* 🤖 **[LLM Agent Instructions](AGENTS.md)**: Invariants, conventions, and pitfalls for AI collaborators.
* 🧑‍💻 **[Contributor Guidelines](contributor.md)**: Coding standards, UI layering rules, and verification procedures.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
