# Prompt: Enterprise Bookmark Manager

# Context & Role
You are a Principal Frontend Architect and Enterprise UI Engineer specializing in React, TypeScript, Tailwind CSS v4, Shadcn/ui, Lucide Icons, Zustand, Zod, and @dnd-kit. Build a production-ready, feature-sliced Enterprise Bookmark Manager application with 2D grid physics, external browser drag-and-drop, Chrome Bookmark HTML treeview integration, multi-parameter security locks, privacy/ownership access controls, AI-assisted curation, custom styling engines, and automated health governance.

> **STRICT TERMINOLOGY RULE:** Never use the word `title` for entities. Always use `name` across all TypeScript models, Zod schemas, UI labels, variables, and components (e.g., `card.name`, `bookmark.name`, `tab.name`).

---

## 1. Technical Stack & Standards
- **Core Engine:** React 19 (TypeScript), Tailwind CSS v4 (using CSS-first `@theme` syntax and native CSS variables), Shadcn UI primitives, Lucide Icons.
- **State & Validation:** Zustand (persisted multi-store architecture with temporal undo/redo), Zod (runtime validation schemas for models, forms, and import/export payloads).
- **Grid & DnD Physics:**
  - `@dnd-kit` (`core`, `sortable`, `utilities`, `modifiers`) for 2D dynamic grid matrix manipulation (magnetization, non-locked card displacement, push collisions, corner resizing).
  - Native HTML5 Drag-and-Drop API for external browser URL drops and treeview flattening drag operations.
- **Theme & Security:** Native Light/Dark mode via CSS variables, owner-based privacy filters (`isPrivate` & `owner`), dynamic styling engines, adaptive color extraction, and WCAG 2.1 AA accessibility compliance.
- **Architecture:** Feature-Sliced Design (FSD) enforcing SOLID principles, strict separation of concerns, and clean domain isolation.

---

## 2. Complete Architecture & File System Structure
Organize all client code strictly inside `webview/src/`:

