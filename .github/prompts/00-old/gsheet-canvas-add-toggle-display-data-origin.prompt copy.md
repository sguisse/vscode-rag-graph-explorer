# 🎯 Data Origin Management & Header Toggle Button

You are an expert developer in React, complex state management (Zustand), and "Google Sheets / Canvas" type UI architecture.

## 🚀 Goal

I want you to implement the "Data Origin Management" (lineage system) architecture. Specifically, you need to create a **Toggle Button (Switch)** and **concretely integrate it into the `Header` component** of the canvas. This button will allow the user to visually show or hide data origins (tags, overlays, dependencies) directly on the cells displayed on the screen, without breaking the layout.

Here are the **proposed** technical specifications of the architecture you should follow:

## 📊 1. Data Origin Management ("Show Cell Origins" Lineage System)

The Data Origin feature provides visual lineage tracing, formula DAG dependencies, and source cell inspection.

### 📁 A. Proposed only Folder Architecture

Source files proposed for the implementation of the Data Origin Management system:

* `components/`: `CellOriginsToggle.tsx`, `OriginTag.tsx`, `OriginTooltip.tsx`, `LineageHighlightOverlay.tsx` (proposed only)
* `hooks/`: `useLineage.ts`, `useSourceNavigation.ts`, `useBidirectionalHighlight.ts` (proposed only)
* `store/`: `lineageStore.ts` (Pure in-memory Zustand store) (proposed only)
* `types/`: `lineage.types.ts` (proposed only)

### 📑 B. Proposed only Type Definitions & Store (Zustand)

Data origin relies on strict typing for source metadata and state tracking:

```typescript
export interface OriginMetadata {
  sheetName: string;
  a1Range: string;
  fieldLabel: string;
  lineageType: 'DIRECT' | 'AGGREGATED' | 'FORMULA' | 'DERIVED' | 'STATIC' | 'UNKNOWN';
  formula?: string;
  aggregationType?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'CUSTOM';
  currentValue: unknown;
  hasError?: boolean;
  errorMessage?: string;
  dagDependencies?: string[]; // Antecedent A1 cells
}

export interface LineageStore {
  showCellOrigins: boolean; // State controlled by the Toggle Button
  activeHoveredOrigin: OriginMetadata | null;
  highlightedRange: string | null;
  toggleCellOrigins: () => void; // Action triggered by the Toggle Button
  setActiveOrigin: (origin: OriginMetadata | null) => void;
  setHighlightedRange: (range: string | null) => void;
}

```

### 🎛️ C. Toggle Button Implementation & Component Rules

* **The Toggle Button (`<CellOriginsToggle/>`):** Must be a clear UI component (e.g., a Switch or a button with an icon) that visually reflects whether the mode is active or inactive. On click, it calls `toggleCellOrigins()` from the store.
* **Header Integration:** This button must be explicitly injected into the main navigation component (e.g., `<FeatureName/>Header` or `SheetHeader`).
* **Origin Wrapper (`<OriginTag/>`):** Wraps source-backed UI elements/cells. It listens to the `showCellOrigins` boolean from the store. If `true`, the tag is displayed.
* *CLS (Cumulative Layout Shift) Mitigation:* Use absolute positioning overlays or reserved inline bounding boxes to guarantee that toggling the origins does not shift the data grid (Zero CLS).
* *Bidirectional Highlighting:* Hovering or focusing an `<OriginTag/>` sets `highlightedRange` in the store, highlighting all sibling components sharing that same source range or DAG lineage.


* **Origin Tooltip Portal (`<OriginTooltip/>`):** Rendered inside a React Portal (via Base UI or Floating UI, Z-index: 60) to display the `OriginMetadata` details on hover, preventing clipping in parent containers or virtualized tables with `overflow: hidden`.

## 📦 Expected Deliverables

1. The canvas update with integration of the toggle button in the Header.
2. The integration of the component wrapping all source-backed cells, listening to the store's `showCellOrigins` state.
3. The integration of the component rendered, displaying `OriginMetadata` details on hover.
