#!/usr/bin/env bash
set -e

echo "🚀 Implementing dynamic navigation history stack trail for breadcrumbs in Header.tsx..."

# 1. Ensure target directories exist
mkdir -p webview/src/store
mkdir -p webview/src/_layout
mkdir -p webview/src

# 2. Create Breadcrumb History Stack Store
cat << 'EOF' > webview/src/store/useBreadcrumbHistoryStore.ts
import { create } from 'zustand';

export interface BreadcrumbStackItem {
  pathname: string;
  label: string;
  search?: Record<string, any>;
}

interface BreadcrumbHistoryState {
  stack: BreadcrumbStackItem[];
  pushRoute: (item: BreadcrumbStackItem, isLinkedTransition?: boolean) => void;
  popTo: (pathname: string) => void;
  resetTo: (item: BreadcrumbStackItem) => void;
}

const HOME_ITEM: BreadcrumbStackItem = { pathname: '/', label: 'Home' };

export const useBreadcrumbHistoryStore = create<BreadcrumbHistoryState>((set) => ({
  stack: [HOME_ITEM],

  pushRoute: (newItem, isLinkedTransition = false) => {
    set((state) => {
      // 1. If navigating to Home, reset stack to Home
      if (newItem.pathname === '/') {
        return { stack: [HOME_ITEM] };
      }

      // 2. Check if pathname already exists in current stack
      const existingIdx = state.stack.findIndex((s) => s.pathname === newItem.pathname);
      if (existingIdx !== -1) {
        // Unwind stack to existing item
        const updated = state.stack.slice(0, existingIdx + 1);
        updated[existingIdx] = newItem; // update search params
        return { stack: updated };
      }

      // 3. If linked transition (e.g. References -> Transformer)
      if (isLinkedTransition) {
        return { stack: [...state.stack, newItem] };
      }

      // 4. Top-level section change: Replace stack with [Home, newItem]
      return { stack: [HOME_ITEM, newItem] };
    });
  },

  popTo: (pathname) => {
    set((state) => {
      const idx = state.stack.findIndex((s) => s.pathname === pathname);
      if (idx !== -1) {
        return { stack: state.stack.slice(0, idx + 1) };
      }
      return state;
    });
  },

  resetTo: (item) => {
    set({ stack: item.pathname === '/' ? [HOME_ITEM] : [HOME_ITEM, item] });
  },
}));
EOF

# 3. Update router.tsx to synchronize route transitions with useBreadcrumbHistoryStore
cat << 'EOF' > webview/src/router.tsx
import React, { useEffect } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { AppLayout } from '@/_layout/AppLayout';

// Feature Component Imports
import { HomeFeature } from '@/features/home/HomeFeature';
import { ReferencesFeature } from '@/features/references/ReferencesFeature';
import { TransformerFeature } from '@/features/transformer/TransformerFeature';
import { InstallFeature } from '@/features/install/InstallFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { WorkflowBuilderFeature } from '@/features/ai-workflow-builder/WorkflowBuilderFeature';
import { ExporterFeature } from '@/features/exporter/ExporterFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import ExplorerOldFeature from '@/features/explorer-old/ExplorerOldFeature';
import { InstructionsFeature } from '@/features/sdlc/domains/instructions';
import { ConfigurationFeature } from '@/features/sdlc/domains/configuration';
import { ResultsManagerFeature } from '@/features/sdlc/domains/results-manager';
import { CodebaseContextFeature } from '@/features/sdlc/domains/codebase-context';
import LlmFeature from '@/features/sdlc/domains/llm-chat/LlmFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';

import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useBreadcrumbHistoryStore } from '@/store/useBreadcrumbHistoryStore';

// Search payload types
export interface ReferencesSearch {
  updatedAt?: number;
  updatedFile?: string;
  sourceAction?: string;
}

export interface TransformerSearch {
  scope?: 'Default' | 'Selected file context' | 'Reference file';
  fileName?: string;
  filePath?: string;
  language?: string;
  fromFeature?: string;
}

// Explicit Feature ID <-> Route Path Mapping Table
const FEATURE_TO_ROUTE_MAP: Record<string, string> = {
  'feature-home': '/',
  'feature-references': '/references',
  'feature-transformer': '/transformer',
  'feature-install': '/install',
  'feature-rules': '/rules',
  'feature-impact': '/rules',
  'feature-ai-workflow-builder': '/workflow-builder',
  'feature-exporter': '/exporter',
  'feature-codebase-exporter': '/exporter',
  'feat-prompt': '/exporter',
  'feature-help': '/help',
  'feature-configuration': '/configuration',
  'feat-configuration': '/configuration',
  'feature-codebase-context': '/codebase-context',
  'feature-graph-explorer': '/codebase-context',
  'feature-skeleton': '/codebase-context',
  'feature-instructions': '/instructions',
  'feature-llm-chat': '/llm-chat',
  'feature-results-manager': '/results-manager',
  'feat-history': '/results-manager',
  'feature-old-explorer': '/old-explorer',
  'feature-layout-demo': '/layout-demo',
};