```text
webview/src/
├── components/
│   └── ui/                             # Adapted Shadcn/ui primitives (Button, Input, Dialog, Dropdown, Checkbox, Badge, Switch, Slider, etc.)
└── features/
    └── bookmarks/                      # Main Isolated Feature Domain
        ├── BookmarksFeature.tsx        # Feature root entry point wiring layout, auth context, and panels
        ├── index.ts                    # Barrel export
        ├── components/
        │   ├── BookmarksPanel.tsx      # Core 2D grid matrix canvas with Marquee selection layer
        │   ├── BookmarksToolBar.tsx    # Omni-search (Cmd+K), view modes, Zen mode toggle, Chrome import action
        │   ├── BookmarksHeader.tsx     # Workspace header, global controls, role badge, owner status, theme toggle
        │   ├── IconRenderer.tsx        # Universal dynamic icon component (Lucide, Emoji, Image URL, Base64)
        │   ├── BookmarkCard.tsx        # Resizable/draggable card with badges, privacy indicators, adaptive palette
        │   ├── BookmarkItem.tsx        # Single bookmark row with hover actions, edit/delete, health status
        │   ├── ReaderViewDrawer.tsx    # Side drawer for clutter-free article reading and web snapshots
        │   ├── RadialContextMenu.tsx   # Circular gesture menu for quick link actions
        │   ├── OmniSearchModal.tsx     # Cmd+K global search overlay
        │   ├── AnalyticsDashboard.tsx  # Link health stats, duplicates summary, and click telemetry
        │   ├── AuditHistoryModal.tsx   # Time-machine version history & restoration interface
        │   ├── sidebar/
        │   │   ├── SidebarRightPanel.tsx # Right drawer/sidebar containing Chrome treeview & search should be resizable on the left edge
        │   │   ├── BookmarkTreeview.tsx # Virtualized 3-state checkbox tree control
        │   │   ├── TreeNodeItem.tsx     # Single recursive node item (Folder/Leaf render)
        │   │   └── TreeToolbar.tsx      # Tree-specific search input and import/export controls
        │   ├── dialogs/
        │   │   ├── BookmarkDialog.tsx  # Zod-validated bookmark popup modal (with auto-metadata & snooze setup)
        │   │   ├── CardConfigDialog.tsx# Modal for card name, header/content colors, locks, badges, & adaptive theme
        │   │   ├── TabConfigDialog.tsx # Modal for tab name, description, privacy, & colors
        │   │   ├── DuplicateResolverModal.tsx # Duplicate url scanner & consolidation wizard
        │   │   └── ShareSnapshotModal.tsx    # Magic link & QR code generator modal
        │   └── tabs/
        │       ├── BookmarksTabList.tsx# DnD-reorderable tab bar with edit icons, lock badges, & privacy tags
        │       └── BookmarksTabPanel.tsx# Active tab viewport
        ├── data/
        │   └── initialBookmarks.json   # Seed datasets
        ├── hooks/
        │   ├── useBookmarksHandlers.ts # Keyboard hotkeys (Ctrl+C/X/V), intra-card DnD event listeners
        │   ├── useExternalDnD.ts       # HTML5 Native drop hook for external browser URLs & Treeview drops
        │   ├── useGridPhysics.ts       # Collision math, magnetic snap-to-top, card push algorithms
        │   ├── useMarqueeSelect.ts     # Click-and-drag rubberband multi-card selection box
        │   ├── useLinkHealth.ts        # Background HTTP/SSL health checker worker
        │   ├── useAutoMetadata.ts      # Web scraper hook for name/favicon/screenshot auto-fill
        │   ├── useAiCategorizer.ts     # Smart auto-clustering hook for loose URLs
        │   ├── useDuplicateDetector.ts # Cross-tab duplicate URL scanner
        │   ├── useTreeSelection.ts     # 3-state checkbox selection & auto-tagging logic
        │   └── useBookmarksState.ts    # Store selectors and action abstractions with ownership filtering
        ├── store/
        │   ├── useBookmarksStore.ts    # Central Zustand grid domain state store
        │   └── useTreeStore.ts         # Persistent store for Chrome tree structures
        ├── types/
        │   ├── bookmarks.enums.ts      # LockLevel, LockType, IconType, HealthStatus, UserRole, ViewMode
        │   └── bookmarks.types.ts      # Domain interface contracts
        ├── model/
        │   └── bookmarks.model.ts      # Zod validation schemas
        └── utils/
            ├── iconUtils.ts            # Icon type & color palette detection utilities
            ├── exportImport.ts         # JSON / CSV parsers with schema validators
            ├── chromeBookmarkParser.ts # Netscape HTML-to-JSON structural parser
            └── webhookDispatcher.ts    # Event triggers for outbound enterprise webhooks

```

---

## 3. Exhaustive Domain Models & Zod Validation Schemas

