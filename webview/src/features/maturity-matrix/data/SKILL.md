---
name: react-canvas-clone-compiler
description: Deterministic, zero-hallucination compiler agent skill. Transforms a Markdown specification document (SPEC_IR), raw dashboard HTML/CSS snippets (DOM_IR/STYLE_IR), and a Google Sheets CSV export (DATA_IR) into an embeddable, strictly-typed React feature (<CanvasClone />). Enforces a mandatory store destination pre-flight check, a 13-level evidence hierarchy, a 3-axis fidelity matrix, Tailwind CSS v4 scoping, shadcn/ui primitives, dynamic saveStore() persistence adapters, and clean component architecture without extraneous injected UI overlays. Use this skill for faithful, production-grade replication of Google Sheets Canvas dashboards into React applications.
version: 3.0.0
author: Senior Reverse Engineer & React Architecture Specialist
license: MIT

metadata:
  target_environment:
    framework: "React >=18.2.0"
    language: "TypeScript >=5.0.0"
    bundler: "Vite >=5.0.0 (@tailwindcss/vite)"
    styling: "Tailwind CSS v4 (CSS-first config via @import 'tailwindcss', @theme, scoped under .canvas-clone-root)"
    ui_library: "shadcn/ui (Radix UI primitives styled via Tailwind v4 CSS variables)"
    state_management: "Zustand >=4.5.0 (Configured dynamically based on mandatory user-defined store destination)"
    virtualization: "@tanstack/react-virtual >=3.0.0"

inputs:
  specification_markdown:
    type: string
    description: Technical reverse-engineering Markdown specification (SPEC_IR) containing visual trees, layout mechanics, formula DAGs, and business rules.
    required: true
  dashboard_html_css:
    type: string
    description: Raw HTML DOM snippets and CSS stylesheet definitions from the source Google Sheets Canvas dashboard (DOM_IR / STYLE_IR).
    required: true
  google_sheets_csv:
    type: string
    description: Authoritative raw CSV data export from Google Sheets (DATA_IR), preserving row indices (__rowNum__), column headers, physical/semantic types, and raw cell values.
    required: true
  store_destination:
    type: string
    description: MANDATORY store persistence target defined in user prompt (e.g., 'in-memory', 'localStorage', 'sessionStorage', 'IndexedDB', 'REST/GraphQL API', or 'host-callback'). If absent, agent MUST halt and request it.
    required: true

outputs:
  stage_1_blueprint:
    type: object
    required:
      - evidence_audit_matrix
      - reconciliation_report
      - canvas_clone_ir
      - memory_store_contracts
      - header_blueprint_jsx
    properties:
      evidence_audit_matrix:
        type: string
        description: Audit of extracted elements mapped across the 13-level evidence hierarchy and 3-axis fidelity matrix.
      reconciliation_report:
        type: string
        description: Conflict resolution table arbitrating discrepancies across SPEC_IR, DOM_IR/STYLE_IR, and DATA_IR.
      canvas_clone_ir:
        type: object
        description: Canonical, unified Intermediate Representation (AST) serving as the single source of truth.
      memory_store_contracts:
        type: string
        description: Fully typed TypeScript source code for Zustand stores tailored to the target store destination.
      header_blueprint_jsx:
        type: string
        description: JSX snippet for <CanvasHeader /> showing clean reproduction of the original dashboard header.
  stage_2_codebase:
    type: object
    required:
      - types_manifest
      - data_engine
      - state_stores
      - shadcn_primitives
      - UI_components
      - scoped_styles
      - validation_report
    properties:
      types_manifest:
        type: string
        description: Complete TypeScript interfaces manifest (src/features/canvas-clone/types/index.ts).
      data_engine:
        type: string
        description: CSV parser, timezone-safe date parser, coercion engine, and formula DAG evaluator (src/features/canvas-clone/data/).
      state_stores:
        type: string
        description: Zustand stores featuring optimistic mutations, rollback queue handlers, and the saveStore() implementation (src/features/canvas-clone/state/).
      shadcn_primitives:
        type: string
        description: Suite of adapted shadcn/ui primitives (src/components/ui/).
      UI_components:
        type: string
        description: Virtualized canvas components, detail drawers, KPI cards, and main public entry point (src/features/canvas-clone/CanvasClone.tsx).
      scoped_styles:
        type: string
        description: Encapsulated CSS stylesheet using Tailwind CSS v4 (@import "tailwindcss"; @theme directives) scoped under .canvas-clone-root (src/features/canvas-clone/styles/index.css).
      validation_report:
        type: string
        description: 5-dimensional compliance and non-regression verification matrix (Visual, Behavioral, Data, Integration, Performance).

