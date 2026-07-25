#!/usr/bin/env bash
set -e

echo "🚀 Fixing maximization visibility checks and isHiddable propagation in AppLayout and WorkspaceLayout..."

mkdir -p src/store
mkdir -p src/components/app/layout

# 1. Update useLayoutStore.ts: automatically clear isMaximized when visibility is set to false
cat << 'EOF' > src/store/useLayoutStore.ts
import React from 'react';
import { create } from 'zustand';
import { AppLayoutContainers, LayoutContainer } from '../components/app/layout/types';

export interface LayoutStoreState {
  containers: AppLayoutContainers;

  setLayoutContainers: (containers: AppLayoutContainers) => void;
  setContainerVisible: (keyPath: string, visible: boolean) => void;
  toggleContainerVisible: (keyPath: string) => void;
  setContainerContent: (keyPath: string, content: React.ReactNode) => void;
  setContainerMaximized: (keyPath: string, isMaximized: boolean) => void;
  toggleContainerMaximized: (keyPath: string) => void;
  resetContainers: () => void;
}

export const defaultLayoutContainers: AppLayoutContainers = {
  header: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
  sidebarLeft: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
  workspace: {
    top: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
    left: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    center: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
    right: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
    bottom: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
  },
  sidebarRight: { visible: false, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
  footer: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
};

function setByPath(obj: any, path: string, updater: (c: LayoutContainer) => LayoutContainer): any {
  const parts = path.split('.');
  const cloned = { ...obj };

  let current = cloned;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    current[key] = { ...current[key] };
    current = current[key];
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = updater(current[lastKey] || {});
  return cloned;
}

export const useLayoutStore = create<LayoutStoreState>((set) => ({
  containers: defaultLayoutContainers,

  setLayoutContainers: (containers) => set({ containers }),

  setContainerVisible: (path, visible) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        visible,
        maximizeContainer: {
          ...c.maximizeContainer,
          // Reset maximization state when hiding
          isMaximized: visible ? c.maximizeContainer?.isMaximized : false,
        },
      })),
    })),

  toggleContainerVisible: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => {
        const nextVisible = !c.visible;
        return {
          ...c,
          visible: nextVisible,
          maximizeContainer: {
            ...c.maximizeContainer,
            isMaximized: nextVisible ? c.maximizeContainer?.isMaximized : false,
          },
        };
      }),
    })),

  setContainerContent: (path, container) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({ ...c, container })),
    })),

  setContainerMaximized: (path, isMaximized) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        maximizeContainer: {
          ...c.maximizeContainer,
          isMaximized,
        },
      })),
    })),

  toggleContainerMaximized: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => {
        if (c.maximizeContainer?.isMaximizable === false) {
          return c;
        }
        return {
          ...c,
          maximizeContainer: {
            ...c.maximizeContainer,
            isMaximized: !c.maximizeContainer?.isMaximized,
          },
        };
      }),
    })),

  resetContainers: () => set({ containers: defaultLayoutContainers }),
}));
EOF

# 2. Update ContainerPanelHeader.tsx: ensure strict boolean check for isHiddable
cat << 'EOF' > src/components/app/layout/ContainerPanelHeader.tsx
import React from 'react';
import { Maximize2, Minimize2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeftCenterRightPanel } from '../left-center-right-panel';
import { useLayoutStore } from '@/store/useLayoutStore';

