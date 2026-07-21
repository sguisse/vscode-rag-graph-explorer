import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { LayoutVisibilityActions } from './hooks/use-layout-state';

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
  actions: LayoutVisibilityActions;
}

export function SidebarRight({
  layoutConfig,
  isSidebarRightVisible,
  sidebarRightWidth,
  headers,
  panels,
  startSidebarRightResize,
  actions
}: SidebarRightProps) {
  if (!layoutConfig.showRightSidebar) return null;

  return (
    <ResizableContainer
      id="ctn-sidebar-right"
      visible={isSidebarRightVisible}
      style={{ width: `${sidebarRightWidth}px` }}
      headerLeft={headers.rightSidebarHeader}
      headerRight={
        <div className="flex items-center gap-0">
          {headers.rightSidebarHeaderRight}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => actions.setIsSidebarRightVisible(false)}
            className="p-0 rounded w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer"
            data-tooltip="Hide entity properties drawer"
          >
            <X size={12} />
          </Button>
        </div>
      }
      className="border-l shrink-0"
      resizeHandle="left"
      onResizeStart={startSidebarRightResize}
    >
      {panels.rightSidebar}
    </ResizableContainer>
  );
}