```typescript
// types/bookmarks.types.ts
import { z } from 'zod';

export type IconType = 'lucide' | 'emoji' | 'url' | 'base64';
export type UserRole = 'admin' | 'editor' | 'viewer';
export type LinkHealthStatus = 'healthy' | 'broken' | 'unreachable' | 'ssl_error' | 'checking';
export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';
export type ViewMode = 'compact' | 'grid' | 'thumbnail';

export interface BaseEntity {
  id: string;
  name: string;
  isPrivate: boolean;
  owner: string; // User ID or Email of creator
}

export interface CardSelfLocks {
  lockedPosition: boolean; // Prevents grid drag/reorder
  lockedSize: boolean;     // Prevents resizing handles
  lockedName: boolean;     // Prevents card renaming
  lockedDeletion: boolean; // Prevents removing the card
}

export interface CardBookmarkLocks {
  editable: boolean;        // Allow editing bookmark attributes
  reorderable: boolean;     // Allow dragging/reordering bookmarks
  urlEditableOnly: boolean; // Restrict edits strictly to URL (name/desc locked)
  removable: boolean;       // Allow removing bookmarks from card
  addable: boolean;         // Allow adding new bookmarks to card
}

export interface CardLockMatrix {
  cardLocks: CardSelfLocks;
  bookmarkLocks: CardBookmarkLocks;
}

export interface CardBadge {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
  iconType: IconType;
}

export interface Bookmark extends BaseEntity {
  description: string;
  url: string; // Supports http://, https://, file://
  icon: string;
  iconType: IconType;
  tags: string[];
  isLocked: boolean;
  healthStatus: LinkHealthStatus;
  clickCount: number;
  lastCheckedAt?: number;
  snoozeUntil?: number;     // Expirable link TTL timestamp
  isArchived?: boolean;
  previewThumbnail?: string;
  createdAt: number;
}

export interface TreeBookmarkNode {
  id: string;
  name: string;
  url?: string;                 // Present if leaf, undefined if folder
  icon?: string;
  iconType?: IconType;
  children?: TreeBookmarkNode[];// Present if folder
  path: string[];               // Folder hierarchy path used for default tags
  selectionState: CheckboxState;
  addDate?: number;
}

export interface GridPosition {
  x: number; // Column index (0-indexed)
  y: number; // Row index (0-indexed)
  w: number; // Column span
  h: number; // Row span
}

export interface BookmarkCard extends BaseEntity {
  tabId: string;
  description?: string;
  position: GridPosition;
  locks: CardLockMatrix;
  headerStyle: {
    backgroundColor: string;
    textColor: string;
  };
  contentStyle: {
    backgroundColor: string;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    borderColor: string;
  };
  adaptiveFaviconTheme?: boolean;
  badges: CardBadge[];
  bookmarks: Bookmark[];
}

export interface BookmarkTab extends BaseEntity {
  description: string;
  isLocked: boolean;
  userRolePermissions: Record<UserRole, boolean>;
  style: {
    tabNameBackgroundColor: string;
    tabNameTextColor: string;
  };
  cards: BookmarkCard[];
}

```

---

## 4. Security, Lock Matrix, & Privacy/Ownership Architecture

### A. Privacy & Ownership Rules

* **Rule:** Every `BookmarkTab`, `BookmarkCard`, and `Bookmark` inherits from `BaseEntity` (`isPrivate: boolean`, `owner: string`).
* **Visibility Filtering:** An entity with `isPrivate === true` is visible and editable **strictly** when `currentUser.id === entity.owner`. Non-owners receive filtered views that omit private items across grid panels, search, exports, and tree structures.

### B. Hierarchical Lock Matrix

| Lock Scope         | Parameter               | Enforced Constraint / UI Behavior                                                                |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Tab Level**      | `isLocked: true`        | Locks all contained cards/bookmarks; prevents tab rename, reorder, and deletion.                 |
| **Card Self**      | `lockedPosition: true`  | Disables `@dnd-kit` grid dragging for the card.                                                  |
| **Card Self**      | `lockedSize: true`      | Disables card corner/edge resize handles.                                                        |
| **Card Self**      | `lockedName: true`      | Locks card name input inside config modal.                                                       |
| **Card Self**      | `lockedDeletion: true`  | Disables remove card button.                                                                     |
| **Card Bookmark**  | `addable: false`        | Hides `+` header icon; blocks external link drops and paste actions into the card.               |
| **Card Bookmark**  | `removable: false`      | Disables red delete hover icon on all inner bookmarks.                                           |
| **Card Bookmark**  | `editable: false`       | Disables blue edit hover icon on all inner bookmarks.                                            |
| **Card Bookmark**  | `urlEditableOnly: true` | Restricts bookmark edit dialog to the URL field only. (in edition popup, also displays icon, name, and description in read-only mode) |
| **Card Bookmark**  | `reorderable: false`    | Disables dragging bookmarks inside or out of the card.                                           |
| **Bookmark Level** | `isLocked: true`        | Prevents individual bookmark deletion, editing, or moving.                                       |

---

## 5. Grid Physics, Mechanics, & External DnD Integration

### A. Grid Matrix Engine (`useGridPhysics.ts`)

