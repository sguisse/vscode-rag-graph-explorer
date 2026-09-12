---
name: feature-mng
description: Generates or updates a full-stack Webview feature module in Token Razor across webview/src/features/<feature-name>, shared/services/<feature-name>, and backend/src/services/<feature-name>. Enforces declarative UI architecture, shadcn/ui components, CollapsibleCard summary badges, data-tooltip HTML attributes, log-view/utils-log logging wrappers, build-time types in dev-tools/generate-types.json, TanStack router integration, and SidebarLeft menu items.
license: MIT
metadata:
  version: "3.0.0"
  author: token-razor-arch
---

# 🚀 Agent Skill: Feature Management (`feature-mng`)

This skill defines the mandatory protocol, standards, and code blueprints for scaffolding new full-stack feature modules in Token Razor across the **Webview Frontend** (`webview/src/features/<feature-name>`), **Shared Layer** (`shared/services/<feature-name>`), and **Backend Extension Host** (`backend/src/services/<feature-name>`).

---

## 🎯 When to Use This Skill

Use this skill whenever a developer or LLM agent needs to:
- Scaffold a new feature module across Webview, Shared, and Backend layers.
- Add new service endpoints or RPC methods across all required integration points.
- Implement declarative UI components adhering to Token Razor's strict component, layout, logging, and tooltip conventions.

---

## 📐 Declarative Architecture Rules & Requirements

### 1. 🎨 shadcn/ui Component Standard (No HTML Primitives)
- ❌ **NEVER use raw HTML form tags**: `<input>`, `<select>`, `<textarea>`, `<button>`, or `<input type="checkbox">` directly in JSX.
- ✅ **ALWAYS import and use shadcn/ui components** from `@/components/ui/*`:
  - `<Input />` (`@/components/ui/input`)
  - `<Select />`, `<SelectTrigger />`, `<SelectContent />`, `<SelectItem />` (`@/components/ui/select`)
  - `<Checkbox />` (`@/components/ui/checkbox`)
  - `<Switch />` (`@/components/ui/switch`)
  - `<Button />` (`@/components/ui/button`)
  - `<Textarea />` (`@/components/ui/textarea`)
  - `<Badge />`, `<Card />`, `<Dialog />`

### 2. 💬 Tooltip Convention (`data-tooltip`)
- ✅ **ALWAYS use the `data-tooltip` attribute** for tooltips on buttons, badges, icons, or text elements.
- 💡 `data-tooltip` **supports HTML tags/markup** for rich formatting (e.g., `data-tooltip="<strong>Format:</strong> <em>JSON Payload</em>"`).

### 3. 🪵 Logging Conventions
- 🖥️ **Webview Frontend Logging**:
  ```typescript
  import { logInfo, logError, logWarn, logDebug } from '@/services/view/log-view.service.wrapper';

  logInfo('Feature initialized', { featureId: 'home' });
  logError('Failed to execute RPC handler', error);
  ```
  *(Never use raw `console.log` or `console.error` in Webview UI logic).*
- 🔌 **Backend Extension Host Logging**:
  ```typescript
  import { logInfo, logError, logWarn, logDebug } from '../../utils/utils-log';

  logInfo('Executing backend feature task', { payloadId });
  logError('Service execution failed', error);
  ```
  *(Never use raw `console.log` in backend service adapters).*

### 4. 🗂️ Component Grouping with `CollapsibleCard` & Collapsed Summary Badges
- Group related feature configurations using `CollapsibleCard`.
- When collapsed, render interactive status badges via `summaryBadges: BadgeObject[]` (referencing `webview/src/features/exporter/components/OutputFormattingSection.tsx`).

### 5. ⚡ Build-Time Generated Types (`dev-tools/generate-types.json`)
- UI-only enums, options, and model structures must be defined in `dev-tools/generate-types.json` and generated during `npm run generate:code`.

---

## 📂 Multi-Layer Directory Blueprint

```text
├── dev-tools/
│   └── generate-types.json             # Build-time JSON type definitions
│
├── shared/services/<feature-name>/     # Shared Backend-Frontend Contracts
│   ├── model/
│   │   └── <feature>-model.ts
│   ├── port-out/
│   │   └── <feature>-service.port.ts
│   └── index.ts
│
├── backend/src/services/<feature-name>/# Backend Extension Host Adapters
│   ├── <feature>-service.adapter.ts
│   └── index.ts
│
└── webview/src/
    ├── services/api/
    │   └── <feature>-api.service.gen.ts# Auto-generated Webview RPC Client
    └── features/<feature-name>/        # Declarative Webview UI Module
        ├── data/                       # Static templates & mock datasets
        ├── model/                      # UI-only TypeScript interfaces
        │   └── index.ts
        ├── store/                      # Zustand feature store
        │   └── use<Feature>Store.ts
        ├── hooks/                      # Custom hooks for state & handlers
        │   ├── use<Feature>State.ts
        │   └── use<Feature>Handlers.ts
        ├── components/                 # Declarative UI view components
        │   ├── <Feature>Panel.tsx
        │   └── <Feature>Section.tsx    # CollapsibleCard with summaryBadges & data-tooltip
        ├── layout-ctns/                # Regional workspace containers
        │   └── CenterPanelContainer.tsx
        ├── <Feature>Feature.tsx        # Feature root orchestrator
        └── index.ts                    # Feature barrel export
```

---

## 🛠️ Implementation Protocol & Blueprints