fault_tolerance:
  conflict_resolution:
    business_logic: SPECIFICATION_FIRST
    visual_styling: HTML_CSS_FIRST
    source_data: CSV_FIRST
  error_handling:
    formula_failure: RETURN_EXPLICIT_SPREADSHEET_ERROR (#DIV/0!, #N/A, #REF!, #VALUE!)
    network_mutation_failure: EXECUTE_OPTIMISTIC_ROLLBACK
---

# SKILL MANUAL: CLEAN REACT CANVAS CLONE COMPILER (V3.0.0)

## 1. PRE-FLIGHT CHECK: STORE DESTINATION GATE

Before executing compilation or parsing inputs, the Agent Compiler **MUST** verify if the user specified their target **Store Destination** in their prompt.

- **Condition Check:** Look for an explicit target declaration (`in-memory`, `localStorage`, `sessionStorage`, `IndexedDB`, `REST/GraphQL API`, or `host-callback`).
- **If MISSING:** Stop execution immediately. Reply strictly with:
  > **"STORE DESTINATION REQUIRED:** Please specify your desired store persistence target (e.g., `in-memory`, `localStorage`, `sessionStorage`, `IndexedDB`, `REST/GraphQL API`, or `host-callback`) before code compilation can begin."
- **If PROVIDED:** Register the target as `STORE_DESTINATION_TARGET` and proceed to Stage 1 Compilation.

---

## 2. EVIDENCE HIERARCHY & TAXONOMY

### A. 13-Level Evidence Hierarchy
1. Direct Canvas observation
2. Screenshots
3. Screen recordings
4. DOM / accessibility tree
5. HTML
6. CSS
7. Existing Canvas code
8. Spreadsheet formulas
9. Spreadsheet source data
10. Interaction traces
11. Explicit user descriptions
12. Logical derivation
13. Engineering inference

### B. Element Classification Taxonomy
Every extracted element in `CANVAS_CLONE_IR` MUST receive exactly one classification: `OBSERVED`, `DERIVED`, `INFERRED`, `UNKNOWN`, or `CONFLICTING`.
*Strict Rule:* Do NOT fabricate components, styles, metrics, or interactions not supported by evidence.

---

## 3. 3-AXIS FIDELITY & CONFLICT ARBITRATION MATRIX

Assign a 3-axis fidelity score (`EXACT`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`) for Visual, Behavioral, and Data domains. When inputs contradict, apply this truth table:

| Conflict Domain | Priority #1 Source | Priority #2 Source | Priority #3 Source | Mandatory Arbitration Action |
| :--- | :--- | :--- | :--- | :--- |
| **Business Logic & Formulas** | `SPEC_IR` | `DOM_IR` | `DATA_IR` | `SPEC_IR` formula AST takes precedence. Compute display value dynamically. |
| **Geometry, CSS & Tokens** | `STYLE_IR` | `DOM_IR` | `SPEC_IR` | Observed CSS dimensions and Tailwind v4 token values override text specifications. |
| **Raw Data & Cell Values** | `DATA_IR` | `SPEC_IR` | `DOM_IR` | CSV physical data types and raw values override HTML rendered strings. |
| **React Integration Contract**| `SPEC_IR` | Inference | — | Host component props and callbacks defined in `SPEC_IR` are immutable. |

---

## 4. COMPLETE FEATURE DIRECTORY & FILE MAP

The generated codebase MUST follow this streamlined project layout (free of injected overlay modules):

```text
src/
├── components/
│   └── ui/                              # Adapted shadcn/ui Primitives (Tailwind v4 Styled)
│       ├── button.tsx                   # Button primitive with variants
│       ├── dialog.tsx                   # Radix Dialog Portal overlay & content
│       ├── tabs.tsx                     # Radix Tabs list, trigger, and content panels
│       ├── badge.tsx                    # Badge pill tag primitive
│       ├── input.tsx                    # Styled native input component
│       ├── drawer.tsx                   # Sheet / Drawer lateral overlay panel
│       └── dropdown-menu.tsx            # Radix Dropdown menu primitive
│
└── features/
    └── canvas-clone/                    # Main Canvas Clone Isolated Feature
        ├── CanvasClone.tsx              # Public Entry Point Component (.canvas-clone-root)
        │
        ├── components/                  # Canvas Core Layout Components
        │   ├── CanvasHeader.tsx         # Cloned Header with native actions
        │   ├── CanvasGrid.tsx           # Virtualized data table container (@tanstack/react-virtual)
        │   ├── KpiSection.tsx           # Summary KPI metric cards container
        │   ├── KpiCard.tsx              # Individual metric card widget
        │   ├── DetailDrawer.tsx         # Lateral record detail panel (uses ui/drawer.tsx)
        │   └── FilterToolbar.tsx        # Search, filter pills, and dynamic sorting bar
        │
        ├── state/                       # State Management Store Layer
        │   ├── useCanvasStore.ts        # Data filtering, sorting, optimistic mutations & rollback
        │   └── persistenceAdapter.ts    # Configured saveStore() persistence handler
        │
        ├── data/                        # Data Engine & Parsing Utilities
        │   ├── dateParser.ts            # Timezone-safe local date parser
        │   ├── coercionEngine.ts        # Type parser (€, %, ISO dates, spreadsheet error values)
        │   └── formulaEngine.ts         # AST formula evaluator & DAG dependency graph
        │
        ├── types/                       # TypeScript Contracts
        │   ├── index.ts                 # Export barrel
        │   └── canvas.types.ts          # Canvas IR, Layout, Data & Component models
        │
        └── styles/                      # Scoped Styling Definitions
            └── index.css                # Tailwind CSS v4 directives (@import "tailwindcss", @theme)

```

---

## 5. CLEAN HEADER REPRODUCTION BLUEPRINT

The header component reproduces the original Canvas header cleanly without injecting additional controls (`src/features/canvas-clone/components/CanvasHeader.tsx`):

```tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { useCanvasStore } from "../state/useCanvasStore";

interface CanvasHeaderProps {
  title: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({ title, onRefresh, onExport }) => {
  const { isMutating } = useCanvasStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {isMutating && <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>}
      </div>
      <div className="flex items-center space-x-2">
        {onRefresh && (
          <Button className="gap-2" onClick="{onRefresh}" size="sm" variant="outline">
            <RefreshCw className="h-4 w-4"/>
            Refresh
          </Button>
        )}
        {onExport && (
          <Button className="gap-2" onClick="{onExport}" size="sm" variant="default">
            <Download className="h-4 w-4"/>
            Export
          </Button>
        )}
      </div>
    </header>
  );
};

```

---

## 6. DATA ENGINE & TECHNICAL UTILITIES

```typescript
// src/features/canvas-clone/data/dateParser.ts
export const parseLocalDate = (dateStr: unknown): Date | null => {
  if (!dateStr) return null;
  const cleanStr = String(dateStr).split("T")[0];
  const parts = cleanStr.split(/[-/]/).map(Number);
  const [y, m, d] = parts;
  return y && m && d ? new Date(y, m - 1, d) : null;
};

// src/features/canvas-clone/data/coercionEngine.ts
export const coerceValue = (value: unknown, physicalType: string): unknown => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && value.startsWith("#")) return value; // Spreadsheet error preservation (#N/A, #DIV/0!)

  switch (physicalType) {
    case "DECIMAL":
    case "INTEGER":
    case "CURRENCY":
    case "PERCENTAGE":
      const cleaned = String(value).replace(/[^0-9.-]/g, "");
      const num = Number(cleaned);
      return isNaN(num) ? null : num;
    case "BOOLEAN":
      return String(value).toLowerCase() === "true" || value === 1;
    default:
      return String(value);
  }
};