* **Canvas Math:** Grid layout uses dynamic column/row parameters (`nbCols`, `nbRows`).
* **Push Collision Physics:** When dragging a non-locked card over an occupied grid coordinate $(x, y)$, calculate intersection area. If intersection $> 50\%$, push conflicting non-locked cards downward or rightward in real-time to preview the prospective layout.
* **Magnet Snap-To-Top:** When drag completes, sort cards by `y` asc, then `x` asc. Auto-dock cards upward to fill empty vertical gaps.
* **Dynamic Resize Handles:** Corner handles track pointer deltas ($\Delta x, \Delta y$) converting pixel distance into grid spans ($\Delta x \rightarrow \text{colSpan}$, $\Delta y \rightarrow \text{rowSpan}$), constrained between $1 \times 1$ minimum and `nbCols` maximum.

### B. External Drag & Drop & Tree Flattening (`useExternalDnD.ts`)

* **Browser Drop Handling:** Unlocked cards handle native HTML5 drop events (`dragover`, `drop`). Dragging a link from an external browser window or desktop parses `e.dataTransfer.getData('text/uri-list')`. The app auto-fetches name, description, and favicon metadata, assigns `owner: currentUser.id`, and appends the bookmark to the card.
* **Tree-to-Card Flattening:** Dragging or pasting tree nodes (folders/subfolders) onto an unlocked Card flattens the node hierarchy. Only leaf nodes are extracted and added as flat `Bookmark` instances into the card. Folder path lineages (`path: string[]`) automatically map to bookmark `tags`.

---

## 6. Detailed Component Specifications

### A. Icon Renderer Component (`IconRenderer.tsx`)

A universal dynamic icon wrapper executing the following pipeline:

1. **Base64:** `/^data:image\/(png|jpg|jpeg|svg\+xml|webp);base64,/i` $\rightarrow$ Render `<img src={icon} />`.
2. **URL / Local File:** `/^(https?:\/\/|file:\/\/|\/)/i` $\rightarrow$ Render `<img src={icon} loading="lazy" />`.
3. **Emoji:** `/\p{Extended_Pictographic}/u` $\rightarrow$ Render `<span role="img">{icon}</span>`.
4. **Lucide Dynamic Registry:** Match string key against Lucide icon registry. Render matching component or default fallback `<Globe />`.

### B. Tab Bar & Configuration Dialog (`BookmarksTabList.tsx`, `TabConfigDialog.tsx`)

* **Tab Actions:** Reorder tabs via DnD. Display an close icon to the right of the tab name. Define an ADD icon to the right of the tabs group aligned to the left, then define a gear icon aligned to the right of the tabs group that opens the `TabConfigDialog` for editing tab properties.
* **Edit Modal (`TabConfigDialog`):** Edit tab name, description, privacy toggle (`isPrivate`), name background color, and name text color.
* **Lock Badge:** Render visual lock badge if tab is locked.

### C. Card Header, Badges, & Configuration Dialog (`BookmarkCard.tsx`, `CardConfigDialog.tsx`)

* **Card Controls:**
* `+` icon on card header opens `BookmarkDialog` to create a new bookmark (hidden if `bookmarkLocks.addable === false`).
* Edit icon on the right side of the card header opens `CardConfigDialog`.


* **Edit Modal (`CardConfigDialog`):** Modify card name, description, header background color, name text color, content background color, content border style (`solid`, `dashed`, `dotted`), content border color, privacy setting, card-self locks, bookmark-behavior locks, adaptive favicon auto-theming toggle, and manage badges.
* **Badges:** Support multiple badges per card (`name`, `backgroundColor`, `textColor`, `icon`, `iconType`).
* **Inner Search:** Filter bookmarks within the card by name or description.

### D. Bookmark Row Interactivity (`BookmarkItem.tsx`)

* **Hover Actions:** Hovering displays edit (blue icon) and delete (red icon) actions on the right side of the bookmark row (subject to lock permissions).
* **Shortcuts & Actions:**
* Double-click: Open URL in a new tab.
* Multi-select: `Ctrl + Click` selects multiple bookmarks.
* Clipboard: `Ctrl + C` (Copy), `Ctrl + X` (Cut), and `Ctrl + V` (Paste) operate across selected items, tree leaves, and target cards.



### E. Sidebar Right Panel & Chrome Bookmark Tree (`SidebarRightPanel.tsx`, `BookmarkTreeview.tsx`)