export interface ContainerPanelHeaderProps {
  id?: string;
  title?: React.ReactNode;
  path?: string;
  isMaximized?: boolean;
  isMaximizable?: boolean;
  isHiddable?: boolean;
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export function ContainerPanelHeader({
  id,
  title,
  path,
  isMaximized,
  isMaximizable = true,
  isHiddable = true,
  headerLeft,
  headerCenter,
  headerRight,
  className,
}: ContainerPanelHeaderProps) {
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setContainerVisible = useLayoutStore((s) => s.setContainerVisible);

  const computedLeft = headerLeft || (
    typeof title === 'string' ? (
      <span className="font-semibold uppercase tracking-wider truncate">{title}</span>
    ) : (
      title
    )
  );

  const computedRight = (
    <div className="flex items-center gap-1">
      {headerRight}
      {isMaximizable && path && (
        <Button
          id={`btn-maximize-${path.replace(/\./g, '-')}`}
          variant="ghost"
          size="icon-xs"
          onClick={() => toggleContainerMaximized(path)}
          className="w-5 h-5 text-muted-foreground hover:text-foreground shrink-0"
          data-tooltip={isMaximized ? "Restore Panel Size" : "Maximize Panel"}
        >
          {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </Button>
      )}
      {isHiddable && path && (
        <Button
          id={`btn-hide-${path.replace(/\./g, '-')}`}
          variant="ghost"
          size="icon-xs"
          onClick={() => setContainerVisible(path, false)}
          className="w-5 h-5 text-muted-foreground hover:text-foreground shrink-0"
          data-tooltip="Hide Panel"
        >
          <EyeOff size={12} />
        </Button>
      )}
    </div>
  );

  return (
    <LeftCenterRightPanel
      id={id || (path ? `header-${path.replace(/\./g, '-')}` : 'container-panel-header')}
      className={`px-3 h-7 bg-muted/30 border-b border-border text-[10px] font-mono text-muted-foreground select-none shrink-0 ${className || ''}`}
      left={computedLeft}
      center={headerCenter}
      right={computedRight}
    />
  );
}
EOF

# 3. Update WorkspaceLayout.tsx: ensure visible !== false check for workspace scope maximization
cat << 'EOF' > src/components/app/layout/WorkspaceLayout.tsx
import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ResizableContainer } from '../container/resizable-container';
import { useResizable } from '../container/hooks/use-resizable';
import { WorkspaceContainers, LayoutContainer } from './types';
import { ContainerPanelHeader } from './ContainerPanelHeader';

interface WorkspaceLayoutProps {
  containers?: WorkspaceContainers;
}

export const mergeContainer = (storeC?: LayoutContainer, propC?: LayoutContainer): LayoutContainer => {
  const isMaximized = storeC?.maximizeContainer?.isMaximized ?? propC?.maximizeContainer?.isMaximized ?? false;
  const isMaximizable = propC?.maximizeContainer?.isMaximizable ?? storeC?.maximizeContainer?.isMaximizable ?? true;
  const maximizeScope = propC?.maximizeContainer?.maximizeScope ?? storeC?.maximizeContainer?.maximizeScope ?? 'Main';
  const visible = storeC?.visible ?? propC?.visible ?? true;
  const isResizable = storeC?.isResizable ?? propC?.isResizable ?? true;
  const isHiddable = storeC?.isHiddable ?? propC?.isHiddable ?? true;
  const container = storeC?.container ?? propC?.container;

  return {
    visible,
    isResizable,
    isHiddable,
    container,
    maximizeContainer: {
      isMaximized,
      isMaximizable,
      maximizeScope,
    },
  };
};

export function WorkspaceLayout({ containers: propContainers }: WorkspaceLayoutProps) {
  const storeWorkspace = useLayoutStore((s) => s.containers.workspace);

  const topConfig = mergeContainer(storeWorkspace?.top, propContainers?.top);
  const leftConfig = mergeContainer(storeWorkspace?.left, propContainers?.left);
  const centerConfig = mergeContainer(storeWorkspace?.center, propContainers?.center);
  const rightConfig = mergeContainer(storeWorkspace?.right, propContainers?.right);
  const bottomConfig = mergeContainer(storeWorkspace?.bottom, propContainers?.bottom);

  const mergedContainers = {
    top: topConfig,
    left: leftConfig,
    center: centerConfig,
    right: rightConfig,
    bottom: bottomConfig,
  };

  const [topHeight, startTopResize] = useResizable(50, 30, 200, false, false);
  const [leftWidth, startLeftResize] = useResizable(280, 150, 600, true, false);
  const [rightWidth, startRightResize] = useResizable(300, 150, 600, true, true);
  const [bottomHeight, startBottomResize] = useResizable(100, 40, 400, false, true);

  const workspaceKeys = ['top', 'left', 'center', 'right', 'bottom'] as const;

  const isWorkspaceScopeMaximized = (c?: LayoutContainer) =>
    Boolean(
      c?.visible !== false &&
      c?.maximizeContainer?.isMaximizable !== false &&
      c?.maximizeContainer?.isMaximized &&
      c?.maximizeContainer?.maximizeScope === 'Workspace'
    );

  const maximizedKey = workspaceKeys.find((key) => isWorkspaceScopeMaximized(mergedContainers[key]));

  if (maximizedKey) {
    const targetConfig = mergedContainers[maximizedKey];
    const titleMap: Record<typeof workspaceKeys[number], string> = {
      top: 'Workspace Top Section',
      left: 'Workspace Left Panel',
      center: 'Workspace Center Panel',
      right: 'Workspace Right Panel',
      bottom: 'Workspace Bottom Panel',
    };

    return (
      <div className="flex-1 w-full h-full p-1 bg-background flex flex-col min-w-0 min-h-0 overflow-hidden">
        <ContainerPanelHeader
          title={`${titleMap[maximizedKey]} (Maximized - Workspace Scope)`}
          path={`workspace.${maximizedKey}`}
          isMaximized={targetConfig?.maximizeContainer?.isMaximized}
          isMaximizable={targetConfig?.maximizeContainer?.isMaximizable}
          isHiddable={targetConfig?.isHiddable}
        />
        <div className="flex-1 w-full h-full min-w-0 min-h-0 overflow-auto">
          {targetConfig?.container || (
            <div className="p-4 font-mono text-xs text-muted-foreground flex items-center justify-center h-full">
              Maximized {titleMap[maximizedKey]} Content
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden bg-background">
      {topConfig?.visible !== false && (
        <ResizableContainer
          id="workspace-top"
          visible
          resizeHandle={topConfig?.isResizable !== false ? 'bottom' : 'none'}
          onResizeStart={startTopResize}
          style={{ height: `${topHeight}px` }}
          className="border-b border-border"
        >
          <ContainerPanelHeader
            title="Workspace Top"
            path="workspace.top"
            isMaximized={topConfig?.maximizeContainer?.isMaximized}
            isMaximizable={topConfig?.maximizeContainer?.isMaximizable}
            isHiddable={topConfig?.isHiddable}
          />
          <div className="flex-1 min-w-0 h-full overflow-auto">
            {topConfig?.container || (
              <div className="p-2 text-xs font-mono text-muted-foreground">Workspace Top Panel</div>
            )}
          </div>
        </ResizableContainer>
      )}

      <div className="flex flex-1 w-full min-h-0 overflow-hidden">
        {leftConfig?.visible !== false && (
          <ResizableContainer
            id="workspace-left"
            visible
            resizeHandle={leftConfig?.isResizable !== false ? 'right' : 'none'}
            onResizeStart={startLeftResize}
            style={{ width: `${leftWidth}px` }}
            className="border-r border-border"
          >
            <ContainerPanelHeader
              title="Workspace Left"
              path="workspace.left"
              isMaximized={leftConfig?.maximizeContainer?.isMaximized}
              isMaximizable={leftConfig?.maximizeContainer?.isMaximizable}
              isHiddable={leftConfig?.isHiddable}
            />
            <div className="flex-1 min-w-0 h-full overflow-auto">
              {leftConfig?.container || (
                <div className="p-2 text-xs font-mono text-muted-foreground">Workspace Left Panel</div>
              )}
            </div>
          </ResizableContainer>
        )}

        {centerConfig?.visible !== false && (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden border-border">
            <ContainerPanelHeader
              title="Workspace Center"
              path="workspace.center"
              isMaximized={centerConfig?.maximizeContainer?.isMaximized}
              isMaximizable={centerConfig?.maximizeContainer?.isMaximizable}
              isHiddable={centerConfig?.isHiddable}
            />
            <div className="flex-1 min-w-0 h-full overflow-auto">
              {centerConfig?.container || (
                <div className="flex-1 flex items-center justify-center p-4 text-sm font-mono text-muted-foreground">
                  Workspace Center (Main Content Area)
                </div>
              )}
            </div>
          </div>
        )}

        {rightConfig?.visible !== false && (
          <ResizableContainer
            id="workspace-right"
            visible
            resizeHandle={rightConfig?.isResizable !== false ? 'left' : 'none'}
            onResizeStart={startRightResize}
            style={{ width: `${rightWidth}px` }}
            className="border-l border-border"
          >
            <ContainerPanelHeader
              title="Workspace Right"
              path="workspace.right"
              isMaximized={rightConfig?.maximizeContainer?.isMaximized}
              isMaximizable={rightConfig?.maximizeContainer?.isMaximizable}
              isHiddable={rightConfig?.isHiddable}
            />
            <div className="flex-1 min-w-0 h-full overflow-auto">
              {rightConfig?.container || (
                <div className="p-2 text-xs font-mono text-muted-foreground">Workspace Right Panel</div>
              )}
            </div>
          </ResizableContainer>
        )}
      </div>

      {bottomConfig?.visible !== false && (
        <ResizableContainer
          id="workspace-bottom"
          visible
          resizeHandle={bottomConfig?.isResizable !== false ? 'top' : 'none'}
          onResizeStart={startBottomResize}
          style={{ height: `${bottomHeight}px` }}
          className="border-t border-border"
        >
          <ContainerPanelHeader
            title="Workspace Bottom"
            path="workspace.bottom"
            isMaximized={bottomConfig?.maximizeContainer?.isMaximized}
            isMaximizable={bottomConfig?.maximizeContainer?.isMaximizable}
            isHiddable={bottomConfig?.isHiddable}
          />
          <div className="flex-1 min-w-0 h-full overflow-auto">
            {bottomConfig?.container || (
              <div className="p-2 text-xs font-mono text-muted-foreground">Workspace Bottom Panel</div>
            )}
          </div>
        </ResizableContainer>
      )}
    </div>
  );
}
EOF

# 4. Update AppLayout.tsx: pass isHiddable when rendering mainMaximizedTarget
cat << 'EOF' > src/components/app/layout/AppLayout.tsx
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
EOF

echo "✅ fix: Corrected isHiddable propagation in AppLayout maximized mode and ensured hiding unmaximizes containers safely!"
echo "💡 To test and compile: cd sandbox && npm run compile"
