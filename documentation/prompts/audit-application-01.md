Swapping Java microservices for a modern VS Code Extension demands a pivot from distributed network failures to IPC messaging bottlenecks, Webview state sync, and strict Extension Host resource management.

**🎯 Adapted BMAD V6 Multi-Agent Audit Prompt**
Copy-paste the prompt below into your BMAD-enabled Copilot CLI or agent interface using `bmad-party-mode` with `--mode subagent` to run a highly adversarial architectural roundtable.

**The Room & Roster**

* **Winston (bmad-agent-architect):** Hunts for violations of SOLID, KISS, and DRY, focusing on Vertical Slice feature packaging and leakage between domain folders.


* **Amelia (bmad-agent-dev):** Focuses on strict separation of concerns in the React Webview (View, Handler Hooks, State Hooks, Feature Stores) and ensures no manual edits exist in `.gen.ts` files.


* **Morgan (bmad-agent-sre):** Analyzes Extension Host memory leaks, zombie shell processes, RPC message-passing latency, and Webview lifecycle crash recovery.



**Mandatory Skills & Lenses**

* **bmad-review:** Use Adversarial (find 10+ structural issues), Edge-Case (trace IPC race conditions, unhandled RPC promises), and Verification-Gap lenses (evaluate test assertions).


* **decathlon-tech-compliance:** Evaluate against SIG standards for Architecture, Development, Security, and Testing.


* **cybersecurity-threat-modeling:** Perform a STRIDE assessment targeting the Extension Host's file system access and shell execution boundaries.



**Specific Target Areas (The Extension Stack)**

* **Backend (Extension Host):** Audit TypeScript execution contexts, zombie child processes, file system cleanup, and unhandled `vscode.*` API rejections.
* **Webview Frontend:** Enforce pure declarative UI using shadcn/ui. Verify strict separation into `[Feature].component.tsx`, `use[Feature]Handlers.ts`, `use[Feature]State.ts`, and `[feature].store.ts`.
* **Shared Layer & RPC:** Validate end-to-end type safety. Hunt for RPC contract drift, untyped `postMessage` calls, and missing schema mappers.
* **Code Generation Layer:** Ensure all RPC bindings and registries use `.gen.ts`/`.tsx` suffixes and confirm they are deterministically reproducible.

**Report Output Expected**
Structure the output exactly like a SIG `tech_debt.md` document:

* **Executive Summary Table:** Blocking Violations (🔴), High-Priority Gaps (🟠), Medium-Priority (🟡), and Quick Wins (🟢).


* **🔴 Blocking Issues:** Severe Vertical Slice coupling, Extension Host STRIDE vulnerabilities, or manual overrides in `.gen.ts` files.


* **🟠 Architectural Compliance Gaps:** RPC bottlenecks, Webview state desyncs, or missing boundary validations.


* **🟡 Code-Level & Testing Gaps:** DRY violations in hooks, UI logic bleed, or testing verification gaps.


* **Remediation Roadmap Table:** Priority, Finding, Domain, Effort (S/M/L), Suggested Owner.
