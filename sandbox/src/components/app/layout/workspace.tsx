import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { LayoutVisibilityActions } from './hooks/use-layout-state';

export interface WorkspaceProps {
  isCtnWorkspaceVisible: boolean;
  workspaceLayoutConfig: {
    showCtnWkpTop?: boolean;
    showCtnWkpLeft?: boolean;
    showCtnWkpCenter?: boolean;
    showCtnWkpRight?: boolean;
    showCtnWkpBottom?: boolean;
  };
  isCtnWorkspaceTopVisible: boolean;
  ctnWorkspaceTopHeight: number;
  startCtnWorkspaceTopResize: (e: React.MouseEvent) => void;
  workspaceContainers: {
    top?: React.ReactNode;
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    bottom?: React.ReactNode;
  };
  headers: {
    leftPanelTitle?: string;
    centerPanelHeader?: React.ReactNode;
    centerPanelHeaderCenter?: React.ReactNode;
    centerPanelHeaderRight?: React.ReactNode;
  };
  isCtnWorkspaceLeftVisible: boolean;
  activeMiddlePanelsCount: number;
  ctnWorkspaceLeftWidth: number;
  activeView: string;
  startCtnWorkspaceLeftResize: (e: React.MouseEvent) => void;
  isCtnWorkspaceCenterVisible: boolean;
  isCtnWorkspaceCenterMaximized: boolean;
  isCurrentlyResizing: boolean;
  isDraggingSidebarLeft: boolean;
  isDraggingSidebarRight: boolean;
  isDraggingLeftPane: boolean;
  isDraggingRightPane: boolean;
  isCtnWorkspaceRightVisible: boolean;
  ctnWorkspaceRightWidth: number;
  startCtnWorkspaceRightResize: (e: React.MouseEvent) => void;
  isCtnWorkspaceBottomVisible: boolean;
  ctnWorkspaceBottomHeight: number;
  startCtnWorkspaceBottomResize: (e: React.MouseEvent) => void;
  actions: LayoutVisibilityActions;
}

