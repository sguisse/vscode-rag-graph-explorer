import React, { useEffect, useRef } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useSdlcWorkflowMachine } from './core/workflow/useSdlcWorkflowMachine';

import { SdlcSidebarMenu } from './ui-common/components/SdlcSidebarMenu';
import { CodebaseExplorerPanel } from './domains/codebase-context/components/codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './domains/codebase-context/components/dependency-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from './domains/codebase-context/components/dependency-graph/GraphPanelHeader';
import { ImpactedPathsPanel } from './domains/codebase-context/components/impacted-paths/impacted-paths-panel';
import { ImpactedPathsPanelHeader } from './domains/codebase-context/components/impacted-paths/ImpactedPathsPanelHeader';
import { useImpactedPaths } from './domains/codebase-context/components/impacted-paths/hooks/use-impacted-paths';
import { FilesContextPanel } from './domains/codebase-context/components/files-selection/files-context';
import { InstructionsFeature } from './domains/instructions';
import { LlmFeature } from './domains/llm-chat';
import { ResultsManagerFeature } from './domains/results-manager';
import { ConfigurationFeature } from './domains/configuration';
import { useCodebaseDomainState } from './domains/codebase-context/store/useCodebaseDomainState';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

function ImpactedPathsHeaderWrapper() {
  const {
    upstreamDepth,
    setUpstreamDepth,
    downstreamDepth,
    setDownstreamDepth,
    buildDefaultCypherQueryParameters,
  } = useImpactedPaths();

  return (
    <ImpactedPathsPanelHeader
      title="Impacted Paths to analyze"
      upstreamDepth={upstreamDepth}
      setUpstreamDepth={setUpstreamDepth}
      downstreamDepth={downstreamDepth}
      setDownstreamDepth={setDownstreamDepth}
      onBuildDefaultQueryParameters={buildDefaultCypherQueryParameters}
    />
  );
}

function CodebaseExplorerWrapper() {
  const codebase = useCodebaseDomainState((s) => s.codebase);
  const expandedFolders = useCodebaseDomainState((s) => s.expandedFolders);
  const visibleFiles = useCodebaseDomainState((s) => s.selectedContextFiles);
  const toggleFolder = useCodebaseDomainState((s) => s.toggleFolder);
  const toggleFileCheckbox = useCodebaseDomainState((s) => s.toggleFileCheckbox);
  const toggleFolderCheckbox = useCodebaseDomainState((s) => s.toggleFolderCheckbox);
  const setSelectedEntity = useCodebaseDomainState((s) => s.setSelectedEntity);

  return (
    <CodebaseExplorerPanel
      codebase={codebase}
      searchFilteredFiles={codebase?.files || []}
      expandedFolders={expandedFolders}
      visibleFiles={visibleFiles}
      toggleFolder={toggleFolder}
      toggleFolderCheckbox={toggleFolderCheckbox}
      toggleFileCheckbox={toggleFileCheckbox}
      setSelectedEntity={setSelectedEntity}
    />
  );
}

function FilesContextWrapper() {
  const codebase = useCodebaseDomainState((s) => s.codebase);

  return (
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
  );
}

export function SdlcLayoutOrchestrator() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const currentStep = useSdlcWorkflowMachine((s) => s.currentStep);
  const lastSetStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastSetStepRef.current === currentStep) return;
    lastSetStepRef.current = currentStep;

    const defaultSidebarLeft = {
      visible: true,
      container: <SdlcSidebarMenu />,
      isResizable: true,
      isHiddable: true,
    };

    if (currentStep === 'CODEBASE_CONTEXT') {
      setLayoutContainers({
        header: { visible: true, isResizable: false, isHiddable: false },
        sidebarLeft: defaultSidebarLeft,
        workspace: {
          top: {
            visible: true,
            container: (
              <div className="flex flex-col h-full bg-background min-h-0 overflow-hidden">
                <div className="border-b border-border bg-card shrink-0">
                  <ImpactedPathsHeaderWrapper />
                </div>
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
                <CodebaseExplorerWrapper />
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
                <div className="flex justify-between items-center px-2 py-1 border-b border-border bg-card shrink-0">
                  <GraphPanelHeaderLeft />
                  <GraphPanelHeaderCenter />
                  <GraphPanelHeaderRight
                    cyRef={{ current: null }}
                    isGraphMaximized={false}
                    setIsGraphMaximized={() => {}}
                    showGrid={true}
                    setShowGrid={() => {}}
                    attributesVisible={false}
                    setAttributesVisible={() => {}}
                    methodsVisible={true}
                    setMethodsVisible={() => {}}
                    showSelectedOnly={false}
                    setShowSelectedOnly={() => {}}
                  />
                </div>
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
                <FilesContextWrapper />
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
    } else if (currentStep === 'INSTRUCTIONS') {
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
    } else if (currentStep === 'LLM_CHAT') {
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
    } else if (currentStep === 'RESULTS_MANAGER') {
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
    } else if (currentStep === 'CONFIGURATION') {
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
  }, [currentStep, setLayoutContainers]);

  return null;
}
