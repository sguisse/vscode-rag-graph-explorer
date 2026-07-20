import React from 'react';
import { ResizableContainer } from '@/components/app/container/resizable-container';

export interface WorkspaceProps {
  isCtnWorkspaceVisible: boolean;
  layoutConfig: {
    showTop?: boolean;
    showLeft?: boolean;
    showCenter?: boolean;
    showRight?: boolean;
    showBottom?: boolean;
  };
  isCtnWorkspaceTopVisible: boolean;
  ctnWorkspaceTopHeight: number;
  startCtnWorkspaceTopResize: (e: React.MouseEvent) => void;
  panels: {
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
  isGraphMaximized: boolean;
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
}

export function Workspace({
  isCtnWorkspaceVisible,
  layoutConfig,
  isCtnWorkspaceTopVisible,
  ctnWorkspaceTopHeight,
  startCtnWorkspaceTopResize,
  panels,
  headers,
  isCtnWorkspaceLeftVisible,
  activeMiddlePanelsCount,
  ctnWorkspaceLeftWidth,
  activeView,
  startCtnWorkspaceLeftResize,
  isCtnWorkspaceCenterVisible,
  isGraphMaximized,
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
}: WorkspaceProps) {
  return (
    <div id="ctn-workspace" style={{ display: isCtnWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
      <div className="relative flex flex-col flex-1 min-w-0">

        {/* TOP PANEL */}
        {layoutConfig.showTop && (
          <ResizableContainer id="ctn-workspace-top" visible={isCtnWorkspaceTopVisible} style={{ height: `${ctnWorkspaceTopHeight}px` }} headerLeft="Target Path Mapping Streams" resizeHandle="bottom" onResizeStart={startCtnWorkspaceTopResize} className="bg-muted border-b">
            {panels.top}
          </ResizableContainer>
        )}

        <div id="ctn-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT PANEL */}
          {layoutConfig.showLeft && (
            <ResizableContainer
              id="ctn-workspace-left"
              visible={isCtnWorkspaceLeftVisible}
              style={activeMiddlePanelsCount === 1 ? { flex: 1 } : { width: `${ctnWorkspaceLeftWidth}px` }}
              headerLeft={headers.leftPanelTitle || activeView}
              className={activeMiddlePanelsCount === 1 ? "min-w-[200px]" : "border-r min-w-[200px]"}
              resizeHandle={activeMiddlePanelsCount > 1 ? "right" : "none"}
              onResizeStart={startCtnWorkspaceLeftResize}
            >
              {panels.left}
            </ResizableContainer>
          )}

          {/* CENTER PANEL */}
          {layoutConfig.showCenter && (
            <ResizableContainer
              id="ctn-workspace-center"
              visible={isCtnWorkspaceCenterVisible || isGraphMaximized}
              style={isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}
              headerLeft={headers.centerPanelHeader}
              headerCenter={headers.centerPanelHeaderCenter}
              headerRight={headers.centerPanelHeaderRight}
              className="relative bg-background"
            >
              {panels.center}
              {isCurrentlyResizing && <div className="z-30 absolute inset-0 bg-transparent pointer-events-auto select-none" style={{ cursor: isDraggingSidebarLeft || isDraggingSidebarRight || isDraggingLeftPane || isDraggingRightPane ? 'col-resize' : 'row-resize' }} />}
            </ResizableContainer>
          )}

          {/* RIGHT PANEL */}
          {layoutConfig.showRight && (
            <ResizableContainer
              id="ctn-workspace-right"
              visible={isCtnWorkspaceRightVisible}
              style={(!isCtnWorkspaceCenterVisible || activeMiddlePanelsCount === 1) ? { flex: 1 } : { width: `${ctnWorkspaceRightWidth}px` }}
              headerLeft="Metadata & Inspector Tab Matrices"
              className={(!isCtnWorkspaceCenterVisible || activeMiddlePanelsCount === 1) ? "min-w-[200px]" : "border-l min-w-[200px]"}
              resizeHandle={isCtnWorkspaceCenterVisible ? "left" : "none"}
              onResizeStart={isCtnWorkspaceCenterVisible ? startCtnWorkspaceRightResize : undefined}
            >
              {panels.right}
            </ResizableContainer>
          )}
        </div>

        {/* BOTTOM PANEL */}
        {layoutConfig.showBottom && (
          <ResizableContainer id="ctn-workspace-bottom" visible={isCtnWorkspaceBottomVisible} style={{ height: `${ctnWorkspaceBottomHeight}px` }} className="bg-secondary border-t" resizeHandle="top" onResizeStart={startCtnWorkspaceBottomResize}>
            {panels.bottom}
          </ResizableContainer>
        )}
      </div>
    </div>
  );
}
