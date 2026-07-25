import React from 'react';
import { Sliders, Info, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/store/useLayoutStore';

export function AppSidebarRight() {
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const isMaximized = useLayoutStore((s) => s.containers.sidebarRight?.maximizeContainer?.isMaximized);

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground font-mono text-xs">
      <div className="flex items-center justify-between p-2 px-3 border-b border-border text-muted-foreground uppercase text-[11px] shrink-0 select-none">
        <div className="flex items-center gap-1.5 font-bold">
          <Sliders size={13} className="text-primary shrink-0" />
          <span className="truncate">Right Sidebar Inspector</span>
        </div>
        <Button
          id="btn-maximize-sidebar-right"
          variant="ghost"
          size="icon-xs"
          onClick={() => toggleContainerMaximized('sidebarRight')}
          className="w-5 h-5 text-muted-foreground hover:text-foreground shrink-0"
          data-tooltip={isMaximized ? "Restore Sidebar Size" : "Maximize Sidebar"}
        >
          {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </Button>
      </div>

      <div className="flex-1 p-3 space-y-2 text-muted-foreground overflow-y-auto">
        <p className="flex items-center gap-1 text-[11px]">
          <Info size={12} className="text-primary shrink-0" /> Dynamic layout container right sidebar active.
        </p>
      </div>
    </div>
  );
}
