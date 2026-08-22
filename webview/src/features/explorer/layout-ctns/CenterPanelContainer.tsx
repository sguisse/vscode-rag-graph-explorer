import React, { useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { GraphPanel } from '../wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from '../wksp-cnt-graph/GraphPanelHeader';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useGraph } from '../wksp-cnt-graph/hooks/use-graph';
import { useExplorerStore } from '../store/useExplorerStore';

export function CenterPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const folderPositions = useExplorerStore((s) => s.folderPositions);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const focusedNodeId = useExplorerStore((s) => s.focusedNodeId);

  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);

  const showGrid = useExplorerStore((s) => s.showGrid);
  const setShowGrid = useExplorerStore((s) => s.setShowGrid);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const setCallersDepth = useExplorerStore((s) => s.setCallersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setCalleesDepth = useExplorerStore((s) => s.setCalleesDepth);
  const currentLayout = useExplorerStore((s) => s.currentLayout);
  const setCurrentLayout = useExplorerStore((s) => s.setCurrentLayout);

  const attributesVisible = useExplorerStore((s) => s.attributesVisible);
  const setAttributesVisible = useExplorerStore((s) => s.setAttributesVisible);
  const methodsVisible = useExplorerStore((s) => s.methodsVisible);
  const setMethodsVisible = useExplorerStore((s) => s.setMethodsVisible);
  const showSelectedOnly = useExplorerStore((s) => s.showSelectedOnly);
  const setShowSelectedOnly = useExplorerStore((s) => s.setShowSelectedOnly);

  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setSelectedEntity({ type: 'node', nodeId });
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Single-clicked graph item: ${nodeId}. Revealing path & copying to clipboard: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.copyToClipboard(targetFile.path);
      }
    },
    [codebase.files, setSelectedEntity]
  );

  const handleSelectMember = useCallback(
    (nodeId: string, memberId: string) => {
      setSelectedEntity({ type: 'member', nodeId, memberId });
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Single-clicked member item: ${memberId} in ${nodeId}. Revealing path & copying to clipboard: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.copyToClipboard(targetFile.path);
      }
    },
    [codebase.files, setSelectedEntity]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Double-clicked graph item: ${nodeId}. Opening file in VS Code: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.openFile(targetFile.path);
      }
    },
    [codebase.files]
  );

  const handleNodeCmdClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      const pathToAdd = targetFile?.path || nodeId;
      logInfo(`Cmd+Clicked graph item: ${nodeId}. Appending path to context paths panel: ${pathToAdd}`);
      vsCodeHandleMessage.emit('addPathToTop', { command: 'addPathToTop', payload: pathToAdd });
    },
    [codebase.files]
  );

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick,
    handleNodeCmdClick
  );

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

  return (
    <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.center"
        isHiddable={true}
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
}
