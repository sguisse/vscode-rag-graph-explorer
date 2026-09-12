[SYSTEM DIRECTIVE: BMAD V6 UNCOMPROMISING MULTI-AGENT ARCHITECTURE AUDIT]

Execute a zero-concession, highly adversarial architecture and codebase audit using bmad-party-mode with --mode subagent.

**1. THE AUDIT PANEL & ROSTER**
Spawn independent subagents for each persona. Maintain distinct context boundaries and do not allow soft consensus:

* **Winston (bmad-agent-architect):** Evaluates systemic architecture, Vertical Slice Feature Packaging, strict Shared Layer IPC boundaries, SOLID/KISS/DRY principles, and over-engineering.
* **Amelia (bmad-agent-dev):** Focuses on React Webview implementation mechanics (strict separation of View, Handlers, State, and Stores), TypeScript type safety, shadcn/ui declarative purity, and manual edits in `.gen.ts` files.
* **Morgan (bmad-agent-sre):** Analyzes Extension Host operational failures, zombie child processes, shell execution vulnerabilities, memory leaks (un-disposed VS Code resources), and Webview crash recovery.

**2. MANDATORY SKILLS & LENSES**
Execute and synthesize findings from:

* **bmad-review:** Adversarial (min 10 issues), Edge-Case (RPC path tracing, state desync, race conditions), and Verification-Gap (assertion quality for IPC logic).
* **decathlon-tech-compliance:** Evaluate Architecture, Development, Security, and UI/UX Integrity against SIG maturity matrices.
* **cybersecurity-threat-modeling:** Execute STRIDE threat modeling on Extension Host file system access, shell execution boundaries, and RPC messaging via `postMessage`.
* **decathlon-tech-radar:** Flag any ON_HOLD, FORBIDDEN, or non-ADOPT dependencies in `package.json` or Webview bundler configs.

**3. TECHNICAL STACK CHECKLIST**

* **Extension Host (Backend):** Flag missing `vscode.Disposable` cleanups leading to memory leaks, zombie bash/shell child processes, blocking synchronous I/O on the main thread, and unhandled `vscode.*` API rejections.
* **Webview (Frontend):** Identify business logic or state mutations directly inside `[Feature].component.tsx`. Detect missing custom hooks (`use[Feature]Handlers.ts`, `use[Feature]State.ts`), monolithic Zustand feature stores, or bypassed Tailwind/shadcn constraints.
* **Shared Layer & RPC:** Detect untyped `postMessage` or `onDidReceiveMessage` calls, RPC contract drift, missing DTOs/schemas in `src/shared`, and unhandled promise rejections across the IPC boundary.
* **Code Generation:** Scan for manual mutations, custom imports, or missing deterministic regeneration markers in any `.gen.ts` or `.gen.tsx` files.

**4. DELIVERABLE FORMAT**
Generate the final report at `_specs/planning-artifacts/tech_debt.md` using the official SIG format:

* **Executive Summary Table:** Blocking P0, High P1, Medium P2, Quick Wins.
* **🔴 Blocking Issues (P0):** Shell Injection risks, un-disposed memory leaks, manual overrides in Gen-Code, and severe Vertical Slice feature leakage.
* **🟠 Architectural Compliance Gaps (P1):** RPC messaging bottlenecks, Webview state desyncs, and missing IPC validation boundaries.
* **🟡 Code-Level & Testing Gaps (P2):** DRY violations in React hooks, missing loading/error UI states, and test verification gaps.
* **Remediation Roadmap Table:** Priority, Finding, Domain, Effort [S/M/L], Owner.

Should we explicitly mandate an audit of the Webview's Content Security Policy (CSP) configurations within the Cybersecurity Threat Modeling section?
