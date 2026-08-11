#!/usr/bin/env bash
set -e

# 1. Remove json-tab-panel.tsx and plantuml-tab-panel.tsx files if present
rm -f webview/src/features/explorer/wkp-rgt-tabs-files-context/json-tab-panel.tsx
rm -f webview/src/features/explorer/wkp-rgt-tabs-files-context/plantuml-tab-panel.tsx

# 2. Update webview/src/features/explorer/wkp-rgt-tabs-files-context/tabs-files-context-container.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/tabs-files-context-container.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InspectorTabPanel } from './inspector-tab-panel';
import { FilesContextPanel } from './files-context';
import { ContextTransformerPanel } from './context-transformer';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';

interface TabsFilesContextContainerProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function TabsFilesContextContainer({
  selectedEntity,
  initialCodebase,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: TabsFilesContextContainerProps) {
  const [rightPanelTab, setRightPanelTab] = useState<'inspect' | 'files_context' | 'transformer'>('files_context');

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b overflow-x-auto shrink-0">
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('inspect')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Inspector
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('files_context')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'files_context' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Context
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('transformer')}
          className={`flex-1 min-w-[80px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'transformer' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Transformer
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {rightPanelTab === 'files_context' && (
          <FilesContextPanel
            initialCodebase={initialCodebase}
            selectedEntity={selectedEntity}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'transformer' && (
          <ContextTransformerPanel
            initialCodebase={initialCodebase}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'inspect' && (
          <InspectorTabPanel
            selectedEntity={selectedEntity}
            initialCodebase={initialCodebase}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
}
EOF

# 3. Update webview/src/features/explorer/ExplorerFeature.tsx
cat << 'EOF' > webview/src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

import { ContextPathsPanel } from './wkp-top-paths/context-paths-panel';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from './wksp-cnt-graph/GraphPanelHeader';
import { TabsFilesContextContainer } from './wkp-rgt-tabs-files-context/tabs-files-context-container';
import { WkpBottomPanel } from './wkp-btm-infos/wkp-bottom-panel';
import { EntityPropertiesPanel } from './sdb-rgt-properties/EntityPropertiesPanel';

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

  const [enableDownstream, setEnableDownstream] = useState<boolean>(true);
  const [enableUpstream, setEnableUpstream] = useState<boolean>(false);

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

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick
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
        <ContainerPanelHeader title="Context Paths" path="workspace.top" />
        <div className="flex-1 min-h-0 overflow-auto">
          <ContextPathsPanel />
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
        <ContainerPanelHeader title="Entity Properties" path="sidebarRight" />
        <div className="flex-1 min-h-0 overflow-auto">
          <EntityPropertiesPanel selectedEntity={selectedEntity} />
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
    callersDepth,
    calleesDepth,
    currentLayout,
    showGrid,
    attributesVisible,
    methodsVisible,
    showSelectedOnly,
    selectedEntity,
    codebase,
    folderPositions,
    enableDownstream,
    enableUpstream,
    impactedSet,
    handleCopy,
    handleImportCodebase,
    handleSelectMember,
    handleNodeDoubleClick,
    containerRef,
    cyRef,
    isDarkMode,
    graphState,
  ]);

  return null;
}

export default ExplorerFeature;
EOF

echo "✅ refactor: Successfully removed json-tab-panel and plantuml-tab-panel along with all associated imports and props!"
