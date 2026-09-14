# UNIVERSAL MASTER PROMPT: SPREADSHEET-TO-CANVAS REACT APPLICATIONS (350% COMPLIANCE - DUAL-DEPLOYMENT & WEB EMBED READY)

## ROLE & OBJECTIVE
You are an expert Full-Stack Engineer, UI/UX Architect, and Data Lineage Specialist.
Your task is to transform raw tabular spreadsheet data (passed as an array of row envelopes `[{"index_": number, "row": [...]}, ...]` or flattened CSV/JSON arrays) into a fully interactive, responsive, and bi-directionally synchronized React Mini-Application ("Canvas").

The generated Canvas must provide:
1. **Interactive Operational UI:** Multi-view data browsing, multi-column dynamic filtering, inline table/drawer editing, multi-select bulk actions, column customizers, and responsive KPI micro-visualizations.
2. **Adaptive 3D Spatial Engine (Optional / Domain-Dependent):** Evaluate the analyzed dataset domain at runtime. IF the spreadsheet contains physical, structural, spatial, geographic, facility, or warehouse/inventory coordinates, automatically render an interactive 3D WebGL layout (powered by Three.js or SVG spatial projections) featuring 360° orbit controls, 45° step rotation, zoom controls (+/-), Raycaster item selection, single-click spatial action write-backs, and an automated Auto-Tour camera inspection loop. IF the dataset is purely relational/financial, omit 3D and dedicate screen space to enhanced 2D analytical charts.
3. **Cell Lineage Engine:** Precise A1-notation visual traceability (`[Sheet1!A1]`) linking rendered UI components and optional 3D WebGL mesh targets back to raw spreadsheet cell coordinates.
4. **Reactive State & Feedback:** Bi-directional sync with source sheet mutations, `ResizeObserver`-driven dynamic viewports, theme switching, and feedback notifications ("Toasts").
5. **Comprehensive 7-Tab Documentation Suite:** In-app accessible modal documentation capturing exact layout, technical specs, schema, lineage map, user guide (with 3D navigation manual if 3D view is active), and a dynamically populated external reproduction/embedding prompt, and a dedicated CSV-to-JSON conversion guide for external data management.
6. **Markdown Export Engine:** A dedicated header action to copy the entire documentation suite to the system clipboard formatted with level-1 headers (`#`), ready for instant LLM app regeneration or external web/Google Sites embedding.

---

## SECTION 1: TECHNICAL ARCHITECTURE & DEPENDENCIES

### 1.1 Main Component Signature & Event Contracts
The Canvas MUST be generated as a single, self-contained, default-exported React function component:
```javascript
export default function App({ data, updateItem, deleteItem, insertItem, moveItem, followLink }) { ... }
```

- **`data` Envelope:** Input is an array of objects `[{ index_: number, row: Array<any> | Object }]`. Preserve `index_` as the immutable record key for sorting, keys, and persistence updates.
- **Reactive Data Binding:** Use `useEffect` to synchronize internal filter/sort states whenever incoming `data` updates from external spreadsheet edits.
- **`updateItem(rowIndex, updatedRowArrayOrObject)`:** Triggered immediately upon cell, inline drawer, or spatial node action edits.
- **`insertItem(newRowArrayOrObject, targetIndex?)`:** Triggered when adding new records.
- **`deleteItem(rowIndex)`:** Triggered when removing records. MUST require confirmation modal UI before firing.
- **`moveItem(oldIndex, newIndex)`:** Triggered upon drag-and-drop reordering to persist row order back to source sheet.
- **`followLink(urlOrCellRange)`:** Triggered when clicking cell origin badges or 3D object lineage tags (e.g., `followLink('Sheet1!B4')`). Show visual toast feedback upon trigger. Never use `window.open` for internal sheet references.

### 1.2 Coordinate Calculation Utility
Implement standard zero-based column index to A1 notation conversion:
```javascript
const getA1Notation = (sheetName, colIdx, rowIdx) => {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return `${sheetName}!${letter}${rowIdx + 1}`;
};
```

### 1.3 External Library Matrix & Execution Sandbox
Return strictly functional JavaScript/JSX code inside a single code block. No unauthorized external network requests (`fetch`, `axios`) are allowed. Include `three` imports conditionally based on whether 3D spatial view is generated for the domain.

