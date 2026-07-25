import React from 'react';
import { Sliders, Info } from 'lucide-react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ContainerPanelHeader } from './ContainerPanelHeader';

export function AppSidebarRight() {
  const sidebarRightConfig = useLayoutStore((s) => s.containers.sidebarRight);
  const maximizeConfig = sidebarRightConfig?.maximizeContainer;

  const isMaximized = maximizeConfig?.isMaximized;
  const isMaximizable = maximizeConfig?.isMaximizable ?? true;
  const isHiddable = sidebarRightConfig?.isHiddable ?? true;

  const sidebarTitle = (
    <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
      <Sliders size={13} className="text-primary shrink-0" />
      <span className="truncate">Right Sidebar Inspector</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground font-mono text-xs">
      <ContainerPanelHeader
        title={sidebarTitle}
        path="sidebarRight"
        isMaximized={isMaximized}
        isMaximizable={isMaximizable}
        isHiddable={isHiddable}
      />

      <div className="flex-1 p-3 space-y-2 text-muted-foreground overflow-y-auto">
        <p className="flex items-center gap-1 text-[11px]">
          <Info size={12} className="text-primary shrink-0" /> Dynamic layout container right sidebar active.
        </p>
      </div>
    </div>
  );
}
