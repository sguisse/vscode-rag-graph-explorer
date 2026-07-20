import React from 'react';
import { ResizableContainer } from '@/components/app/container/resizable-container';

export interface SidebarRightProps {
  layoutConfig: {
    showRightSidebar?: boolean;
  };
  isSidebarRightVisible: boolean;
  sidebarRightWidth: number;
  headers: {
    rightSidebarHeader?: React.ReactNode;
    rightSidebarHeaderRight?: React.ReactNode;
  };
  panels: {
    rightSidebar?: React.ReactNode;
  };
  startSidebarRightResize: (e: React.MouseEvent) => void;
}

export function SidebarRight({
  layoutConfig,
  isSidebarRightVisible,
  sidebarRightWidth,
  headers,
  panels,
  startSidebarRightResize
}: SidebarRightProps) {
  if (!layoutConfig.showRightSidebar) return null;

  return (
    <ResizableContainer
      id="ctn-sidebar-right"
      visible={isSidebarRightVisible}
      style={{ width: `${sidebarRightWidth}px` }}
      headerLeft={headers.rightSidebarHeader}
      headerRight={headers.rightSidebarHeaderRight}
      className="border-l shrink-0"
      resizeHandle="left"
      onResizeStart={startSidebarRightResize}
    >
      {panels.rightSidebar}
    </ResizableContainer>
  );
}
