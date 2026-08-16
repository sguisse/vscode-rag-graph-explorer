#!/usr/bin/env bash
set -e

echo "🚀 Extracting layout container components into dedicated files in webview/src/features/explorer/layout-ctns/..."

mkdir -p webview/src/features/explorer/layout-ctns

# 1. TopPanelContainer
cat << 'EOF' > webview/src/features/explorer/layout-ctns/TopPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { ImpactedPathsPanel } from '../wkp-top-impacted-paths/impacted-paths-panel';
import {
  ImpactedPathsPanelHeaderLeft,
  ImpactedPathsPanelHeaderCenter,
  ImpactedPathsPanelHeaderRight,
} from '../wkp-top-impacted-paths/ImpactedPathsPanelHeader';
import { useExplorerStore } from '../store/useExplorerStore';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function TopPanelContainer() {
  const upstreamDepth = useExplorerStore((s) => s.upstreamDepth);
  const setUpstreamDepth = useExplorerStore((s) => s.setUpstreamDepth);
  const downstreamDepth = useExplorerStore((s) => s.downstreamDepth);
  const setDownstreamDepth = useExplorerStore((s) => s.setDownstreamDepth);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  return (
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
}
EOF

# 2. LeftPanelContainer
cat << 'EOF' > webview/src/features/explorer/layout-ctns/LeftPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { CodebaseExplorerPanel } from '../wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useExplorerStore } from '../store/useExplorerStore';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function LeftPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const setFocusedNodeId = useExplorerStore((s) => s.setFocusedNodeId);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const filter = useCodebaseFilter(codebase.files);

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      setFocusedNodeId(nodeId);
      setTimeout(() => {
        setFocusedNodeId((prev) => (prev === nodeId ? null : prev));
      }, 2000);
    },
    [setFocusedNodeId]
  );

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  return (
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
}
EOF

# 3. CenterPanelContainer
cat << 'EOF' > webview/src/features/explorer/layout-ctns/CenterPanelContainer.tsx
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
import { useGraph } from '../wksp-cnt-graph/components/graph/use-graph';
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
    },
    [setSelectedEntity]
  );

  const handleSelectMember = useCallback(
    (nodeId: string, memberId: string) => {
      setSelectedEntity({ type: 'member', nodeId, memberId });
    },
    [setSelectedEntity]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Double-clicked graph item: ${nodeId}. Revealing path in VS Code Explorer: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
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
EOF

# 4. RightPanelContainer
cat << 'EOF' > webview/src/features/explorer/layout-ctns/RightPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { TabsFilesContextContainer } from '../wkp-rgt-tabs-files-context/tabs-files-context-container';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useExplorerStore } from '../store/useExplorerStore';

export function RightPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const setEnableDownstream = useExplorerStore((s) => s.setEnableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);
  const setEnableUpstream = useExplorerStore((s) => s.setEnableUpstream);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  return (
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
}
EOF

# 5. BottomPanelContainer
cat << 'EOF' > webview/src/features/explorer/layout-ctns/BottomPanelContainer.tsx
import React from 'react';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { WkpBottomPanel } from '../wkp-btm-infos/wkp-bottom-panel';

export function BottomPanelContainer() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
      <div className="flex-1 min-h-0 overflow-auto">
        <WkpBottomPanel />
      </div>
    </div>
  );
}
EOF

# 6. SidebarRightContainer
cat << 'EOF' > webview/src/features/explorer/layout-ctns/SidebarRightContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { TabsPromptContainer } from '../sdb-rgt-prompt/tabs-prompt-container';
import { useExplorerStore } from '../store/useExplorerStore';

export function SidebarRightContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  return (
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
}
EOF

# 7. Update ExplorerFeature.tsx
cat << 'EOF' > webview/src/features/explorer/ExplorerFeature.tsx
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { BottomPanelContainer } from './layout-ctns/BottomPanelContainer';
import { SidebarRightContainer } from './layout-ctns/SidebarRightContainer';

export function ExplorerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          container: <TopPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isResizable: false,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          container: <BottomPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: {
        visible: true,
        container: <SidebarRightContainer />,
        isResizable: true,
        isHiddable: true,
        maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ExplorerFeature;
EOF

echo "✅ refactor: Extracted all panel containers into dedicated files in webview/src/features/explorer/layout-ctns/!"
