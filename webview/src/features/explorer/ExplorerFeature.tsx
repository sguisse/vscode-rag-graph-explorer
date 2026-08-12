import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';

import { ImpactedPathsPanel } from './wkp-top-impacted-paths/impacted-paths-panel';
import {
  ImpactedPathsPanelHeaderLeft,
  ImpactedPathsPanelHeaderCenter,
  ImpactedPathsPanelHeaderRight,
} from './wkp-top-impacted-paths/ImpactedPathsPanelHeader';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from './wksp-cnt-graph/GraphPanelHeader';
import { TabsFilesContextContainer } from './wkp-rgt-tabs-files-context/tabs-files-context-container';
import { WkpBottomPanel } from './wkp-btm-infos/wkp-bottom-panel';
import { TabsPromptContainer } from './sdb-rgt-prompt/tabs-prompt-container';

import { useCodebaseFilter } from './hooks/use-codebase-filter';
import { useTransitiveImpact } from './hooks/use-transitive-impact';
import { useGraph } from './wksp-cnt-graph/components/graph/use-graph';

import { initialCodebase, FOLDER_POSITIONS } from './wksp-cnt-graph/components/graph/GraphData';

import {
  CodebaseData,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';

export function ExplorerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const setContainerContent = useLayoutStore((s) => s.setContainerContent);
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setNotification = useAppContextStore((s) => s.setNotification);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const [codebase, setCodebase] = useState<CodebaseData>(initialCodebase);
  const [folderPositions, setFolderPositions] = useState<Record<string, { label: string }>>(FOLDER_POSITIONS);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const [enableDownstream, setEnableDownstream] = useState<boolean>(true);
  const [enableUpstream, setEnableUpstream] = useState<boolean>(true);

  const [upstreamDepth, setUpstreamDepth] = useState<number>(2);
  const [downstreamDepth, setDownstreamDepth] = useState<number>(2);

  const [showGrid, setShowGrid] = useState(false);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(1);
  const [currentLayout, setCurrentLayout] = useState('preset');

  const [attributesVisible, setAttributesVisible] = useState(false);
  const [methodsVisible, setMethodsVisible] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const handleSelectMember = useCallback((nodeId: string, memberId: string) => {
    setSelectedEntity({ type: 'member', nodeId, memberId });
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const targetFile = codebase.files.find((f) => f.id === nodeId);
    if (targetFile && targetFile.path) {
      logInfo(`Double-clicked graph item: ${nodeId}. Revealing path in VS Code Explorer: ${targetFile.path}`);
      vsCodeApiService.revealInExplorer(targetFile.path);
    }
  }, [codebase.files]);

  const handleNodeCmdClick = useCallback((nodeId: string) => {
    const targetFile = codebase.files.find((f) => f.id === nodeId);
    const pathToAdd = targetFile?.path || nodeId;
    logInfo(`Cmd+Clicked graph item: ${nodeId}. Appending path to context paths panel: ${pathToAdd}`);
    vsCodeHandleMessage.emit('addPathToTop', { command: 'addPathToTop', payload: pathToAdd });
  }, [codebase.files]);

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick,
    handleNodeCmdClick
  );

  const handleFocusNode = useCallback((nodeId: string) => {
    const cy = cyRef.current;
    if (cy) {
      const targetNode = cy.getElementById(nodeId);
      if (targetNode && targetNode.length > 0) {
        cy.animate({
          center: { eles: targetNode },
          duration: 300,
          easing: 'ease-in-out-cubic'
        });
      }
    }
    setFocusedNodeId(nodeId);
    setTimeout(() => {
      setFocusedNodeId((prev) => (prev === nodeId ? null : prev));
    }, 2000);
  }, [cyRef]);

  useEffect(() => {
    if (!isReady || Object.keys(folderPositions).length === 0) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
    attributesVisible,
    methodsVisible,
    selectedEntity,
    showSelectedOnly,
    updateGraphTopology,
  ]);

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setNotification]
  );

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          isResizable: false,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: {
        visible: true,
        isResizable: true,
        isHiddable: true,
        maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  useEffect(() => {
    setContainerContent(
      'workspace.top',
      <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader
          path="workspace.top"
          headerLeft={<ImpactedPathsPanelHeaderLeft />}
          headerCenter={
            <ImpactedPathsPanelHeaderCenter
              upstreamDepth={upstreamDepth}
              setUpstreamDepth={setUpstreamDepth}
              downstreamDepth={downstreamDepth}
              setDownstreamDepth={setDownstreamDepth}
            />
          }
          headerRight={<ImpactedPathsPanelHeaderRight />}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <ImpactedPathsPanel
            onCodebaseChange={handleImportCodebase}
            upstreamDepth={upstreamDepth}
            downstreamDepth={downstreamDepth}
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.left',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
        <div className="flex-1 min-h-0 overflow-auto">
          <CodebaseExplorerPanel
            codebase={codebase}
            searchFilteredFiles={filter.searchFilteredFiles}
            expandedFolders={filter.expandedFolders}
            visibleFiles={filter.visibleFiles}
            toggleFolder={filter.toggleFolder}
            toggleFolderCheckbox={filter.toggleFolderCheckbox}
            toggleFileCheckbox={filter.toggleFileCheckbox}
            setSelectedEntity={setSelectedEntity}
            onFocusNode={handleFocusNode}
            onImportCodebase={handleImportCodebase}
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.center',
      <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader
          path="workspace.center"
          isHiddable={false}
          headerLeft={<GraphPanelHeaderLeft />}
          headerCenter={
            <GraphPanelHeaderCenter
              maxNodesLimit={filter.maxNodesLimit}
              setMaxNodesLimit={filter.setMaxNodesLimit}
              callersDepth={callersDepth}
              setCallersDepth={setCallersDepth}
              calleesDepth={calleesDepth}
              setCalleesDepth={setCalleesDepth}
              displayLevel={filter.displayLevel}
              setDisplayLevel={filter.setDisplayLevel}
              currentLayout={currentLayout}
              setCurrentLayout={setCurrentLayout}
            />
          }
          headerRight={
            <GraphPanelHeaderRight
              cyRef={cyRef}
              isGraphMaximized={false}
              setIsGraphMaximized={() => toggleContainerMaximized('workspace.center')}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              attributesVisible={attributesVisible}
              setAttributesVisible={setAttributesVisible}
              methodsVisible={methodsVisible}
              setMethodsVisible={setMethodsVisible}
              showSelectedOnly={showSelectedOnly}
              setShowSelectedOnly={setShowSelectedOnly}
            />
          }
        />
        <div className="relative flex-1 w-full h-full min-h-0">
          <GraphPanel
            folderPositions={folderPositions}
            containerRef={containerRef}
            showGrid={showGrid}
            isDarkMode={isDarkMode}
            graphState={graphState}
            selectedEntity={selectedEntity}
            focusedNodeId={focusedNodeId}
            searchFilteredFiles={filter.searchFilteredFiles}
            impactedSet={impactedSet}
            handleSelectMember={handleSelectMember}
            attributesVisible={attributesVisible}
            methodsVisible={methodsVisible}
            showSelectedOnly={showSelectedOnly}
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.right',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Files Context Builder" path="workspace.right" />
        <div className="flex-1 min-h-0 overflow-auto">
          <TabsFilesContextContainer
            selectedEntity={selectedEntity}
            initialCodebase={codebase}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.bottom',
      <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
        <div className="flex-1 min-h-0 overflow-auto">
          <WkpBottomPanel />
        </div>
      </div>
    );

    setContainerContent(
      'sidebarRight',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Prompt & LLM Studio" path="sidebarRight" />
        <div className="flex-1 min-h-0 overflow-auto">
          <TabsPromptContainer
            selectedEntity={selectedEntity}
            initialCodebase={codebase}
            handleCopy={handleCopy}
          />
        </div>
      </div>
    );
  }, [
    setContainerContent,
    toggleContainerMaximized,
    filter.searchFilteredFiles,
    filter.expandedFolders,
    filter.visibleFiles,
    filter.maxNodesLimit,
    filter.displayLevel,
    filter.toggleFolder,
    filter.toggleFolderCheckbox,
    filter.toggleFileCheckbox,
    filter.setMaxNodesLimit,
    filter.setDisplayLevel,
    upstreamDepth,
    downstreamDepth,
    callersDepth,
    calleesDepth,
    currentLayout,
    showGrid,
    attributesVisible,
    methodsVisible,
    showSelectedOnly,
    selectedEntity,
    focusedNodeId,
    codebase,
    folderPositions,
    enableDownstream,
    enableUpstream,
    impactedSet,
    handleCopy,
    handleImportCodebase,
    handleSelectMember,
    handleNodeDoubleClick,
    handleFocusNode,
    handleNodeCmdClick,
    containerRef,
    cyRef,
    isDarkMode,
    graphState,
  ]);

  return null;
}

export default ExplorerFeature;
