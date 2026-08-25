import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useCodebaseDomainState } from './store/useCodebaseDomainState';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

// Components mapped directly from the old Explorer views
import { CodebaseExplorerPanel } from './components/codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './components/dependency-graph/GraphPanel';
import { ImpactedPathsPanel } from './components/impacted-paths/impacted-paths-panel';
import { InspectorPanel } from './components/inspector/inspector-panel';
import { FilesContextPanel } from './components/files-selection/files-context';

export function CodebaseContextFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const codebase = useCodebaseDomainState((s) => s.codebase);

  useEffect(() => {
    // Orchestrator delegates layout management to the active feature
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
               <CodebaseExplorerPanel codebase={codebase} searchFilteredFiles={[]} expandedFolders={{}} visibleFiles={{}} toggleFolder={()=>{}} toggleFolderCheckbox={()=>{}} toggleFileCheckbox={()=>{}} setSelectedEntity={()=>{}} />
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
               <GraphPanel folderPositions={{}} containerRef={()=>{}} showGrid={true} isDarkMode={false} graphState={{zoom:1, pan:{x:0,y:0}, nodePositions:{}}} selectedEntity={null} searchFilteredFiles={[]} impactedSet={new Set()} handleSelectMember={()=>{}} attributesVisible={false} methodsVisible={false} />
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
               <FilesContextPanel initialCodebase={codebase} selectedEntity={null} enableDownstream={true} setEnableDownstream={()=>{}} enableUpstream={false} setEnableUpstream={()=>{}} impactedSet={new Set()} handleCopy={()=>{}} />
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
  }, [setLayoutContainers, codebase]);

  return null;
}
