#!/usr/bin/env bash
set -e

echo "🚀 Adding breadcrumb navigation interceptor hook & logging across all features..."

# 1. Ensure target directories exist
mkdir -p webview/src/store
mkdir -p webview/src/hooks
mkdir -p webview/src/_layout
mkdir -p webview/src/features/home
mkdir -p webview/src/features/references
mkdir -p webview/src/features/transformer
mkdir -p webview/src/features/install
mkdir -p webview/src/features/rules
mkdir -p webview/src/features/help
mkdir -p webview/src/features/exporter
mkdir -p webview/src/features/ai-workflow-builder
mkdir -p webview/src/features/sdlc/domains/instructions
mkdir -p webview/src/features/sdlc/domains/llm-chat
mkdir -p webview/src/features/sdlc/domains/results-manager
mkdir -p webview/src/features/sdlc/domains/codebase-context
mkdir -p webview/src/features/sdlc/domains/configuration
mkdir -p webview/src/features/layout-demo

# 2. Create Breadcrumb Interceptor Store
cat << 'EOF' > webview/src/store/useBreadcrumbInterceptorStore.ts
import { create } from 'zustand';

export type NavigationActionType = 'back' | 'breadcrumb' | 'home';

export interface NavigationInterceptContext {
  originFeature: string;
  actionType: NavigationActionType;
  destinationPath: string;
}

export type BreadcrumbInterceptorFn = (
  ctx: NavigationInterceptContext
) => string | boolean | void | Promise<string | boolean | void>;

interface BreadcrumbInterceptorState {
  interceptor: BreadcrumbInterceptorFn | null;
  originFeature: string | null;
  registerInterceptor: (originFeature: string, fn: BreadcrumbInterceptorFn) => void;
  unregisterInterceptor: () => void;
}

export const useBreadcrumbInterceptorStore = create<BreadcrumbInterceptorState>((set) => ({
  interceptor: null,
  originFeature: null,
  registerInterceptor: (originFeature, fn) => set({ originFeature, interceptor: fn }),
  unregisterInterceptor: () => set({ originFeature: null, interceptor: null }),
}));
EOF

# 3. Create Custom Hook `useBreadcrumbNavigation`
cat << 'EOF' > webview/src/hooks/useBreadcrumbNavigation.ts
import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useBreadcrumbInterceptorStore, NavigationInterceptContext } from '@/store/useBreadcrumbInterceptorStore';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function useBreadcrumbNavigation(
  originFeature: string,
  customHandler?: (
    ctx: NavigationInterceptContext,
    navigate: ReturnType<typeof useNavigate>
  ) => string | boolean | void | Promise<string | boolean | void>
) {
  const navigate = useNavigate();
  const registerInterceptor = useBreadcrumbInterceptorStore((s) => s.registerInterceptor);
  const unregisterInterceptor = useBreadcrumbInterceptorStore((s) => s.unregisterInterceptor);

  const handleIntercept = useCallback(
    async (ctx: NavigationInterceptContext) => {
      logInfo(
        `[Breadcrumb Intercept] Origin Feature: "${originFeature}" | Action: "${ctx.actionType}" | Target Destination: "${ctx.destinationPath}"`
      );

      if (customHandler) {
        return await customHandler(ctx, navigate);
      }
    },
    [originFeature, customHandler, navigate]
  );

  useEffect(() => {
    registerInterceptor(originFeature, handleIntercept);
    return () => {
      unregisterInterceptor();
    };
  }, [originFeature, handleIntercept, registerInterceptor, unregisterInterceptor]);

  return { navigate };
}
EOF