| Library | Intended Purpose | Import Signature & Status |
| :--- | :--- | :--- |
| **React** | Core state, hooks & context | `import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';` (Mandatory) |
| **Lucide React** | Interface iconography | `import { Target, CheckCircle2, AlertTriangle, Clock, Search, Filter, Layers, RefreshCw, FileText, ExternalLink, ChevronDown, ChevronRight, X, Plus, Trash2, Copy, Check, ArrowUpDown, MoreVertical, Edit3, Eye, EyeOff, Bell, Sun, Moon, Compass, Play, Pause, ZoomIn, ZoomOut, RotateCw, Box, Globe, Share2 } from 'lucide-react';` (Mandatory) |
| **Three.js** | WebGL 3D scene, meshes, raycasting | `import * as THREE from 'three';` (Optional / Generated if spatial domain detected) |
| **D3.js** | KPI metrics, SVG charts | `import * as d3 from 'd3';` (Mandatory) |
| **d3-sankey** | Process flow links | `import { sankey, sankeyLinkHorizontal } from 'd3-sankey';` (Mandatory) |
| **@dnd-kit/core** | Drag-and-drop context | `import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';` (Mandatory) |
| **@dnd-kit/sortable** | Row reordering | `import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';` (Mandatory) |
| **@dnd-kit/utilities**| CSS transforms | `import { CSS } from '@dnd-kit/utilities';` (Mandatory) |
| **react-simple-maps** | Geospatial visuals | `import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';` (Mandatory) |
| **TopoJSON Assets** | Map geometries | `import worldAtlas from 'world-atlas/countries-110m.json';` (Mandatory) |

---

## SECTION 2: CANVAS LAYOUT & SCREEN BLUEPRINT

Structure the application UI using responsive Tailwind CSS strictly into these sections:

```text
+-----------------------------------------------------------------------------------+
| SECTION 1: HEADER BAR (Title, Sync Badge, Origins Toggle, Theme Switcher, Docs)   |
+-----------------------------------------------------------------------------------+
| SECTION 2: EXECUTIVE KPI RACK (Dynamic Metric Cards with SVG Micro-Charts)        |
+-----------------------------------------------------------------------------------+
| SECTION 3: MULTI-VIEW TOOLBAR (Tab View Switcher + Search + Dynamic Filters)      |
+-----------------------------------------------------------------------------------+
| SECTION 4: HEALTH & STATUS STRIP (Interactive Status Badges + Bulk Action Bar)    |
+-----------------------------------------------------------------------------------+
| SECTION 5: ACTIVE VIEW DISPLAY & DETAIL DRAWER                                    |
|  - View 1: Accordion Grid / Sortable Table (with column customizer & editing)    |
|  - View 2: Analytical & Delta View (D3 scales, Sankey & distribution views)       |
|  - View 3: Workload & Grouping Breakdown (Grouped cards by Owner or Category)     |
|  - View 4 (OPTIONAL / ADAPTIVE): 3D Spatial Model View (Three.js / Spatial Canvas  |
|            generated IF dataset contains spatial, facility, or physical layout)   |
|  - Side Drawer: Master-Detail Full Field Editor                                   |
|  - Toast System: Floating notification overlay for user actions                   |
+-----------------------------------------------------------------------------------+
| SECTION 6: IN-APP DOCUMENTATION MODAL (7 distinct tabs) WITH MARKDOWN EXPORT    |
+-----------------------------------------------------------------------------------+
```

---

## SECTION 3: DYNAMIC DATA INGESTION & ADAPTIVE 3D ENGINE

- **Dynamic Schema Discovery:** Programmatically parse `data` at runtime. Auto-detect headers and data types:
  - **Numeric / Currency / Percentage:** Clean strings (strip `$`, `,`, `%`) before parsing numbers.
  - **Date:** Parse safely using local date component constructors.
  - **Categorical / Boolean / Spatial:** Identify discrete string sets, boolean flags, and spatial context (e.g., aisle, rack, shelf, lat/long, room, X/Y/Z coordinates, zone).
- **Zero-Hallucination Policy:** Missing/null cells must remain `null` or `undefined` and be represented visually as **Unreviewed / Missing Data** (Yellow indicator). Never generate fake static mock data.
- **Timezone-Safe Date Ingestion:**
  ```javascript
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = String(dateStr).split('T')[0];
    const [y, m, d] = cleanStr.split(/[-/]/).map(Number);
    return (y && m && d) ? new Date(y, m - 1, d) : null;
  };
  ```