* **Import Toolbar:** Toolbar action loads Chrome Netscape HTML files (`<!DOCTYPE NETSCAPE-Bookmark-file-1>`), parses structure into `TreeBookmarkNode[]`, and saves to `useTreeStore.ts`.
* **Tree Controls:** Extended fuzzy search filtering nodes by name or URL.
* **3-State Checkbox Selection:** Supports `checked`, `unchecked`, and `indeterminate` states for folders/subfolders.
* **Transfer Capabilities:** Drag-and-drop or copy/paste selected tree nodes into cards, flattening folder hierarchies into leaf bookmarks with auto-assigned tag paths.
* **Resize & Collapse:** Right panel is resizable on the left edge. Folders can be collapsed/expanded with animated transitions.

### F. Enterprise & UX Features

1. **Link Health Inspector (`useLinkHealth.ts`):** Polls URLs for HTTP 404/500 errors or SSL issues, displaying visual health status badges.
2. **Omni-Search ($Cmd + K$) (`OmniSearchModal.tsx`):** Command palette indexing accessible bookmarks across tabs, cards, tags, and tree structures.
3. **Auto-Metadata Extraction (`useAutoMetadata.ts`):** Auto-fills name, description, favicon, and preview thumbnails when inserting URLs.
4. **Audit Trail & Time Machine (`AuditHistoryModal.tsx`):** Maintains an undo/redo log in Zustand for point-in-time state restoration.
5. **JSON/CSV Import & Export (`exportImport.ts`):** Serializes and deserializes application state with Zod validation.
6. **AI Smart Grouping (`useAiCategorizer.ts`):** Auto-clusters unorganized links into cards based on content domain themes.
7. **Reader View Drawer (`ReaderViewDrawer.tsx`):** Side drawer presenting distraction-free text content for article bookmarks.
8. **Radial Quick-Actions Menu (`RadialContextMenu.tsx`):** Circular context menu on bookmark hover/right-click.
9. **Canvas Marquee Selection (`useMarqueeSelect.ts`):** Rubberband box selection across cards for batch operations.
10. **Magic Link Snapshot & QR Share (`ShareSnapshotModal.tsx`):** Generates view-only sharing links or QR codes for cards or tabs.

---

## 7. Non-Functional Specifications

* **Tailwind CSS v4 Configuration:** Use `@theme` block directives for dynamic CSS variables and layout structures. Define light theme by default, define a custom color palette for adaptive theming, and ensure all components are responsive across breakpoints. Use pastel colors for light mode and muted dark colors for dark mode. Ensure all text meets WCAG 2.1 AA contrast ratios.
* **Accessibility:** Keyboard accessibility (Tab traversal, focus management, Esc keys for modals), ARIA tree roles, dynamic `aria-labels`, and screen-reader support.
* **Performance:** Virtualized rendering for large trees (>5,000 nodes) and React `memo` optimizations on card/item primitives to maintain 60 FPS performance during DnD operations.

---

## 8. Screen Layout in ASCII Art

### Main Application Workspace (Grid Layout & Workspace Panels)

