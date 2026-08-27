import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';

export function RulesFeature() {
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
            <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
              <ContainerPanelHeader title="Impact Rules Engine" path="workspace.center" isHiddable={false} />
              <div className="p-6 font-mono text-xs">
                <h3 className="font-bold text-foreground text-sm">Architectural Rules & Impact Policies</h3>
                <p className="mt-1 text-muted-foreground">Configured AST impact rules and linting metrics.</p>
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
