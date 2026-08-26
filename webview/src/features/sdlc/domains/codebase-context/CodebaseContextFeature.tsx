import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

import { CodebaseExplorerPanel } from './components/codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './components/dependency-graph/GraphPanel';
import { ImpactedPathsPanel } from './components/impacted-paths/impacted-paths-panel';
import { FilesContextPanel } from './components/files-selection/files-context';

export function CodebaseContextFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          container: (
            <div className="flex flex-col h-full bg-background min-h-0 overflow-hidden">
               <ContainerPanelHeader title="Impacted Paths" path="workspace.top" />
               <ImpactedPathsPanel />
            </div>
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          container: (
            <div className="flex flex-col h-full bg-card min-h-0 overflow-hidden">
               <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
               <CodebaseExplorerPanel />
            </div>
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: (
            <div className="flex flex-col h-full bg-background min-h-0 overflow-hidden">
               <ContainerPanelHeader title="Dependency Graph" path="workspace.center" />
               <GraphPanel />
            </div>
          ),
          isResizable: false,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: (
            <div className="flex flex-col h-full bg-card min-h-0 overflow-hidden">
               <ContainerPanelHeader title="Files Selection & Inspector" path="workspace.right" />
               <FilesContextPanel />
            </div>
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: { visible: false }
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}
