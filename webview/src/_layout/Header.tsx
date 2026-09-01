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

        </div>


      {/* Breadcrumb Navigation on Bottom of Existing Div */}
      <div className="flex justify-start items-center gap-1.5 w-full overflow-x-auto font-mono text-[11px] leading-none">
        {canGoBack && (
          <Button
            size="icon"
            variant="ghost"
            className="mr-0.5 w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleGoBack}
            title="Go Back"
          >
            <ArrowLeft size={12} />
          </Button>
        )}

        <button
          onClick={handleHomeClick}
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground cursor-pointer"
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
                <span className="bg-primary/10 px-1.5 py-1 border border-primary/20 rounded font-bold text-primary">
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

      <WorkflowPopup
        side="bottom"
        align="center"
        workflowData={dataWorkflow}
        onSelectStep={handleSelectStep}
        >
        <Button
            variant="outline"
            size="icon"
            className="flex items-center gap-1.5 hover:bg-primary/10 px-2 border-border w-8 h-8 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            data-tooltip="View Pipeline Workflow"
        >
            <Workflow size={13} className="text-primary" />
        </Button>
      </WorkflowPopup>

      <ToolbarSeparator />

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