### 1. Webview Event & RPC Handlers Hook (`hooks/useHomeHandlers.ts`)

```typescript
import { useCallback } from 'react';
import { useHomeStore } from '../store/useHomeStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';

export function useHomeHandlers() {
  const { setSelectedItemId } = useHomeStore();
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleSelectItem = useCallback((id: string) => {
    logInfo('[HomeHandler] Item selected', { id });
    setSelectedItemId(id);
    setNotification(`Selected item: ${id}`);
  }, [setSelectedItemId, setNotification]);

  const handleRefresh = useCallback(async () => {
    try {
      logInfo('[HomeHandler] Refreshing home context...');
      await vsCodeApiService.copyToClipboard('Home Feature Context');
      setNotification('✅ Home context copied to clipboard');
    } catch (err) {
      logError('[HomeHandler] Failed to execute refresh handler', err);
      setNotification('❌ Failed to execute refresh handler');
    }
  }, [setNotification]);

  return {
    handleSelectItem,
    handleRefresh,
  };
}
```

### 2. Collapsible Section Component with `data-tooltip` & `summaryBadges` (`components/HomeSection.tsx`)

```tsx
import React from 'react';
import { CollapsibleCard, BadgeObject } from '@/components/app/collapsible-card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useHomeState } from '../hooks/useHomeState';

interface HomeSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomeSection({ isOpen, onOpenChange }: HomeSectionProps) {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useHomeState();

  // Summary badges shown when card is collapsed
  const summaryBadges: BadgeObject[] = [
    {
      label: `Tab: ${activeTab.toUpperCase()}`,
      tooltip: '<strong>Active View Mode</strong>: Controls displayed data format',
      className: 'bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20',
      onClick: (e) => {
        e.stopPropagation();
        onOpenChange(true);
      },
    },
    {
      label: searchQuery ? `Query: "${searchQuery}"` : 'No Filter',
      tooltip: '<em>Active search filter parameter</em>',
      className: 'bg-muted text-muted-foreground border-border',
    },
  ];

  return (
    <CollapsibleCard
      id="section-home-config"
      title="🏠 Home Feature Configurations"
      summaryBadges={summaryBadges}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4 p-3 font-mono text-xs">
        {/* Search Input with data-tooltip and shadcn Input */}
        <div className="space-y-1.5">
          <label
            className="text-muted-foreground font-semibold"
            data-tooltip="Enter keywords to filter codebase elements in real-time"
          >
            Search Filter
          </label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type query..."
            className="h-8 font-mono text-xs"
            data-tooltip="<strong>Search Input:</strong> Accepts regex or plain text"
          />
        </div>

        {/* View Select with shadcn Select */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-semibold">View Mode</label>
          <Select value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <SelectTrigger className="h-8 font-mono text-xs" data-tooltip="Select active dashboard view tab">
              <SelectValue placeholder="Select view mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview Dashboard</SelectItem>
              <SelectItem value="metrics">Performance Metrics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleCard>
  );
}
```

### 3. Backend Service Adapter with Logging (`backend/src/services/home/home-service.adapter.ts`)

```typescript
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { IHomeServicePort } from '../../../../shared/services/home/port-out/home-service.port';
import { logInfo, logError } from '../../utils/utils-log';

export class HomeServiceAdapter extends AbstractServiceAdapter implements IHomeServicePort {
  public async getHomeMetrics(): Promise<{ status: string; count: number }> {
    try {
      logInfo('[Backend:HomeAdapter] Fetching home metrics...');
      return { status: 'OK', count: 42 };
    } catch (error) {
      logError('[Backend:HomeAdapter] Failed to fetch home metrics', error);
      throw error;
    }
  }
}
```

---

## 🔗 Router & Sidebar Integration

### 1. Router Setup (`webview/src/router.tsx`)
```typescript
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root-route';
import { HomeFeature } from '@/features/home/HomeFeature';

export const FEATURE_TO_ROUTE_MAP: Record<string, string> = {
  'feature-home': '/home',
};

export const ROUTE_TO_FEATURE_MAP: Record<string, string> = {
  '/home': 'feature-home',
};

export const ROUTE_BREADCRUMB_LABELS: Record<string, string> = {
  '/home': 'Home Dashboard',
};

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  staticData: { breadcrumb: 'Home Dashboard' },
  component: HomeFeature,
});
```

### 2. Sidebar Left Menu Item (`webview/src/_layout/SidebarLeft.tsx`)
```typescript
import { Home as HomeIcon } from 'lucide-react';

export const sidebarMenuItems = [
  {
    id: 'feature-home',
    icon: HomeIcon,
    label: 'Home Dashboard',
    tooltip: '<strong>Home Dashboard</strong><br/>Navigate to main feature overview',
  },
];
```

---

## ⚠️ Checklist & Anti-Patterns

- ❌ **NEVER use raw HTML form tags** (`<input>`, `<select>`, `<button>`). Always use shadcn/ui components from `@/components/ui/*`.
- ❌ **NEVER use raw `console.log`**. Use `logInfo`/`logError` from `@/services/view/log-view.service.wrapper` (Webview) or `../../utils/utils-log` (Backend).
- ❌ **NEVER use standard `title` attributes for tooltips**. Always use `data-tooltip`, which supports rich HTML tags.
- ❌ **NEVER skip `CollapsibleCard` summary badges**. Always define `summaryBadges` for collapsed section feedback.