```

---

## 7. STATE ENGINE & PERSISTENCE ADAPTER

```typescript
// src/features/canvas-clone/state/useCanvasStore.ts
import { create } from "zustand";

export interface CanvasStoreState<T> {
  data: T[];
  historySnapshot: T[] | null;
  isMutating: boolean;
  mutationError: string | null;
  saveStore: (target?: string) => void;
  setData: (data: T[]) => void;
  executeOptimisticUpdate: (
    updatedRecord: T,
    idKey: keyof T,
    hostCallback?: (record: T) => Promise<void>
  ) => Promise<void>;
}

export const useCanvasStore = create<CanvasStoreState<any>>((set, get) => ({
  data: [],
  historySnapshot: null,
  isMutating: false,
  mutationError: null,

  setData: (newData) => set({ data: newData }),

  saveStore: (target = "default") => {
    const currentState = get();
    console.log(
      `[CanvasStore] saveStore executed (Target: ${target}). Snapshot:`,
      currentState.data
    );
  },

  executeOptimisticUpdate: async (updatedRecord, idKey, hostCallback) => {
    const previousData = get().data;
    set({ historySnapshot: previousData, isMutating: true });

    set({
      data: previousData.map((item) =>
        item[idKey] === updatedRecord[idKey] ? { ...item, ...updatedRecord } : item
      ),
    });

    try {
      if (hostCallback) {
        await hostCallback(updatedRecord);
      }
      set({ isMutating: false, historySnapshot: null });
      get().saveStore("post-mutation");
    } catch (error) {
      set({
        data: previousData,
        isMutating: false,
        mutationError: (error as Error).message,
        historySnapshot: null,
      });
    }
  },
}));

