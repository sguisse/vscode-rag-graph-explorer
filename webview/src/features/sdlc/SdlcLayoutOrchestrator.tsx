import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useSdlcWorkflowMachine } from './core/workflow/useSdlcWorkflowMachine';
import { useCodebaseDomainState } from './domains/codebase-context/store/useCodebaseDomainState';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

// Domain Features & Sidebar Component
import { SdlcSidebarMenu } from './ui-common/components/SdlcSidebarMenu';
import { CodebaseExplorerPanel } from './domains/codebase-context/components/codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './domains/codebase-context/components/dependency-graph/GraphPanel';
import { ImpactedPathsPanel } from './domains/codebase-context/components/impacted-paths/impacted-paths-panel';
import { FilesContextPanel } from './domains/codebase-context/components/files-selection/files-context';
import { InstructionsFeature } from './domains/instructions';
import { LlmFeature } from './domains/llm-chat';
import { ResultsManagerFeature } from './domains/results-manager';
import { ConfigurationFeature } from './domains/configuration';

export function SdlcLayoutOrchestrator() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const currentStep = useSdlcWorkflowMachine((s) => s.currentStep);
  const codebase = useCodebaseDomainState((s) => s.codebase);

  useEffect(() => {
    const defaultSidebarLeft = {
      visible: true,
      container: <SdlcSidebarMenu />,
      isResizable: true,
      isHiddable: true,
    };

    // ----------------------------------------------------------------------
    // STEP 1: CODEBASE CONTEXT
    // ----------------------------------------------------------------------
    if (currentStep === 'CODEBASE_CONTEXT') {
      setLayoutContainers({
        header: { visible: true, isResizable: false, isHiddable: false },
        sidebarLeft: defaultSidebarLeft,
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
                <CodebaseExplorerPanel
                  codebase={codebase}
                  searchFilteredFiles={[]}
                  expandedFolders={{}}
                  visibleFiles={{}}
                  toggleFolder={() => {}}
                  toggleFolderCheckbox={() => {}}
                  toggleFileCheckbox={() => {}}
                  setSelectedEntity={() => {}}
                />
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
                <GraphPanel
                  folderPositions={{}}
                  containerRef={() => {}}
                  showGrid={true}
                  isDarkMode={false}
                  graphState={{ zoom: 1, pan: { x: 0, y: 0 }, nodePositions: {} }}
                  selectedEntity={null}
                  searchFilteredFiles={[]}
                  impactedSet={new Set()}
                  handleSelectMember={() => {}}
                  attributesVisible={false}
                  methodsVisible={false}
                />
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
                <FilesContextPanel
                  initialCodebase={codebase}
                  selectedEntity={null}
                  enableDownstream={true}
                  setEnableDownstream={() => {}}
                  enableUpstream={false}
                  setEnableUpstream={() => {}}
                  impactedSet={new Set()}
                  handleCopy={() => {}}
                />
              </div>
            ),
            isResizable: true,
            isHiddable: true,
            maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
          },
          bottom: { visible: false },
        },
        sidebarRight: { visible: false },
        footer: { visible: true, isResizable: false, isHiddable: false },
      });
    }
    // ----------------------------------------------------------------------
    // STEP 2: INSTRUCTIONS
    // ----------------------------------------------------------------------
    else if (currentStep === 'INSTRUCTIONS') {
      setLayoutContainers({
        header: { visible: true, isResizable: false, isHiddable: false },
        sidebarLeft: defaultSidebarLeft,
        workspace: {
          top: { visible: false },
          left: { visible: false },
          center: {
            visible: true,
            container: <InstructionsFeature />,
            isResizable: false,
            isHiddable: false,
            maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
          },
          right: { visible: false },
          bottom: { visible: false },
        },
        sidebarRight: { visible: false },
        footer: { visible: true, isResizable: false, isHiddable: false },
      });
    }
    // ----------------------------------------------------------------------
    // STEP 3: LLM CHAT
    // ----------------------------------------------------------------------
    else if (currentStep === 'LLM_CHAT') {
      setLayoutContainers({
        header: { visible: true, isResizable: false, isHiddable: false },
        sidebarLeft: defaultSidebarLeft,
        workspace: {
          top: { visible: false },
          left: { visible: false },
          center: {
            visible: true,
            container: <LlmFeature />,
            isResizable: false,
            isHiddable: false,
            maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
          },
          right: { visible: false },
          bottom: { visible: false },
        },
        sidebarRight: { visible: false },
        footer: { visible: true, isResizable: false, isHiddable: false },
      });
    }
    // ----------------------------------------------------------------------
    // STEP 4: RESULTS MANAGER
    // ----------------------------------------------------------------------
    else if (currentStep === 'RESULTS_MANAGER') {
      setLayoutContainers({
        header: { visible: true, isResizable: false, isHiddable: false },
        sidebarLeft: defaultSidebarLeft,
        workspace: {
          top: { visible: false },
          left: { visible: false },
          center: {
            visible: true,
            container: <ResultsManagerFeature />,
            isResizable: false,
            isHiddable: false,
            maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
          },
          right: { visible: false },
          bottom: { visible: false },
        },
        sidebarRight: { visible: false },
        footer: { visible: true, isResizable: false, isHiddable: false },
      });
    }
    // ----------------------------------------------------------------------
    // CONFIGURATION
    // ----------------------------------------------------------------------
    else if (currentStep === 'CONFIGURATION') {
      setLayoutContainers({
        header: { visible: true, isResizable: false, isHiddable: false },
        sidebarLeft: defaultSidebarLeft,
        workspace: {
          top: { visible: false },
          left: { visible: false },
          center: {
            visible: true,
            container: <ConfigurationFeature />,
            isResizable: false,
            isHiddable: false,
            maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
          },
          right: { visible: false },
          bottom: { visible: false },
        },
        sidebarRight: { visible: false },
        footer: { visible: true, isResizable: false, isHiddable: false },
      });
    }
  }, [currentStep, setLayoutContainers, codebase]);

  return null;
}