const ROUTE_TO_FEATURE_MAP: Record<string, string> = {
  '/': 'feature-home',
  '/references': 'feature-references',
  '/transformer': 'feature-transformer',
  '/install': 'feature-install',
  '/rules': 'feature-rules',
  '/workflow-builder': 'feature-ai-workflow-builder',
  '/exporter': 'feature-exporter',
  '/help': 'feature-help',
  '/configuration': 'feature-configuration',
  '/codebase-context': 'feature-codebase-context',
  '/instructions': 'feature-instructions',
  '/llm-chat': 'feature-llm-chat',
  '/results-manager': 'feature-results-manager',
  '/old-explorer': 'feature-old-explorer',
  '/layout-demo': 'feature-layout-demo',
};

export const ROUTE_BREADCRUMB_LABELS: Record<string, string> = {
  '/': 'Home',
  '/references': 'Project References',
  '/transformer': 'Transformer Engine',
  '/install': 'Installation & Health',
  '/rules': 'Impact Rules',
  '/workflow-builder': 'Workflow Builder',
  '/exporter': 'Codebase Exporter',
  '/help': 'Documentation',
  '/configuration': 'Configuration',
  '/codebase-context': 'Codebase Context',
  '/instructions': 'SDLC Instructions',
  '/llm-chat': 'LLM Chat',
  '/results-manager': 'Results Manager',
  '/old-explorer': 'Legacy Explorer',
  '/layout-demo': 'Layout Demo',
};

export function getRoutePathForFeature(featureId: string): string {
  if (!featureId) return '/';
  const cleanId = String(featureId).trim();

  if (FEATURE_TO_ROUTE_MAP[cleanId]) {
    return FEATURE_TO_ROUTE_MAP[cleanId];
  }

  if (cleanId === 'feature-home' || cleanId === 'home') {
    return '/';
  }

  const slug = cleanId.replace(/^feature-|^feat-/, '');
  return `/${slug}`;
}

// Root Layout Shell Component
const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const navigate = useNavigate();

  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const setIsDarkMode = useAppContextStore((s) => s.setIsDarkMode);
  const notification = useAppContextStore((s) => s.notification);
  const containers = useLayoutStore((s) => s.containers || []);

  const activeFeature = ROUTE_TO_FEATURE_MAP[location.pathname] || 'feature-home';

  // 1. Synchronize Route transition to Breadcrumb History Stack
  useEffect(() => {
    const label = ROUTE_BREADCRUMB_LABELS[location.pathname] || 'Feature';
    const isLinkedTransition = Boolean(
      (location.search as any)?.fromFeature || location.pathname === '/transformer'
    );

    useBreadcrumbHistoryStore.getState().pushRoute(
      { pathname: location.pathname, label, search: location.search },
      isLinkedTransition
    );
  }, [location.pathname, location.search]);

  // 2. Silent non-cyclic sync: Update Zustand store activeFeature
  useEffect(() => {
    const currentStoreFeature = useAppContextStore.getState().activeFeature;
    if (currentStoreFeature !== activeFeature) {
      useAppContextStore.setState({ activeFeature });
    }
  }, [activeFeature, location.pathname]);

  // 3. Global subscriber for store activeFeature mutations
  useEffect(() => {
    const unsubscribe = useAppContextStore.subscribe((state) => {
      const targetFeature = state.activeFeature;
      if (!targetFeature) return;

      const targetPath = getRoutePathForFeature(targetFeature);
      const currentPath = router.state.location.pathname;

      if (currentPath !== targetPath) {
        router.navigate({ to: targetPath as any }).catch((err) => {
          console.error(`[Navigation Debug] Router navigation failed:`, err);
        });
      }
    });

    return unsubscribe;
  }, []);

  // Handle menu item / sidebar selection
  const handleSetActiveFeature = (featureId: string) => {
    const targetPath = getRoutePathForFeature(featureId);
    if (location.pathname !== targetPath) {
      console.info(`[Navigation Debug] Menu Item Clicked: "${featureId}" -> Navigating to "${targetPath}"`);
      navigate({ to: targetPath as any }).catch((err) => {
        console.error(`[Navigation Debug] Navigation error:`, err);
      });
    }
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">
      {/* Active Route Workspace Content */}
      <div className="flex-1 min-h-0 relative">
        <Outlet />
      </div>

      {/* App Layout Shell */}
      {AppLayout && (
        <AppLayout
          activeFeature={activeFeature}
          setActiveFeature={handleSetActiveFeature}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          notification={notification}
          layoutContainers={containers}
        />
      )}
    </div>
  );
}