```

---

## 8. INTEGRATION, LIFECYCLE & SECURITY INVARIANTS

1. **Zero Unsolicited Network Requests:** Data and mutations flow exclusively through props and injected adapters.
2. **Resource Cleanup:** Observers (`ResizeObserver`), timers, and listeners MUST be unsubscribed on component unmount.
3. **Scoped Styling:** All CSS rules MUST be namespaced strictly under `.canvas-clone-root`.
4. **Clean DOM Structure:** Render original dashboard structure without extra data attributes or overlay tags.

---

## 9. PUBLIC REACT COMPONENT API CONTRACT

```typescript
export interface CanvasCloneProps {
  /** Raw dataset array provided by host application */
  data?: Record<string, unknown>[];
  /** Host persistence callbacks */
  onUpdateItem?: (item: Record<string, unknown>) => Promise<void>;
  onDeleteItem?: (itemId: string | number) => Promise<void>;
  onInsertItem?: (newItem: Record<string, unknown>) => Promise<void>;
  /** Persistence callback triggered when saveStore() executes */
  onSaveState?: (stateSnapshot: Record<string, unknown>) => void;
  /** Additional CSS class applied to root container */
  className?: string;
  /** Color theme */
  theme?: 'light' | 'dark' | 'system';
}

export default function CanvasClone(props: CanvasCloneProps): JSX.Element;

```

---

## 10. STRICT TWO-STAGE EXECUTION PROTOCOL

To prevent output truncation, the Agent **MUST** execute code generation across two distinct, sequential turns:

### STAGE 1: RECONCILIATION & ARCHITECTURE BLUEPRINT

Upon verifying `STORE_DESTINATION_TARGET` and receiving the 3 inputs, the Agent MUST generate:

1. **Pre-Flight Confirmation:** Acknowledgment of `STORE_DESTINATION_TARGET`.
2. **Evidence Audit Matrix:** Mapping of extracted facts across the 13-level evidence hierarchy and 3-axis fidelity matrix.
3. **Reconciliation Report:** Markdown table detailing confirmed elements and arbitrated conflicts across `SPEC_IR`, `DOM_IR`, and `DATA_IR`.
4. **`CANVAS_CLONE_IR`:** Canonical JSON/YAML AST representation of the dashboard to clone.
5. **Zustand Store Blueprint:** Valid TypeScript code for `useCanvasStore.ts` implementing `saveStore()`.
6. **Header Integration Blueprint:** JSX snippet for `<CanvasHeader />` reproducing the original dashboard header.

*Mandatory Stage 1 Closure Keyword:*
**"Stage 1 Reconciliation & Architecture Blueprint Complete. Reply 'GENERATE CODEBASE' to receive the complete, production-ready React codebase."**

### STAGE 2: COMPLETE EXECUTABLE CODEBASE

Upon receiving the user prompt `"GENERATE CODEBASE"`, the Agent MUST output the entire codebase without omission:

1. TypeScript Types Manifest (`src/features/canvas-clone/types/index.ts`).
2. Coercion Engine, Date Parser & DAG Engine (`src/features/canvas-clone/data/`).
3. Complete Zustand Store with Optimistic Rollback & `saveStore()` Implementation (`src/features/canvas-clone/state/`).
4. Adapted shadcn/ui Primitives (`src/components/ui/` -> button, dialog, tabs, badge, input, drawer).
5. UI Components, Detail Drawers & Main Entry Point (`src/features/canvas-clone/CanvasClone.tsx`).
6. Scoped Tailwind v4 CSS Stylesheet (`src/features/canvas-clone/styles/index.css`).
7. 5-Dimensional Validation Report & Acceptance Checklist.

**Strict Stage 2 Code Completeness Rule:** Placeholders (`// TODO`, `...`, `/* rest of code */`) are strictly forbidden. All output files MUST be fully typed, complete, and immediately executable.
