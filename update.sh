#!/usr/bin/env bash
set -e

# Ensure workspace and layout hook directories exist
mkdir -p webview/src/_layout
mkdir -p webview/src/features/exporter
mkdir -p webview/src/components/app/container/hooks

# 1. Update useResizable hook to sync internal size state when initialSize prop changes
cat << 'EOF' > webview/src/components/app/container/hooks/use-resizable.ts
import { useState, useCallback, useEffect } from 'react';

export function useResizable(
  initialSize: number,
  minSize: number = 40,
  maxSize: number = 1000,
  isHorizontal: boolean = true,
  reverse: boolean = false
): [number, (e: React.MouseEvent) => void, React.Dispatch<React.SetStateAction<number>>] {
  const [size, setSize] = useState<number>(initialSize);

  // Sync size whenever initialSize prop changes (e.g. via layout configuration overrides)
  useEffect(() => {
    if (initialSize !== undefined && initialSize !== size) {
      setSize(initialSize);
    }
  }, [initialSize]);

  const startResize = useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      const startPosition = isHorizontal ? mouseDownEvent.clientX : mouseDownEvent.clientY;
      const startSize = size;

      const onMouseMove = (mouseMoveEvent: MouseEvent) => {
        const currentPosition = isHorizontal ? mouseMoveEvent.clientX : mouseMoveEvent.clientY;
        const delta = reverse ? startPosition - currentPosition : currentPosition - startPosition;
        const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
        setSize(newSize);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [size, isHorizontal, reverse, minSize, maxSize]
  );

  return [size, startResize, setSize];
}
EOF

# 2. Update LayoutContainer type definitions with explicit size override parameters
cat << 'EOF' > webview/src/_layout/types.ts
import React from 'react';
import { MaximizeScope } from '@/shared/services/graph-rag-explorer/domain/model/types';

export interface MaximizeContainer {
  isMaximizable?: boolean;
  isMaximized?: boolean;
  maximizeScope?: MaximizeScope;
}

export interface LayoutContainer {
  container?: React.ReactNode;
  visible?: boolean;
  isResizable?: boolean;
  isHiddable?: boolean;

  // Named dimension overrides replacing global defaults
  headerHeight?: number;
  sidebarLeftWidth?: number;
  workspaceTopHeight?: number;
  workspaceLeftWidth?: number;
  workspaceRightWidth?: number;
  workspaceBottomHeight?: number;
  sidebarRightWidth?: number;
  footerHeight?: number;

  maximizeContainer?: MaximizeContainer;
}

export interface WorkspaceContainers {
  top?: LayoutContainer;
  left?: LayoutContainer;
  center?: LayoutContainer;
  right?: LayoutContainer;
  bottom?: LayoutContainer;
}

export interface AppLayoutContainers {
  header?: LayoutContainer;
  sidebarLeft?: LayoutContainer;
  workspace?: WorkspaceContainers;
  sidebarRight?: LayoutContainer;
  footer?: LayoutContainer;
}

// Export alias for AppLayoutConfig
export type AppLayoutConfig = AppLayoutContainers;

export interface AppLayoutProps {
  activeFeature?: string;
  setActiveFeature?: (feature: string) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (isDarkMode: boolean) => void;
  notification?: string | null;
  layoutContainers?: AppLayoutContainers;
}
EOF

