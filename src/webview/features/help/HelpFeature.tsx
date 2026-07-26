import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

export function HelpFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          isHiddable: false,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background overflow-hidden">
              <ContainerPanelHeader title="Help & Documentation" path="workspace.center" isHiddable={false} />
              <div className="p-6 font-mono text-xs">
                <h3 className="font-bold text-sm text-foreground">Documentation & User Manual</h3>
                <p className="text-muted-foreground mt-1">Guide on graph navigation, impact analysis, and layout controls.</p>
              </div>
            </div>
          ),
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
