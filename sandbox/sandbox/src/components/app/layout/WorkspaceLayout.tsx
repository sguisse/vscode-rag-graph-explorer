import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ResizableContainer } from '../container/resizable-container';
import { useResizable } from '../container/hooks/use-resizable';
import { WorkspaceContainers, LayoutContainer } from './types';
import { WorkspacePanelHeader } from './WorkspacePanelHeader';

interface WorkspaceLayoutProps {
  containers?: WorkspaceContainers;
}

const mergeContainer = (storeC?: LayoutContainer, propC?: LayoutContainer): LayoutContainer => ({
  ...storeC,
  ...propC,
  maximizeContainer: {
    ...storeC?.maximizeContainer,
    ...propC?.maximizeContainer,
  },
});

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
    Boolean(c?.maximizeContainer?.isMaximized && c?.maximizeContainer?.maximizeScope === 'Workspace');

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
        <WorkspacePanelHeader
          title={`${titleMap[maximizedKey]} (Maximized - Workspace Scope)`}
          path={`workspace.${maximizedKey}`}
          isMaximized={targetConfig?.maximizeContainer?.isMaximized}
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
          <WorkspacePanelHeader
            title="Workspace Top"
            path="workspace.top"
            isMaximized={topConfig?.maximizeContainer?.isMaximized}
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
            <WorkspacePanelHeader
              title="Workspace Left"
              path="workspace.left"
              isMaximized={leftConfig?.maximizeContainer?.isMaximized}
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
            <WorkspacePanelHeader
              title="Workspace Center"
              path="workspace.center"
              isMaximized={centerConfig?.maximizeContainer?.isMaximized}
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
            <WorkspacePanelHeader
              title="Workspace Right"
              path="workspace.right"
              isMaximized={rightConfig?.maximizeContainer?.isMaximized}
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
          <WorkspacePanelHeader
            title="Workspace Bottom"
            path="workspace.bottom"
            isMaximized={bottomConfig?.maximizeContainer?.isMaximized}
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
