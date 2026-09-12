# 🧑‍💻 Token Razor — Contributor Guidelines & Developer Manual

Welcome to the **Token Razor** project! This document outlines our architectural invariants, coding conventions, development workflows, and pull request verification standards.

---

## 🛡️ Core Policy & Security Invariants

All contributors and AI agents MUST adhere to these non-negotiable repository invariants:

1. 🛑 **No Shell String Formatting**: Never use raw string template concatenation when executing shell commands or scripts (`execSync`, `exec`). Always use parameterized argument arrays (`child_process.execFile` or `spawn`) with `shell: false` and strict argument escaping.
2. 🧟 **Process Lifecycle & Zombie Cleanup**: All background processes (Python interpreter scripts, external binaries) must be spawned with process group detachment (`detached: true`) and registered with `vscode.Disposable` or Webview `onDidDispose` handlers using `tree-kill` / `SIGKILL` on process groups.
3. 🔐 **Secret Isolation**: Never store sensitive API keys (e.g., Gemini API credentials) in `package.json` settings or `.vscode/settings.json`. Always use VS Code's native `SecretStorage` API (`context.secrets`).
4. ⚡ **Immutable Auto-Generated Files**: Never manually edit files matching `*.gen.ts` or `*.gen.tsx`. Always run `npm run generate:code` and verify zero uncommitted git diffs via `npm run verify:generated`.
5. 🚧 **Workspace Path Containment**: Validate that all resolved absolute paths remain strictly within authorized workspace roots (`isPathInsideWorkspace` using `path.relative`) before executing disk read/write operations.

---

## 🏗️ Webview UI Architecture Standard

When building or modifying frontend features under `./webview/src/features/`, strictly enforce declarative UI layering:

```text
webview/src/features/<feature-name>/
├── data/                       # Static templates & mock datasets
├── model/                      # UI-only TypeScript DTOs & interfaces
│   └── index.ts
├── store/                      # Zustand global feature store
│   └── use<Feature>Store.ts
├── hooks/                      # Handlers & local state hooks
│   ├── use<Feature>State.ts
│   └── use<Feature>Handlers.ts
├── components/                 # Declarative view components
│   ├── <Feature>Panel.tsx
│   └── <Feature>Section.tsx    # CollapsibleCard sections with summaryBadges
├── layout-ctns/                # Regional workspace containers
│   └── CenterPanelContainer.tsx
├── <Feature>Feature.tsx        # Feature layout orchestrator
└── index.ts                    # Public feature barrel export
```

### Component Rules
* 🎨 **shadcn/ui Component Standard**: Never use raw HTML form elements (`<input>`, `<select>`, `<button>`, `<textarea>`); always import shadcn/ui components from `@/components/ui/*`.
* 💬 **Tooltip Standard**: Use `data-tooltip` with HTML tag support on descriptive elements instead of native `title` attributes.
* 🪵 **Logging Isolation**: Use `@/services/view/log-view.service.wrapper` (`logInfo`, `logError`) in Webview UI, and `../../utils/utils-log` in backend adapters. Never use raw `console.log`.
* 🧱 **Layout Panel Wrappers**: Group regional layout components using `TopMiddleBottomPanel` (`@/components/app/top-middle-bottom-panel`) for vertical stacks and `LeftCenterRightPanel` (`@/components/app/left-center-right-panel`) for horizontal toolbars.

---

## 🛠️ Development & Build Workflow

### 1. Daily Development Commands

```bash
# Compile Extension Host TypeScript backend
npm run compile

# Launch Webview Vite development server
npm run dev:webview

# Generate RPC method registrators and DTO schemas
npm run generate:code

# Assert that generated code matches schemas (CI check)
npm run verify:generated

# Run Vitest test suites
npm run test
```

### 2. Feature Navigation Registration Checklist

When adding a new feature (e.g. `./webview/src/features/home`):
1. **Router (`webview/src/router.tsx`)**: Update `FEATURE_TO_ROUTE_MAP`, `ROUTE_TO_FEATURE_MAP`, `ROUTE_BREADCRUMB_LABELS`, and register the TanStack route.
2. **Left Sidebar (`webview/src/_layout/SidebarLeft.tsx`)**: Add entry to `sidebarMenuItems` with Lucide icon and label.

---

## 🧪 Testing & Verification Requirements

Before opening a Pull Request:
- [ ] Run `npm run compile` to verify TypeScript backend compilation.
- [ ] Run `npm run verify:generated` to ensure no schema drift in `.gen.ts` files.
- [ ] Run `npm run test` to verify unit and integration tests.
- [ ] Verify that no unhandled VS Code API floating promises or raw `execSync` calls were introduced.