```text
+-------------------------------------------------------------------------------------------------------------------------------+
| 🔖 Enterprise Bookmark Platform | 👤 Jane Doe (Admin) | 🔒 Workspace: Shared Dev | 🟢 Health Engine: Active | 🌙 [Theme] [Zen] |
+-------------------------------------------------------------------------------------------------------------------------------+
| [🔍 Cmd+K Omni-Search...]  | View: [■ Grid | ☰ List | 🖼️ Thumb] | [✨ AI Group] | [📥 Import Chrome] | [📤 Export] | [🔗 Share] |
+-------------------------------------------------------------------------------------------------------------------------------+
|  [Tabs]  [ ⚡ Frontend Stack 🔒 [X]] [ ☁️ Cloud & Infra 👁️ [X]] [ 🎨 Design Systems [X]] [ ➕ New Tab ]            [⚙️ Tab Config]|
+-------------------------------------------------------------+-----------------------------------------------------------------+
| MAIN GRID CANVAS (2D Matrix Physics)                        | RIGHT SIDEBAR PANEL: Chrome Treeview                            |
|                                                             | +-------------------------------------------------------------+ |
| +---------------------------------------------------------+ | | 🔍 Filter Tree nodes...                   [📥 Import HTML]  | |
| | ⠿ 💻 React Ecosystem                [🔒 Pos] [🏷️ Core] | | | +---------------------------------------------------------+ | |
| | [➕] [⚙️ Edit Card]                                     | | | | [☑] 📁 Bookmarks Bar                                    | |
| | +-----------------------------------------------------+ | | | |   ├── [☑] 📁 Work & Engineering                          | |
| | | 🔍 Search bookmarks in card...                      | | | |   │   ├── [☑] 📄 React Docs (react.dev)                     | |
| | +-----------------------------------------------------+ | | | |   │   └── [■] 📁 DevOps (Indeterminate State)             | |
| | | ⚛️ React Docs   https://react.dev        🟢 [✏️] [🗑️] | | | |   │       ├── [☑] 📄 AWS Console                        | |
| | | 🛠️ Vite         https://vite.dev         🟢 [✏️] [🗑️] | | | |   │       └── [☐] 📄 GCP Console                        | |
| | | 🎨 Tailwind CSS https://tailwindcss.com  🟢 [✏️] [🗑️] | | | |   └── [☐] 📁 Personal                                   | |
| | +-----------------------------------------------------+ | | | +---------------------------------------------------------+ |
| |                                                     ◢  | | | 💡 Drag checked nodes or leaves into any unlocked Card.   | |
| +---------------------------------------------------------+ | +-------------------------------------------------------------+ |
|                                                             |                                                                 |
| +---------------------------------------------------------+ |                                                                 |
| | ⠿ ☁️ AWS Services                   [🔒 Size] [🏷️ Ops]  | |                                                                 |
| | [➕] [⚙️ Edit Card]                                     | |                                                                 |
| | +-----------------------------------------------------+ | |                                                                 |
| | | 🔍 Search bookmarks in card...                      | | |                                                                 |
| | +-----------------------------------------------------+ | |                                                                 |
| | | 🟠 EC2 Console  https://console.aws...   🟢 [✏️] [🗑️] | |                                                                 |
| | | 🗄️ S3 Storage   https://s3.console...   🔴 [✏️] [🗑️] | |                                                                 |
| | +-----------------------------------------------------+ | |                                                                 |
| |                                                     ◢  | |                                                                 |
| +---------------------------------------------------------+ |                                                                 |
+-------------------------------------------------------------+-----------------------------------------------------------------+
| 💡 Rubberband Marquee: Click-and-drag across canvas to select multiple cards. Keyboard: [Ctrl+C] Copy | [Ctrl+V] Paste        |
+-------------------------------------------------------------------------------------------------------------------------------+

```

---

### Detailed Bookmark Card Anatomy

```text
+------------------------------------------------------------------------+
| ⠿ 🎨 Design Tokens & UI Specs                       [🔒 Pos] [🔒 Size] | <-- Card Header (Draggable)
| 👤 Owner: j.doe@corp.internal | 🔒 Private                              | <-- Ownership & Privacy Badge
| 🏷️ Badges: [UI/UX] [Figma] [Tokens]                                     | <-- Custom Badges
| [➕ Add Bookmark] [⚙️ Card Config]                                      | <-- Action Controls
+------------------------------------------------------------------------+
| 🔍 Filter inner bookmarks...                                           | <-- In-Card Search
+------------------------------------------------------------------------+
| 🎨 Figma System   https://figma.com/@ds-tokens       🟢 [✏️] [🗑️]     | <-- Healthy Link Row on hover bookmark display description in tooltip
| 📘 Storybook Hub  https://ds.corp.internal/storybook 🔴 [✏️] [🗑️]     | <-- Broken Link Indicator
| 🔤 Google Fonts   https://fonts.google.com           🟢 [✏️] [🗑️]     | <-- Standard Link
| 🔒 Locked Spec    https://internal.doc/specs         🔒 [---]          | <-- Locked Bookmark Item
+------------------------------------------------------------------------+
| 📊 Total Links: 4 | Health: 75% Healthy | Adaptive Theme: Enabled      |
+------------------------------------------------------------------------+
                                                                        ◢ <-- Resize Drag Handle at all 4 corners and 4 edge points (disabled if `lockedSize: true`)

```