// Declare All 15 Feature Routes
export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  staticData: { breadcrumb: 'Home' },
  component: HomeFeature,
});

export const referencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/references',
  staticData: { breadcrumb: 'Project References' },
  validateSearch: (search: Record<string, unknown>): ReferencesSearch => ({
    updatedAt: search.updatedAt ? Number(search.updatedAt) : undefined,
    updatedFile: (search.updatedFile as string) || undefined,
    sourceAction: (search.sourceAction as string) || undefined,
  }),
  component: ReferencesFeature,
});

export const transformerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transformer',
  staticData: { breadcrumb: 'Transformer Engine' },
  validateSearch: (search: Record<string, unknown>): TransformerSearch => ({
    scope: (search.scope as any) || 'Default',
    fileName: (search.fileName as string) || undefined,
    filePath: (search.filePath as string) || undefined,
    language: (search.language as string) || undefined,
    fromFeature: (search.fromFeature as string) || undefined,
  }),
  component: TransformerFeature,
});

export const installRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/install',
  staticData: { breadcrumb: 'Installation & Health' },
  component: InstallFeature,
});

export const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules',
  staticData: { breadcrumb: 'Impact Rules' },
  component: RulesFeature,
});

export const workflowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workflow-builder',
  staticData: { breadcrumb: 'Workflow Builder' },
  component: WorkflowBuilderFeature,
});

export const exporterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exporter',
  staticData: { breadcrumb: 'Codebase Exporter' },
  component: ExporterFeature,
});

export const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  staticData: { breadcrumb: 'Documentation' },
  component: HelpFeature,
});

export const configurationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuration',
  staticData: { breadcrumb: 'Configuration' },
  component: ConfigurationFeature,
});

export const codebaseContextRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/codebase-context',
  staticData: { breadcrumb: 'Codebase Context' },
  component: CodebaseContextFeature,
});

export const instructionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/instructions',
  staticData: { breadcrumb: 'SDLC Instructions' },
  component: InstructionsFeature,
});

export const llmChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/llm-chat',
  staticData: { breadcrumb: 'LLM Chat' },
  component: LlmFeature,
});

export const resultsManagerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/results-manager',
  staticData: { breadcrumb: 'Results Manager' },
  component: ResultsManagerFeature,
});

export const oldExplorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/old-explorer',
  staticData: { breadcrumb: 'Legacy Explorer' },
  component: ExplorerOldFeature,
});

export const layoutDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/layout-demo',
  staticData: { breadcrumb: 'Layout Demo' },
  component: LayoutDemoFeature,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  referencesRoute,
  transformerRoute,
  installRoute,
  rulesRoute,
  workflowRoute,
  exporterRoute,
  helpRoute,
  configurationRoute,
  codebaseContextRoute,
  instructionsRoute,
  llmChatRoute,
  resultsManagerRoute,
  oldExplorerRoute,
  layoutDemoRoute,
]);

// Memory history for Webview environment compatibility
export const memoryHistory = createMemoryHistory({
  initialEntries: ['/'],
});