# 4. Update Header.tsx to execute feature interceptors on navigation actions
cat << 'EOF' > webview/src/_layout/Header.tsx
import React from 'react';
import { useMatches, useNavigate } from '@tanstack/react-router';
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

  // TanStack Router hooks
  const matches = useMatches();
  const navigate = useNavigate();

  const breadcrumbs = matches
    .filter((match) => match.staticData && (match.staticData as any).breadcrumb)
    .map((match) => ({
      pathname: match.pathname,
      label: (match.staticData as any).breadcrumb as string,
      search: match.search,
    }));

  const canGoBack = matches.length > 2 || (matches.length > 1 && matches[matches.length - 1].pathname !== '/');

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
        navigate({ to: redirectPath as any });
        return;
      } else if (redirectPath === false) {
        return;
      }
    }

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
        navigate({ to: redirectPath as any, search: search || {} });
        return;
      } else if (redirectPath === false) {
        return;
      }
    }

    navigate({ to: pathname, search: search || {} } as any);
  };

  const handleGoBack = async () => {
    const origin = registeredOrigin || activeFeature || 'unknown-feature';
    const prevMatch = matches.length >= 2 ? matches[matches.length - 2] : null;
    const targetPath = prevMatch ? prevMatch.pathname : '/';

    logInfo(`[Navigation Action] Back button clicked in Origin Feature: "${origin}" -> Target: "${targetPath}"`);

    if (interceptor) {
      const redirectPath = await interceptor({
        originFeature: origin,
        actionType: 'back',
        destinationPath: targetPath,
      });

      if (typeof redirectPath === 'string') {
        navigate({ to: redirectPath as any });
        return;
      } else if (redirectPath === false) {
        return;
      }
    }

    window.history.back();
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
      {/* Existing Top Row inside Center Content */}
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

        {/* Centered Workflow Button & Reusable Component Popup */}
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

      {/* Breadcrumb Navigation on Bottom of Existing Div */}
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

        <button
          onClick={handleHomeClick}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
          title="Navigate to Home"
        >
          <Home size={12} />
        </button>

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.pathname}-${idx}`}>
              <ChevronRight size={11} className="text-muted-foreground shrink-0" />
              {isLast ? (
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

# 5. Inject `useBreadcrumbNavigation` into HomeFeature.tsx
cat << 'EOF' > webview/src/features/home/HomeFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function HomeFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-home');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default HomeFeature;
EOF

# 6. Inject `useBreadcrumbNavigation` into ReferencesFeature.tsx
cat << 'EOF' > webview/src/features/references/ReferencesFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function ReferencesFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-references');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ReferencesFeature;
EOF

# 7. Inject `useBreadcrumbNavigation` into TransformerFeature.tsx
cat << 'EOF' > webview/src/features/transformer/TransformerFeature.tsx
import React, { useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTransformer } from './hooks/use-transformer';
import { TransformationScopeType, ReferenceFileInfo } from './components/TransformationScopePanel';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { BottomPanelContainer } from './layout-ctns/BottomPanelContainer';
import { TransformerWorkflow } from '@/shared/services/transform-content/model/transform-content-model';
import { TransformerSearch } from '@/router';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export interface TransformerFeatureProps {
  initialScope?: TransformationScopeType;
  initialReferenceFileInfo?: ReferenceFileInfo;
  initialWorkflow?: TransformerWorkflow;
  onSaveWorkflow?: (workflow: TransformerWorkflow) => void;
  onCloseFeature?: () => void;
}

export function TransformerFeature({
  initialScope,
  initialReferenceFileInfo,
  initialWorkflow,
  onSaveWorkflow,
  onCloseFeature,
}: TransformerFeatureProps = {}) {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const navigate = useNavigate();

  useBreadcrumbNavigation('feature-transformer');

  const searchParams = useSearch({ strict: false }) as TransformerSearch;

  const effectiveScope = (searchParams?.scope as TransformationScopeType) || initialScope || 'Default';
  const effectiveRefInfo: ReferenceFileInfo | undefined = searchParams?.fileName
    ? {
        fileName: searchParams.fileName,
        filePath: searchParams.filePath,
        language: searchParams.language,
      }
    : initialReferenceFileInfo;

  const handleReturnToReferences = (actionType: 'Validated & Saved' | 'Closed') => {
    if (onCloseFeature) {
      onCloseFeature();
    } else {
      navigate({
        to: '/references',
        search: {
          updatedAt: Date.now(),
          updatedFile: effectiveRefInfo?.fileName || 'Reference Document',
          sourceAction: actionType,
        },
      });
    }
  };

  const {
    scope,
    setScope,
    referenceFileInfo,
    isDirty,
    handleValidate,
    inputText,
    setInputText,
    workflowJsonText,
    setWorkflowJsonText,
    workflowParseError,
    parsedWorkflow,
    pipelineResult,
    handleCopyOutput,
    updateOutputTemplate,
    updateOutputFormat,
    templateCursorPos,
    setTemplateCursorPos,
    insertVariableIntoTemplate,
  } = useTransformer({
    initialScope: effectiveScope,
    initialReferenceFileInfo: effectiveRefInfo,
    initialWorkflow,
    onSaveWorkflow: (wf) => {
      onSaveWorkflow?.(wf);
      handleReturnToReferences('Validated & Saved');
    },
    onCloseFeature: () => handleReturnToReferences('Closed'),
  });

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          container: (
            <TopPanelContainer
              scope={scope}
              onScopeChange={setScope}
              referenceFileInfo={referenceFileInfo}
              isDirty={isDirty}
              onValidate={handleValidate}
              onClose={() => handleReturnToReferences('Closed')}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
          workspaceTopHeight: 70,
        },
        left: {
          visible: true,
          container: (
            <LeftPanelContainer
              inputText={inputText}
              setInputText={setInputText}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: (
            <CenterPanelContainer
              workflowJsonText={workflowJsonText}
              setWorkflowJsonText={setWorkflowJsonText}
              workflowParseError={workflowParseError}
              parsedWorkflow={parsedWorkflow}
              onSelectVariable={insertVariableIntoTemplate}
            />
          ),
          isResizable: false,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: (
            <RightPanelContainer
              renderedOutput={pipelineResult.renderedOutput}
              outputFormat={parsedWorkflow.outputFormat}
              outputTemplate={parsedWorkflow.outputTemplate}
              records={pipelineResult.records}
              onCopy={handleCopyOutput}
              onUpdateOutputTemplate={updateOutputTemplate}
              onUpdateOutputFormat={updateOutputFormat}
              templateCursorPos={templateCursorPos}
              setTemplateCursorPos={setTemplateCursorPos}
              onSelectVariable={insertVariableIntoTemplate}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          container: <BottomPanelContainer metrics={pipelineResult.metrics} />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: { visible: false, isResizable: true, isHiddable: true },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [
    setLayoutContainers,
    scope,
    setScope,
    referenceFileInfo,
    isDirty,
    handleValidate,
    inputText,
    setInputText,
    workflowJsonText,
    setWorkflowJsonText,
    workflowParseError,
    parsedWorkflow,
    pipelineResult,
    handleCopyOutput,
    updateOutputTemplate,
    updateOutputFormat,
    templateCursorPos,
    setTemplateCursorPos,
    insertVariableIntoTemplate,
  ]);

  return null;
}

export default TransformerFeature;
EOF

# 8. Inject `useBreadcrumbNavigation` into InstallFeature.tsx
cat << 'EOF' > webview/src/features/install/InstallFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function InstallFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-install');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default InstallFeature;
EOF

# 9. Inject `useBreadcrumbNavigation` into RulesFeature.tsx
cat << 'EOF' > webview/src/features/rules/RulesFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function RulesFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-rules');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default RulesFeature;
EOF

# 10. Inject `useBreadcrumbNavigation` into HelpFeature.tsx
cat << 'EOF' > webview/src/features/help/HelpFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function HelpFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-help');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default HelpFeature;
EOF

# 11. Inject `useBreadcrumbNavigation` into ExporterFeature.tsx
cat << 'EOF' > webview/src/features/exporter/ExporterFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function ExporterFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-exporter');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          container: <TopPanelContainer />,
          isResizable: true,
          isHiddable: true,
          workspaceTopHeight: 78,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ExporterFeature;
EOF

# 12. Inject `useBreadcrumbNavigation` into WorkflowBuilderFeature.tsx
cat << 'EOF' > webview/src/features/ai-workflow-builder/WorkflowBuilderFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function WorkflowBuilderFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-ai-workflow-builder');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isHiddable: true,
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
          isHiddable: true,
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default WorkflowBuilderFeature;
EOF

# 13. Inject `useBreadcrumbNavigation` into InstructionsFeature.tsx
cat << 'EOF' > webview/src/features/sdlc/domains/instructions/InstructionsFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '@/features/sdlc/components/SdlcSidebarMenu';
import { LeftPanelContainer } from './containers/LeftPanelContainer';
import { RightPanelContainer } from './containers/RightPanelContainer';
import { CenterPanelContainer } from './containers/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function InstructionsFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-instructions');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: {
        visible: true,
        container: <SdlcSidebarMenu />,
        isResizable: true,
        isHiddable: true,
      },
      workspace: {
        top: { visible: false },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' as const },
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default InstructionsFeature;
EOF

# 14. Inject `useBreadcrumbNavigation` into LlmFeature.tsx
cat << 'EOF' > webview/src/features/sdlc/domains/llm-chat/LlmFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '@/features/sdlc/components/SdlcSidebarMenu';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function LlmFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-llm-chat');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: {
        visible: true,
        container: <SdlcSidebarMenu />,
        isResizable: true,
        isHiddable: true,
      },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' as const },
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default LlmFeature;
EOF

# 15. Inject `useBreadcrumbNavigation` into ResultsManagerFeature.tsx
cat << 'EOF' > webview/src/features/sdlc/domains/results-manager/ResultsManagerFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function ResultsManagerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-results-manager');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: false,
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ResultsManagerFeature;
EOF

# 16. Inject `useBreadcrumbNavigation` into CodebaseContextFeature.tsx
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/CodebaseContextFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { SidebarRightContainer } from './layout-ctns/SidebarRightContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function CodebaseContextFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-codebase-context');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      workspace: {
        top: {
          visible: true,
          container: <TopPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isResizable: false,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: { visible: false }
      },
      sidebarRight: {
        visible: false,
        isResizable: true,
        isHiddable: true,
        container: <SidebarRightContainer />,
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default CodebaseContextFeature;
EOF

# 17. Inject `useBreadcrumbNavigation` into ConfigurationFeature.tsx
cat << 'EOF' > webview/src/features/sdlc/domains/configuration/ConfigurationFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function ConfigurationFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-configuration');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: false,
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ConfigurationFeature;
EOF

# 18. Inject `useBreadcrumbNavigation` into LayoutDemoFeature.tsx
cat << 'EOF' > webview/src/features/layout-demo/LayoutDemoFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { defaultLayoutContainersContent } from '@/features/layout-demo/default-layout-containers-content';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function LayoutDemoFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-layout-demo');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: true, container: defaultLayoutContainersContent.top, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
        left: { visible: true, container: defaultLayoutContainersContent.left, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Workspace' } },
        center: { visible: true, container: defaultLayoutContainersContent.center, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
        right: { visible: true, container: defaultLayoutContainersContent.right, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
        bottom: { visible: true, container: defaultLayoutContainersContent.bottom, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
      },
      sidebarRight: { visible: true, container: defaultLayoutContainersContent.sidebarRight, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default LayoutDemoFeature;
EOF

# 19. Verify compilation
echo "⚡ Compiling project to verify build integrity..."
npm run build

echo "✅ feat(breadcrumb): Successfully registered breadcrumb navigation interceptor handlers and logInfo telemetry across all application features!"
