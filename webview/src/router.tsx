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

  const contextStore = useAppContextStore();
  const containers = useLayoutStore((s) => s.containers || []);
  const isDarkMode = contextStore.isDarkMode;
  const setIsDarkMode = contextStore.setIsDarkMode;
  const notification = contextStore.notification;

  // Derive activeFeature directly from location.pathname
  const activeFeature = ROUTE_TO_FEATURE_MAP[location.pathname] || 'feature-home';

  // Sync TanStack Router location -> Zustand store activeFeature
  useEffect(() => {
    if (contextStore.activeFeature !== activeFeature && typeof contextStore.setActiveFeature === 'function') {
      console.info(`[Navigation Debug] TanStack Location ("${location.pathname}") -> Syncing Zustand activeFeature to "${activeFeature}"`);
      contextStore.setActiveFeature(activeFeature);
    }
  }, [activeFeature, contextStore.activeFeature, contextStore.setActiveFeature, location.pathname]);

  // Zustand store activeFeature changes -> TanStack Router location
  useEffect(() => {
    const unsubscribe = useAppContextStore.subscribe((state, prevState) => {
      const newFeature = state.activeFeature;
      if (!newFeature || (prevState && newFeature === prevState.activeFeature)) return;

      const targetPath = getRoutePathForFeature(newFeature);
      const currentPath = router.state.location.pathname;

      if (currentPath !== targetPath) {
        console.info(`[Navigation Debug] Zustand activeFeature ("${newFeature}") -> Navigating TanStack Router to "${targetPath}"`);
        router.navigate({ to: targetPath as any }).catch((err) => {
          console.error(`[Navigation Debug] Navigation error:`, err);
        });
      }
    });

    return unsubscribe;
  }, []);

  const handleSetActiveFeature = (featureId: string) => {
    console.info(`[Navigation Debug] Menu Item Clicked -> featureId: "${featureId}"`);
    if (typeof contextStore.setActiveFeature === 'function') {
      contextStore.setActiveFeature(featureId);
    }

    const targetPath = getRoutePathForFeature(featureId);
    if (location.pathname !== targetPath) {
      console.info(`[Navigation Debug] Navigating TanStack Router to -> "${targetPath}"`);
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
