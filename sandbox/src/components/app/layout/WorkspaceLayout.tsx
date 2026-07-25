import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ResizableContainer } from '../container/resizable-container';
import { useResizable } from '../container/hooks/use-resizable';
import { WorkspaceContainers, LayoutContainer } from './types';

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

  const [topHeight, startTopResize] = useResizable(80, 40, 300, false, false);
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

    return (
      <div className="flex-1 w-full h-full p-1 bg-background flex flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-1 w-full h-full min-w-0 min-h-0 overflow-auto">
          {targetConfig?.container}
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
          {topConfig?.container}
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
            {leftConfig?.container}
          </ResizableContainer>
        )}

        {centerConfig?.visible !== false && (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden border-border">
            {centerConfig?.container}
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
            {rightConfig?.container}
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
          {bottomConfig?.container}
        </ResizableContainer>
      )}
    </div>
  );
}
