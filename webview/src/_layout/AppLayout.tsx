import React, { useEffect, useState } from 'react';
import { AppLayoutProps, LayoutContainer, AppLayoutContainers, AppLayoutConfig, MaximizeContainer } from './types';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { useResizable } from '@/components/app/container/hooks/use-resizable';
import { Header } from './Header';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { Footer } from './Footer';
import { WorkspaceLayout, mergeContainer } from './WorkspaceLayout';
import { Tooltip } from '@/components/app/tooltip';
import { DefaultContainersSize } from '@/constants/layout-constants';
import { vscodeSettings } from '@/App';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export type { AppLayoutProps, MaximizeContainer, AppLayoutContainers, AppLayoutConfig };

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
    logInfo(`AppLayout: isDarkMode=${isDarkMode}`);
    logInfo(`settings.pinApplication=${vscodeSettings.pinApplication}`);
  }, [isDarkMode]);

  const [sidebarLeftMode, setSidebarLeftMode] = useState<'normal' | 'minimal'>('normal');
  const [sidebarLeftWidth, startSidebarLeftResize] = useResizable(DefaultContainersSize.sidebarLeftWidth, 160, 1000, true, false);
  const [sidebarRightWidth, startSidebarRightResize] = useResizable(DefaultContainersSize.sidebarRightWidth, 180, 1000, true, true);

  const effectiveSidebarLeftWidth = sidebarLeftMode === 'minimal' ? DefaultContainersSize.sidebarLeftMinimizedWidth : sidebarLeftWidth;

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
      <div className="flex flex-col bg-background w-screen h-screen overflow-hidden font-sans text-foreground antialiased">
        <Tooltip delay={300} />
        {headerConfig?.visible !== false && (
          <div id="app-header-container" className="bg-card border-border border-b shrink-0">
            {headerConfig?.container || (
              <Header
                activeFeature={activeFeature}
                setActiveFeature={setActiveFeature}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                notification={notification}
              />
            )}
          </div>
        )}

        <div className="flex flex-col flex-1 bg-background p-1 w-full min-h-0 overflow-hidden">
          <div className="flex-1 w-full min-w-0 h-full min-h-0 overflow-auto">
            {mainMaximizedTarget.config.container}
          </div>
        </div>

        {footerConfig?.visible !== false && (
          <div id="app-footer-container" className="bg-card border-border border-t shrink-0">
            {footerConfig?.container || <Footer />}
          </div>
        )}
      </div>
    );
  }
/*
  useEffect(() => {
    apiService.logMessage('info', 'App.tsx loaded', { timestamp: new Date().toISOString() }).catch((error) => {
      console.error('Failed to log message:', error);
    });
  }, []);
*/
  return (
    <div className="flex flex-col bg-background w-screen h-screen overflow-hidden font-sans text-foreground antialiased">
      <Tooltip delay={300} />
      {headerConfig?.visible !== false && (
        <div id="app-header-container" className="bg-card border-border border-b shrink-0">
          {headerConfig?.container || (
            <Header
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
            className="border-border border-r transition-[width] duration-200"
          >
            {sidebarLeftConfig?.container || (
              <SidebarLeft
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
            className="border-border border-l"
          >
            {sidebarRightConfig?.container || <SidebarRight />}
          </ResizableContainer>
        )}
      </div>

      {footerConfig?.visible !== false && (
        <div id="app-footer-container" className="bg-card border-border border-t shrink-0">
          {footerConfig?.container || <Footer />}
        </div>
      )}
    </div>
  );
}