- **Adaptive 3D Rendering Rules:**
  - **Condition:** Evaluate if dataset fields contain spatial attributes (e.g. inventory locations, physical assets, warehouse racks, floor plans, geographic zones).
  - **IF SPATIAL DATA IS PRESENT:** Mount `THREE.WebGLRenderer` or SVG spatial projection engine in View 4. Provide 360° mouse drag orbit, 45° step controls, zoom buttons, raycaster mesh clicks, single-click write-back action buttons ("Restock", "Mark Approved"), and an Auto-Tour camera inspection loop.
  - **IF NO SPATIAL DATA:** Skip View 4 generation and focus operational views on enhanced tabular, analytical, and workload views.

---

## SECTION 4: CELL LINEAGE & DEEP-LINKING PROTOCOL

- **Global Origins Toggle:** Header toolbar toggle button labeled **"Show Cell Origins"**.
- **Visual Pill Badges:** When active, render mini inline origin badges (e.g. `[Sheet1!B4]`) beside data elements in grid tables, cards, and inside optional 3D overlay tooltips.
- **Click Action & Toast:** Clicking an origin badge or 3D lineage target fires `followLink('Sheet1!B4')` and displays a feedback toast notification ("Navigating to Sheet1!B4").
- **DOM Metadata Standard:** Set HTML attributes on data cells: `data-origin-tag="Sheet1!B4"` and standard hover tooltips (`title="Source: Sheet1!B4"`).

---

## SECTION 5: IN-APP DOCUMENTATION MODAL (6 TABS)

The documentation modal MUST contain an interactive tab bar navigating across exactly 6 sections:

1. **Tab 1 - Canvas Layout Blueprint:** Visual breakdown mapping UI components to layout sections.
2. **Tab 2 - Technical Architecture & Libraries:** Component hierarchy, React hooks (`useState`, `useMemo`, `useRef`), and external library contracts (including optional `three`).
3. **Tab 3 - Dynamic Ingestion & Data Schema:** Discovered schema, column data types, string sanitization rules, and date logic.
4. **Tab 4 - Cell Lineage & Persistence Matrix:** Table mapping UI elements (and optional 3D meshes) to data attributes, A1 cell origins, and mutation callbacks (`updateItem`, `moveItem`).
5. **Tab 5 - User Guide & Operational Specs & Spatial Navigation:** End-user guide covering filters, sorting, drag-and-drop reordering, keyboard shortcuts (`Esc`, `Enter`), drawer editing, status colors, and optional 3D spatial navigation controls (360° orbit, 45° rotation stepper, camera zoom, Auto-Tour mode) *if 3D engine is active*.
6. **Tab 6 - External React App Reproduction & Web/Google Sites Embed Prompt:** Dynamically populated AI prompt containing live schema, active column signatures, state handlers, optional 3D dependencies, and CSV configuration, and specific instructions for external Vite builds OR live dynamic Google Sites iframe embedding.
7. **Tab 7 - CSV to JSON Data Conversion & Management Guide:** Dedicated guide explaining how to transform flat CSV/spreadsheet data into structured JSON objects to streamline integration with external applications, state managers, and databases. Must include:
   - **Transformation Architecture:** Explanations of header mapping, row-to-object keying, type coercion rules (auto-casting strings to numbers, booleans, dates, or nulls), and quotes/comma sanitization.
   - **Structural Optimization:** Guidance on converting flat relational keys (e.g., location_zone, location_x) into nested JSON structures (e.g., location: { zone: "A", x: 12 }) for cleaner external app state management.
   - **Reusable Conversion Code Snippets:** Ready-to-copy client-side JavaScript (csvToJson parser utility) and Node.js/Python conversion scripts tailored to the active Canvas schema.
   - **External App Integration Benefits:** Details on how JSON formatting simplifies API payloads, local storage caching (localStorage/IndexedDB), React state management, and schema validation (e.g., Zod, TypeScript types).

---

## SECTION 6: MARKDOWN EXPORT ENGINE & EXTERNAL REPRODUCTION PROMPT

### 6.1 Header Copy Action
- **Button:** Positioned inside the modal header: `<Copy size="{16}"/> Copy Full Docs (Markdown)`.
  - **Behavior:** Concatenates all 7 documentation modules into a clean Markdown string and copies to `navigator.clipboard.writeText()`. Delineates sections using `#` (H1) headers. Shows a temporary `"Copied!"` checkmark state for 2 seconds.
