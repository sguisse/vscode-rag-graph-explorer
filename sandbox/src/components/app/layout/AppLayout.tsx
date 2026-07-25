import React, { useEffect, useState } from 'react';
import { AppLayoutProps, LayoutContainer } from './types';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ResizableContainer } from '../container/resizable-container';
import { useResizable } from '../container/hooks/use-resizable';
import { AppHeader } from './AppHeader';
import { AppSidebarLeft } from './AppSidebarLeft';
import { AppSidebarRight } from './AppSidebarRight';
import { AppFooter } from './AppFooter';
import { WorkspaceLayout, mergeContainer } from './WorkspaceLayout';
import { ContainerPanelHeader } from './ContainerPanelHeader';
import { Tooltip } from '../tooltip';

export type { AppLayoutProps, MaximizeContainer } from './types';

export function AppLayout({
  layoutContainers,
  activeFeature: activeFeatureProp,
  setActiveFeature: setActiveFeatureProp,
  isDarkMode: isDarkModeProp,
  setIsDarkMode: setIsDarkModeProp,
  notification: notificationProp,
}: AppLayoutProps) {
  const storeContainers = useLayoutStore((s) => s.containers);
  const storeActiveFeature = useAppContextStore((s) => s.activeFeature);
  const setActiveFeatureStore = useAppContextStore((s) => s.setActiveFeature);
  const storeIsDarkMode = useAppContextStore((s) => s.isDarkMode);
  const setIsDarkModeStore = useAppContextStore((s) => s.setIsDarkMode);
  const storeNotification = useAppContextStore((s) => s.notification);

  const activeFeature = activeFeatureProp ?? storeActiveFeature;
  const setActiveFeature = setActiveFeatureProp ?? setActiveFeatureStore;
  const isDarkMode = isDarkModeProp ?? storeIsDarkMode;
  const setIsDarkMode = setIsDarkModeProp ?? setIsDarkModeStore;
  const notification = notificationProp ?? storeNotification;

  const headerConfig = mergeContainer(storeContainers.header, layoutContainers?.header);
  const sidebarLeftConfig = mergeContainer(storeContainers.sidebarLeft, layoutContainers?.sidebarLeft);
  const workspaceConfig = {
    top: mergeContainer(storeContainers.workspace?.top, layoutContainers?.workspace?.top),
    left: mergeContainer(storeContainers.workspace?.left, layoutContainers?.workspace?.left),
    center: mergeContainer(storeContainers.workspace?.center, layoutContainers?.workspace?.center),
    right: mergeContainer(storeContainers.workspace?.right, layoutContainers?.workspace?.right),
    bottom: mergeContainer(storeContainers.workspace?.bottom, layoutContainers?.workspace?.bottom),
  };
  const sidebarRightConfig = mergeContainer(storeContainers.sidebarRight, layoutContainers?.sidebarRight);
  const footerConfig = mergeContainer(storeContainers.footer, layoutContainers?.footer);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');
  }, [isDarkMode]);

  const [sidebarLeftMode, setSidebarLeftMode] = useState<'normal' | 'minimal'>('normal');
  const [sidebarLeftWidth, startSidebarLeftResize] = useResizable(220, 160, 450, true, false);
  const [sidebarRightWidth, startSidebarRightResize] = useResizable(260, 180, 500, true, true);

  const effectiveSidebarLeftWidth = sidebarLeftMode === 'minimal' ? 56 : sidebarLeftWidth;

  const isMainScopeMaximized = (c?: LayoutContainer) =>
    Boolean(
      c?.visible !== false &&
      c?.maximizeContainer?.isMaximizable !== false &&
      c?.maximizeContainer?.isMaximized &&
      (c?.maximizeContainer?.maximizeScope || 'Main') === 'Main'
    );

  const mainMaximizedTarget =
    isMainScopeMaximized(sidebarLeftConfig) ? { title: 'Sidebar Left', path: 'sidebarLeft', config: sidebarLeftConfig } :
    isMainScopeMaximized(sidebarRightConfig) ? { title: 'Sidebar Right Inspector', path: 'sidebarRight', config: sidebarRightConfig } :
    isMainScopeMaximized(workspaceConfig.top) ? { title: 'Workspace Top Section', path: 'workspace.top', config: workspaceConfig.top } :
    isMainScopeMaximized(workspaceConfig.left) ? { title: 'Workspace Left Panel', path: 'workspace.left', config: workspaceConfig.left } :
    isMainScopeMaximized(workspaceConfig.center) ? { title: 'Workspace Center Panel', path: 'workspace.center', config: workspaceConfig.center } :
    isMainScopeMaximized(workspaceConfig.right) ? { title: 'Workspace Right Panel', path: 'workspace.right', config: workspaceConfig.right } :
    isMainScopeMaximized(workspaceConfig.bottom) ? { title: 'Workspace Bottom Panel', path: 'workspace.bottom', config: workspaceConfig.bottom } :
    null;

  if (mainMaximizedTarget) {
    return (
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-background text-foreground antialiased font-sans">
        <Tooltip delay={300} />
        {headerConfig?.visible !== false && (
          <div id="app-header-container" className="shrink-0 border-b border-border bg-card">
            {headerConfig?.container || (
              <AppHeader
                activeFeature={activeFeature}
                setActiveFeature={setActiveFeature}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                notification={notification}
              />
            )}
          </div>
        )}

        <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col p-1 bg-background">
          <ContainerPanelHeader
            title={`${mainMaximizedTarget.title} (Maximized - Main Scope)`}
            path={mainMaximizedTarget.path}
            isMaximized={mainMaximizedTarget.config.maximizeContainer?.isMaximized}
            isMaximizable={mainMaximizedTarget.config.maximizeContainer?.isMaximizable}
            isHiddable={mainMaximizedTarget.config.isHiddable}
          />
          <div className="flex-1 w-full h-full min-w-0 min-h-0 overflow-auto">
            {mainMaximizedTarget.config.container || (
              <div className="p-4 font-mono text-xs text-muted-foreground flex items-center justify-center h-full">
                Maximized {mainMaximizedTarget.title} Content
              </div>
            )}
          </div>
        </div>

        {footerConfig?.visible !== false && (
          <div id="app-footer-container" className="shrink-0 border-t border-border bg-card">
            {footerConfig?.container || <AppFooter />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      <Tooltip delay={300} />
      {headerConfig?.visible !== false && (
        <div id="app-header-container" className="shrink-0 border-b border-border bg-card">
          {headerConfig?.container || (
            <AppHeader
              activeFeature={activeFeature}
              setActiveFeature={setActiveFeature}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              notification={notification}
            />
          )}
        </div>
      )}

      <div className="flex flex-1 w-full min-h-0 overflow-hidden">
        {sidebarLeftConfig?.visible !== false && (
          <ResizableContainer
            id="app-sidebar-left"
            visible
            resizeHandle={
              sidebarLeftConfig?.isResizable !== false && sidebarLeftMode === 'normal'
                ? 'right'
                : 'none'
            }
            onResizeStart={startSidebarLeftResize}
            style={{ width: `${effectiveSidebarLeftWidth}px` }}
            className="border-r border-border transition-[width] duration-200"
          >
            {sidebarLeftConfig?.container || (
              <AppSidebarLeft
                activeFeature={activeFeature}
                setActiveFeature={setActiveFeature}
                sidebarLeftMode={sidebarLeftMode}
                setSidebarLeftMode={setSidebarLeftMode}
                sidebarLeftWidth={sidebarLeftWidth}
              />
            )}
          </ResizableContainer>
        )}

        <WorkspaceLayout containers={workspaceConfig} />

        {sidebarRightConfig?.visible !== false && (
          <ResizableContainer
            id="app-sidebar-right"
            visible
            resizeHandle={sidebarRightConfig?.isResizable !== false ? 'left' : 'none'}
            onResizeStart={startSidebarRightResize}
            style={{ width: `${sidebarRightWidth}px` }}
            className="border-l border-border"
          >
            {sidebarRightConfig?.container || <AppSidebarRight />}
          </ResizableContainer>
        )}
      </div>

      {footerConfig?.visible !== false && (
        <div id="app-footer-container" className="shrink-0 border-t border-border bg-card">
          {footerConfig?.container || <AppFooter />}
        </div>
      )}
    </div>
  );
}