export const router = createRouter({
  routeTree,
  history: memoryHistory,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
EOF

# 4. Update Header.tsx to render breadcrumbs from useBreadcrumbHistoryStore stack
cat << 'EOF' > webview/src/_layout/Header.tsx
import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import { headerLeftWidth, DefaultContainersSize } from '@/_layout';
import {
  Layers,
  Moon,
  Sun,
  CheckCircle2,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  PanelLeftOpen,
  PanelRightOpen,
  Workflow,
  ChevronRight,
  Home,
  ArrowLeft,
} from 'lucide-react';
import { PanelCenter } from '@/components/app/core/icons/PanelCenter';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { ToggleButton } from '@/components/app/toggle-button';
import { useLayoutStore } from '@/store/useLayoutStore';
import logoLight from '@assets/logo-light.png';
import logoDark from '@assets/logo-dark.png';
import { ApplicationTitle } from '@/components/app/ApplicationTitle';
import { WorkflowPopup } from '@/components/app/workflow/workflow-popup';
import { useExplorerWorkflow } from '@/features/explorer-old/workflow/hooks/use-explorer-workflow';
import { Button } from '@/components/ui/button';
import { useBreadcrumbInterceptorStore } from '@/store/useBreadcrumbInterceptorStore';
import { useBreadcrumbHistoryStore } from '@/store/useBreadcrumbHistoryStore';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface HeaderProps {
  activeFeature: string;
  setActiveFeature?: (feature: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  notification?: string | null;
}

export function Header({
  activeFeature,
  isDarkMode,
  setIsDarkMode,
  notification,
}: HeaderProps) {
  const toggleContainerVisible = useLayoutStore((s) => s.toggleContainerVisible);
  const containers = useLayoutStore((s) => s.containers);
  const headerHeight = containers.header?.headerHeight ?? DefaultContainersSize.headerHeight;
  const { dataWorkflow, handleSelectStep } = useExplorerWorkflow();

  const interceptor = useBreadcrumbInterceptorStore((s) => s.interceptor);
  const registeredOrigin = useBreadcrumbInterceptorStore((s) => s.originFeature);

  // Read actual navigation history stack from store
  const breadcrumbStack = useBreadcrumbHistoryStore((s) => s.stack);
  const popTo = useBreadcrumbHistoryStore((s) => s.popTo);

  const navigate = useNavigate();

  const canGoBack = breadcrumbStack.length > 1;

  const handleHomeClick = async () => {
    const origin = registeredOrigin || activeFeature || 'feature-home';
    const targetPath = '/';

    logInfo(`[Navigation Action] Home clicked in Origin Feature: "${origin}" -> Target: "${targetPath}"`);

    if (interceptor) {
      const redirectPath = await interceptor({
        originFeature: origin,
        actionType: 'home',
        destinationPath: targetPath,
      });

      if (typeof redirectPath === 'string') {
        popTo(redirectPath);
        navigate({ to: redirectPath as any });
        return;
      } else if (redirectPath === false) {
        return;
      }
    }

    popTo('/');
    navigate({ to: '/' });
  };

  const handleBreadcrumbClick = async (pathname: string, search: any) => {
    const origin = registeredOrigin || activeFeature || 'unknown-feature';

    logInfo(`[Navigation Action] Breadcrumb clicked in Origin Feature: "${origin}" -> Target: "${pathname}"`);

    if (interceptor) {
      const redirectPath = await interceptor({
        originFeature: origin,
        actionType: 'breadcrumb',
        destinationPath: pathname,
      });

      if (typeof redirectPath === 'string') {
        popTo(redirectPath);
        navigate({ to: redirectPath as any, search: search || {} });
        return;
      } else if (redirectPath === false) {
        return;
      }
    }

    popTo(pathname);
    navigate({ to: pathname, search: search || {} } as any);
  };

  const handleGoBack = async () => {
    const origin = registeredOrigin || activeFeature || 'unknown-feature';
    const prevItem = breadcrumbStack.length >= 2 ? breadcrumbStack[breadcrumbStack.length - 2] : null;
    const targetPath = prevItem ? prevItem.pathname : '/';

    logInfo(`[Navigation Action] Back button clicked in Origin Feature: "${origin}" -> Target: "${targetPath}"`);

    if (interceptor) {
      const redirectPath = await interceptor({
        originFeature: origin,
        actionType: 'back',
        destinationPath: targetPath,
      });

      if (typeof redirectPath === 'string') {
        popTo(redirectPath);
        navigate({ to: redirectPath as any });
        return;
      } else if (redirectPath === false) {
        return;
      }
    }

    if (prevItem) {
      popTo(prevItem.pathname);
      navigate({ to: prevItem.pathname, search: prevItem.search || {} } as any);
    } else {
      window.history.back();
    }
  };

  const leftContent = (
    <div id="app-logo-title" className="flex items-center gap-2">
      <span id="app-logo" className="w-5 h-5">
        <img src={isDarkMode ? logoDark : logoLight} alt="App Logo" className="w-full h-full object-contain" />
      </span>
      <span id="app-title" className="font-bold text-foreground text-sm tracking-tight">
        <ApplicationTitle label="Token Ra$or" />
      </span>
    </div>
  );

  const centerContent = (
    <div className="flex flex-col justify-center items-center gap-1 w-full min-w-0">
      {/* Top Row inside Center Content */}
      <div className="flex flex-1 justify-between items-center gap-2 w-full">
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ paddingLeft: `${DefaultContainersSize.sidebarLeftWidth - headerLeftWidth}px` }}>
            <ToggleButton
              id="toggle-sidebar-left"
              isSelected={!!containers.sidebarLeft?.visible}
              onToggle={() => toggleContainerVisible('sidebarLeft')}
              tooltipText="Toggle Sidebar Left"
              icon={<Layers size={14} />}
            />
          </span>
          <span id="active-feature" className="bg-primary/15 px-2 py-0.5 rounded font-semibold text-[10px] text-primary">
            {activeFeature}
          </span>
        </div>

        {/* Centered Workflow Button */}
        <div className="flex flex-1 justify-center items-center">
          <WorkflowPopup
            side="bottom"
            align="center"
            workflowData={dataWorkflow}
            onSelectStep={handleSelectStep}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 hover:bg-primary/10 px-2.5 border-border h-6 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              data-tooltip="View Pipeline Workflow"
            >
              <Workflow size={13} className="text-primary" />
              <span className="font-semibold text-[11px]">Workflow</span>
            </Button>
          </WorkflowPopup>
        </div>

        <div className="w-24 shrink-0" />
      </div>

      {/* Dynamic Navigation History Breadcrumb */}
      <div className="flex items-center justify-center gap-1.5 w-full overflow-x-auto text-[11px] font-mono leading-none">
        {canGoBack && (
          <Button
            size="icon"
            variant="ghost"
            className="w-5 h-5 mr-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleGoBack}
            title="Go Back"
          >
            <ArrowLeft size={12} />
          </Button>
        )}

        {breadcrumbStack.map((crumb, idx) => {
          const isLast = idx === breadcrumbStack.length - 1;
          const isHome = crumb.pathname === '/';

          return (
            <React.Fragment key={`${crumb.pathname}-${idx}`}>
              {idx > 0 && <ChevronRight size={11} className="text-muted-foreground shrink-0" />}
              {isHome ? (
                <button
                  onClick={handleHomeClick}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                  title="Navigate to Home"
                >
                  <Home size={12} />
                </button>
              ) : isLast ? (
                <span className="font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={() => handleBreadcrumbClick(crumb.pathname, crumb.search)}
                  className="text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-0.5">
      {notification && (
        <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded text-[11px] text-emerald-500">
          <CheckCircle2 size={12} />
          <span>{notification}</span>
        </div>
      )}

      <ToggleButton
        id="toggle-theme-mode"
        isSelected={isDarkMode}
        onToggle={() => setIsDarkMode(!isDarkMode)}
        tooltipText={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        icon={isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
      />

      <ToolbarSeparator />

      <ToggleButton
        id="toggle-sidebar-left-02"
        isSelected={!!containers.sidebarLeft?.visible}
        onToggle={() => toggleContainerVisible('sidebarLeft')}
        tooltipText="Toggle Sidebar Left"
        icon={<PanelLeft size={14} />}
      />

      <ToolbarSeparator orientation="HORIZONTAL" />

      <ToggleButton
        id="toggle-wkp-top"
        isSelected={!!containers.workspace?.top?.visible}
        onToggle={() => toggleContainerVisible('workspace.top')}
        tooltipText="Toggle Workspace Top"
        icon={<PanelTop size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-left"
        isSelected={!!containers.workspace?.left?.visible}
        onToggle={() => toggleContainerVisible('workspace.left')}
        tooltipText="Toggle Workspace Left"
        icon={<PanelLeftOpen size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-center"
        isSelected={!!containers.workspace?.center?.visible}
        onToggle={() => toggleContainerVisible('workspace.center')}
        tooltipText="Toggle Workspace Center"
        icon={<PanelCenter size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-right"
        isSelected={!!containers.workspace?.right?.visible}
        onToggle={() => toggleContainerVisible('workspace.right')}
        tooltipText="Toggle Workspace Right"
        icon={<PanelRightOpen size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-bottom"
        isSelected={!!containers.workspace?.bottom?.visible}
        onToggle={() => toggleContainerVisible('workspace.bottom')}
        tooltipText="Toggle Workspace Bottom"
        icon={<PanelBottom size={14} />}
      />

      <ToolbarSeparator orientation="HORIZONTAL" />

      <ToggleButton
        id="toggle-sidebar-right"
        isSelected={!!containers.sidebarRight?.visible}
        onToggle={() => toggleContainerVisible('sidebarRight')}
        tooltipText="Toggle Sidebar Right"
        icon={<PanelRight size={14} />}
      />
    </div>
  );

  return (
    <LeftCenterRightPanel
      id="app-header-panel"
      className="bg-secondary/80 px-2 border-border border-b h-12 font-mono text-foreground text-xs select-none"
      style={{ height: `${headerHeight}px` }}
      left={leftContent}
      center={centerContent}
      right={rightContent}
    />
  );
}
EOF

# 5. Build project to verify compilation
echo "⚡ Compiling project..."
npm run build

echo "✅ feat(breadcrumb): Implemented full dynamic navigation history stack trail in Header breadcrumbs!"