export function Workspace({
  isCtnWorkspaceVisible,
  workspaceLayoutConfig: wkpLayoutConfig,
  isCtnWorkspaceTopVisible,
  ctnWorkspaceTopHeight,
  startCtnWorkspaceTopResize,
  workspaceContainers: wkpContainers,
  headers,
  isCtnWorkspaceLeftVisible,
  activeMiddlePanelsCount,
  ctnWorkspaceLeftWidth,
  activeView,
  startCtnWorkspaceLeftResize,
  isCtnWorkspaceCenterVisible,
  isCtnWorkspaceCenterMaximized,
  isCurrentlyResizing,
  isDraggingSidebarLeft,
  isDraggingSidebarRight,
  isDraggingLeftPane,
  isDraggingRightPane,
  isCtnWorkspaceRightVisible,
  ctnWorkspaceRightWidth,
  startCtnWorkspaceRightResize,
  isCtnWorkspaceBottomVisible,
  ctnWorkspaceBottomHeight,
  startCtnWorkspaceBottomResize,
  actions
}: WorkspaceProps) {
  return (
    <div id="ctn-workspace" style={{ display: isCtnWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
      <div className="relative flex flex-col flex-1 min-w-0">

        {/* TOP PANEL */}
        {wkpLayoutConfig.showCtnWkpTop && (
          <ResizableContainer
            id="ctn-workspace-top"
            visible={isCtnWorkspaceTopVisible}
            style={{ height: `${ctnWorkspaceTopHeight}px` }}
            headerLeft="Target Path Mapping Streams"
            headerRight={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => actions.setIsCtnWorkspaceTopVisible(false)}
                className="p-0 rounded w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer"
                data-tooltip="Close top panel"
              >
                <X size={12} />
              </Button>
            }
            resizeHandle="bottom"
            onResizeStart={startCtnWorkspaceTopResize}
            className="bg-muted border-b"
          >
            {wkpContainers.top}
          </ResizableContainer>
        )}

        <div id="ctn-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT PANEL */}
          {wkpLayoutConfig.showCtnWkpLeft && (
            <ResizableContainer
              id="ctn-workspace-left"
              visible={isCtnWorkspaceLeftVisible}
              style={activeMiddlePanelsCount === 1 ? { flex: 1 } : { width: `${ctnWorkspaceLeftWidth}px` }}
              headerLeft={headers.leftPanelTitle || activeView}
              headerRight={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => actions.setIsCtnWorkspaceLeftVisible(false)}
                  className="p-0 rounded w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer"
                  data-tooltip="Close left panel"
                >
                  <X size={12} />
                </Button>
              }
              className={activeMiddlePanelsCount === 1 ? "min-w-[200px]" : "border-r min-w-[200px]"}
              resizeHandle={activeMiddlePanelsCount > 1 ? "right" : "none"}
              onResizeStart={startCtnWorkspaceLeftResize}
            >
              {wkpContainers.left}
            </ResizableContainer>
          )}

          {/* CENTER PANEL (EXCEPTED FROM CLOSE CROSS BUTTON) */}
          {wkpLayoutConfig.showCtnWkpCenter && (
            <ResizableContainer
              id="ctn-workspace-center"
              visible={isCtnWorkspaceCenterVisible || isCtnWorkspaceCenterMaximized}
              style={isCtnWorkspaceCenterMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}
              headerLeft={headers.centerPanelHeader}
              headerCenter={headers.centerPanelHeaderCenter}
              headerRight={headers.centerPanelHeaderRight}
              className="relative bg-background"
            >
              {wkpContainers.center}
              {isCurrentlyResizing && <div className="z-30 absolute inset-0 bg-transparent pointer-events-auto select-none" style={{ cursor: isDraggingSidebarLeft || isDraggingSidebarRight || isDraggingLeftPane || isDraggingRightPane ? 'col-resize' : 'row-resize' }} />}
            </ResizableContainer>
          )}

          {/* RIGHT PANEL */}
          {wkpLayoutConfig.showCtnWkpRight && (
            <ResizableContainer
              id="ctn-workspace-right"
              visible={isCtnWorkspaceRightVisible}
              style={(!isCtnWorkspaceCenterVisible || activeMiddlePanelsCount === 1) ? { flex: 1 } : { width: `${ctnWorkspaceRightWidth}px` }}
              headerLeft="Metadata & Inspector Tab Matrices"
              headerRight={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => actions.setIsCtnWorkspaceRightVisible(false)}
                  className="p-0 rounded w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer"
                  data-tooltip="Close right inspector panel"
                >
                  <X size={12} />
                </Button>
              }
              className={(!isCtnWorkspaceCenterVisible || activeMiddlePanelsCount === 1) ? "min-w-[200px]" : "border-l min-w-[200px]"}
              resizeHandle={isCtnWorkspaceCenterVisible ? "left" : "none"}
              onResizeStart={isCtnWorkspaceCenterVisible ? startCtnWorkspaceRightResize : undefined}
            >
              {wkpContainers.right}
            </ResizableContainer>
          )}
        </div>

        {/* BOTTOM PANEL */}
        {wkpLayoutConfig.showCtnWkpBottom && (
          <ResizableContainer
            id="ctn-workspace-bottom"
            visible={isCtnWorkspaceBottomVisible}
            style={{ height: `${ctnWorkspaceBottomHeight}px` }}
            headerLeft="AST Pipeline Monitoring Feed"
            headerRight={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => actions.setIsCtnWorkspaceBottomVisible(false)}
                className="p-0 rounded w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer"
                data-tooltip="Close bottom panel"
              >
                <X size={12} />
              </Button>
            }
            className="bg-secondary border-t"
            resizeHandle="top"
            onResizeStart={startCtnWorkspaceBottomResize}
          >
            {wkpContainers.bottom}
          </ResizableContainer>
        )}
      </div>
    </div>
  );
}