---

### Card & Bookmark Security Lock Configuration Dialog (`CardConfigDialog`)

```text
+------------------------------------------------------------------------+
| ⚙️ Configure Card: "Frontend Stack"                                [X] |
+------------------------------------------------------------------------+
| [ General ]  [ Card Self-Locks ]  [ Bookmark Locks ]  [ Appearance ]   |
+------------------------------------------------------------------------+
|                                                                        |
|  CARD SELF-LOCKS (Applies to Card Container):                          |
|  [☑] Lock Position      (Prevents 2D canvas drag & reorder)            |
|  [☑] Lock Size          (Disables bottom-right corner resize handles)  |
|  [☐] Lock Name          (Prevents renaming card title)                 |
|  [☐] Lock Deletion      (Prevents deleting this card)                  |
|                                                                        |
|  BOOKMARK BEHAVIOR LOCKS (Applies to Inner Items):                     |
|  [☑] Allow Adding       (Accepts '+', external drops & pastes)         |
|  [☐] Allow Removing     (Enables red delete button on hover)           |
|  [☑] Allow Editing      (Enables blue edit button on hover)            |
|  [☐] URL Editable Only  (Restricts edits strictly to URL field)        |
|  [☐] Allow Reordering   (Enables drag-and-drop item sorting)           |
|                                                                        |
+------------------------------------------------------------------------+
|                                                   [ Cancel ]  [ Save ] |
+------------------------------------------------------------------------+

```

---

### Omni-Search Overlay Modal ($Cmd + K$)

```text
+------------------------------------------------------------------------+
| 🔍 Search all bookmarks, cards, tags, and tabs... (Esc to close)       |
+------------------------------------------------------------------------+
| Filter: [All] [Tabs] [Cards] [Bookmarks] [Tags] | Scope: [Public & Owned]|
+------------------------------------------------------------------------+
| RESULTS:                                                               |
|                                                                        |
|  ⚛️ React Documentation                                                |
|  Tab: Frontend Stack > Card: React Ecosystem                           |
|  URL: https://react.dev | Tags: #react, #frontend, #docs               |
|                                                                        |
|  🛠️ Vite Build Tool                                                   |
|  Tab: Frontend Stack > Card: React Ecosystem                           |
|  URL: https://vite.dev | Tags: #vite, #bundler                         |
|                                                                        |
|  🟠 AWS EC2 Management Console                                         |
|  Tab: Cloud & Infra > Card: AWS Services                               |
|  URL: https://console.aws.amazon.com/ec2 | Tags: #cloud, #aws, #ops    |
+------------------------------------------------------------------------+
| 🩵 Press [Enter] to open | [Ctrl+C] to copy URL | [Esc] to dismiss     |
+------------------------------------------------------------------------+

```

---

### Hover Context Menu & Reader View Drawer

```text
+----------------------------------+  +---------------------------------------------------+
| ITEM HOVER RADIAL QUICK-MENU     |  | 📖 READER VIEW DRAWER                         [X] |
+----------------------------------+  +---------------------------------------------------+
|                                  |  | ⚛️ React v19 Architecture Overview                 |
|            [📖 Read]             |  | Source: https://react.dev/blog/react-v19          |
|                │                 |  | Reading Time: 4 mins | Snapshot Cached: Today     |
|   [📋 Copy] ── O ── [✏️ Edit]    |  +---------------------------------------------------+
|                │                 |  | React 19 introduces Actions, Server Components,   |
|            [🗑️ Delete]           |  | and asset loading optimizations out of the box... |
|                                  |  |                                                   |
| Triggered via hover or right-click|  | [ 🔊 Read Aloud ]  [ 💾 Save Snapshot ]  [ 🔗 Open ]|
+----------------------------------+  +---------------------------------------------------+

```