# 3. Update WorkspaceLayout.tsx to prioritize layout dimension overrides over defaults
cat << 'EOF' > webview/src/_layout/WorkspaceLayout.tsx
import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { useResizable } from '@/components/app/container/hooks/use-resizable';
import { WorkspaceContainers, LayoutContainer } from './types';
import { DefaultContainersSize } from '@/_layout';

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

  const headerHeight = storeC?.headerHeight ?? propC?.headerHeight;
  const sidebarLeftWidth = storeC?.sidebarLeftWidth ?? propC?.sidebarLeftWidth;
  const workspaceTopHeight = storeC?.workspaceTopHeight ?? propC?.workspaceTopHeight;
  const workspaceLeftWidth = storeC?.workspaceLeftWidth ?? propC?.workspaceLeftWidth;
  const workspaceRightWidth = storeC?.workspaceRightWidth ?? propC?.workspaceRightWidth;
  const workspaceBottomHeight = storeC?.workspaceBottomHeight ?? propC?.workspaceBottomHeight;
  const sidebarRightWidth = storeC?.sidebarRightWidth ?? propC?.sidebarRightWidth;
  const footerHeight = storeC?.footerHeight ?? propC?.footerHeight;

  const container = storeC?.container ?? propC?.container;

  return {
    visible,
    isResizable,
    isHiddable,
    headerHeight,
    sidebarLeftWidth,
    workspaceTopHeight,
    workspaceLeftWidth,
    workspaceRightWidth,
    workspaceBottomHeight,
    sidebarRightWidth,
    footerHeight,
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

  const initialTopHeight = topConfig?.workspaceTopHeight ?? DefaultContainersSize.workspaceTopHeight;
  const initialLeftWidth = leftConfig?.workspaceLeftWidth ?? DefaultContainersSize.workspaceLeftWidth;
  const initialRightWidth = rightConfig?.workspaceRightWidth ?? DefaultContainersSize.workspaceRightWidth;
  const initialBottomHeight = bottomConfig?.workspaceBottomHeight ?? DefaultContainersSize.workspaceBottomHeight;

  const [topHeight, startTopResize] = useResizable(initialTopHeight, 40, 1000, false, false);
  const [leftWidth, startLeftResize] = useResizable(initialLeftWidth, 150, 1000, true, false);
  const [rightWidth, startRightResize] = useResizable(initialRightWidth, 150, 1000, true, true);
  const [bottomHeight, startBottomResize] = useResizable(initialBottomHeight, 40, 1000, false, true);

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

    return (
      <div className="flex flex-col flex-1 bg-background p-1 w-full min-w-0 h-full min-h-0 overflow-hidden">
        <div className="flex-1 w-full min-w-0 h-full min-h-0 overflow-auto">
          {targetConfig?.container}
        </div>
      </div>
    );
  }

  const isTopVisible = topConfig?.visible !== false;
  const isLeftVisible = leftConfig?.visible !== false;
  const isCenterVisible = centerConfig?.visible !== false;
  const isRightVisible = rightConfig?.visible !== false;
  const isBottomVisible = bottomConfig?.visible !== false;

  const isMiddleRowVisible = isLeftVisible || isCenterVisible || isRightVisible;

  return (
    <div className="flex flex-col flex-1 bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      {isTopVisible && (
        <ResizableContainer
          id="workspace-top"
          visible
          resizeHandle={topConfig?.isResizable !== false && isMiddleRowVisible ? 'bottom' : 'none'}
          onResizeStart={startTopResize}
          style={isMiddleRowVisible ? { height: `${topHeight}px` } : undefined}
          className={
            isMiddleRowVisible
              ? "border-border border-b"
              : "flex-1 h-full min-h-0 w-full border-border border-b"
          }
        >
          {topConfig?.container}
        </ResizableContainer>
      )}

      {isMiddleRowVisible && (
        <div className="flex flex-1 w-full min-h-0 overflow-hidden">
          {isLeftVisible && (
            <ResizableContainer
              id="workspace-left"
              visible
              resizeHandle={leftConfig?.isResizable !== false && isCenterVisible ? 'right' : 'none'}
              onResizeStart={startLeftResize}
              style={isCenterVisible ? { width: `${leftWidth}px` } : undefined}
              className={
                isCenterVisible
                  ? "border-border border-r shrink-0"
                  : "flex-1 w-full min-w-0 h-full border-border border-r"
              }
            >
              {leftConfig?.container}
            </ResizableContainer>
          )}

          {isCenterVisible && (
            <div id="workspace-center" className="flex flex-col flex-1 border-border min-w-0 h-full overflow-hidden">
              {centerConfig?.container}
            </div>
          )}

          {isRightVisible && (
            <ResizableContainer
              id="workspace-right"
              visible
              resizeHandle={rightConfig?.isResizable !== false && isCenterVisible ? 'left' : 'none'}
              onResizeStart={startRightResize}
              style={isCenterVisible ? { width: `${rightWidth}px` } : undefined}
              className={
                isCenterVisible
                  ? "border-border border-l shrink-0"
                  : "flex-1 w-full min-w-0 h-full border-border border-l"
              }
            >
              {rightConfig?.container}
            </ResizableContainer>
          )}
        </div>
      )}

      {isBottomVisible && (
        <ResizableContainer
          id="workspace-bottom"
          visible
          resizeHandle={bottomConfig?.isResizable !== false && isMiddleRowVisible ? 'top' : 'none'}
          onResizeStart={startBottomResize}
          style={isBottomVisible ? { height: `${bottomHeight}px` } : undefined}
          className={
            isMiddleRowVisible
              ? "border-border border-t"
              : "flex-1 h-full min-h-0 w-full border-border border-t"
          }
        >
          {bottomConfig?.container}
        </ResizableContainer>
      )}
    </div>
  );
}
EOF

# 4. Update ExporterFeature.tsx with workspaceTopHeight: 250 override
cat << 'EOF' > webview/src/features/exporter/ExporterFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';

export function ExporterFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

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
          workspaceTopHeight: 250,
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

echo "✅ fix(layout): Synced size state in useResizable when workspaceTopHeight changes and applied workspaceTopHeight: 250 override!"