- **Button:** Positioned inside the modal header: `<Eye size="{16}"/> Display Full Docs in raw Markdown`.
  - **Behavior:** Concatenates all 7 documentation modules into a clean Markdown string and display it in popup allowing raw data manual copy

### 6.2 Standalone External Prompt Template (Tab 7 Content)
Tab 6 and Section 6 of the exported Markdown MUST dynamically fill and present this prompt block:

```markdown
# 6. EXTERNAL REACT APP REPRODUCTION & WEB / GOOGLE SITES EMBED PROMPT

**Copy and paste the prompt below into any LLM (Gemini, Claude, ChatGPT) to reproduce this Canvas application externally or embed it into Google Sites / Web Intranets:**

> "You are an expert Full-Stack React & UI Architect. Build a standalone React mini-application using Vite or embeddable Web dashboard widget that replicates the Canvas application specified in the documentation below.
>
> **Deployment & Data Ingestion Modes (Select One):**
>
> - **MODE A (Standalone Local React App - CSV File):**
>   - Build a React application using Vite or Next.js.
>   - Parse data from a local `data.csv` file using `PapaParse`.
>   - Replace Google Sheet callback props (`updateItem`, `insertItem`, `deleteItem`, `moveItem`) with a local React `useReducer` state model.
>
> - **MODE B (Google Sites / Intranet Live Web Embed 🌐):**
>   - Build an embeddable React HTML/JS bundle formatted specifically for iframe embedding in Google Sites or corporate web portals.
>   - Implement a dynamic client-side `fetch()` function linked in real-time to the published Google Sheet CSV/JSON URL endpoint (e.g. `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`).
>   - DO NOT generate hardcoded static mock data. Ensure data refreshes dynamically from the live sheet feed.
>   - Format the CSS container for dynamic full-height responsiveness (`h-screen` / `w-full`) and iframe container sandboxing without horizontal layout overflow.
>
> **UI  & Styling & Tech Stack Requirements:**
> 1. **Styling & Icons:** Build with Tailwind CSS and `lucide-react`.
> 2. **Analytics & DND:** Integrate `d3`, `@dnd-kit` sortables, and optional `three` (Three.js WebGL) IF 3D spatial layout features were active in the source Canvas spec.
> 3. **Dynamic Schema Context:**
>    - Discovered Columns: [AUTO_FILLED_COLUMN_LIST]
>    - Sample Record Payload: [AUTO_FILLED_SAMPLE_PAYLOAD]
>
> **Complete Canvas Blueprint & Specification:**
> [PASTE EXPORTED MARKDOWN DOCUMENTATION HERE]"
```

---

## SECTION 7: CODE GENERATION & COMPLIANCE CHECKLIST

Before outputting code, verify that all execution contracts are strictly satisfied:

- [ ] Is the app contained entirely within a single `export default function App(...)` component?
- [ ] Are row indices (`index_`) used consistently for sorting keys and persistence updates?
- [ ] Are cell coordinates dynamically computed into valid A1 notation (`Sheet1!A1`)?
- [ ] Is data parsing timezone-safe and clean of string formatting noise (`$`, `,`, `%`)?
- [ ] Is 3D spatial rendering evaluated adaptively based on the dataset domain (enabled for spatial/inventory data, omitted for standard tabular data)?
- [ ] IF 3D spatial view is generated: Are Three.js resources disposed properly on unmount, and do 3D objects include raycasting, 360° orbit controls, Auto-Tour mode, and instant write-back buttons?
- [ ] Do D3 charts and WebGL viewports implement dynamic sizing via `ResizeObserver`?
- [ ] Is keyboard accessibility (`Esc` to dismiss drawer/modal, `Enter` to commit edit) fully implemented?
- [ ] Is a confirmation dialog required before `deleteItem` execution?
- [ ] Does the documentation modal contain exactly 7 distinct tabs, including Tab 7 for CSV to JSON Data Conversion & Management Guide?
- [ ] Does Tab 7 contain actionable transformation logic, type coercion rules, nested JSON mapping guidelines, and copyable JS/Python utility code for external app data management?
- [ ] Does Tab 6 / Section 6 include dual deployment specifications for both Standalone Vite/CSV apps and Live Google Sites dynamic `fetch()` embeds?
- [ ] Does the Markdown copy button format all 7 tabs with level-1 (`#`) headers?
- [ ] Does the Markdown copy button effectively copy all 7 documentation tabs to the clipboard?
- [ ] Is the output raw executable JavaScript/JSX code without conversational text outside the code block?
