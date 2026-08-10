#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src/features/explorer/wksp-cnt-graph
mkdir -p webview/src/features/explorer

# 1. Update GraphPanelHeader.tsx: Move toggles to HeaderRight & swap icons (Code2 <-> Braces)
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, Braces, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ToggleButton } from '@/components/app/toggle-button';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';

import {
  DISPLAY_LEVEL_LIST,
  DISPLAY_LEVEL_ICON_MAP,
  GRAPH_LAYOUT_LIST,
  GRAPH_LAYOUT_ICON_MAP
} from '@/shared/services/graph-rag-explorer/domain/model/types';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vscodeSettings } from '@/App';

export interface GraphPanelHeaderLeftProps {

}

export const GraphPanelHeaderLeft: React.FC<GraphPanelHeaderLeftProps> = () => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate uppercase tracking-wider">Topological Network</span>
  </div>
);

export interface GraphPanelHeaderCenterProps {
  maxNodesLimit: number;
  setMaxNodesLimit: (val: number) => void;
  callersDepth: number;
  setCallersDepth: (val: number) => void;
  calleesDepth: number;
  setCalleesDepth: (val: number) => void;
  displayLevel: string;
  setDisplayLevel: (val: string) => void;
  currentLayout: string;
  setCurrentLayout: (val: string) => void;
}

export const GraphPanelHeaderCenter: React.FC<GraphPanelHeaderCenterProps> = ({
  maxNodesLimit,
  setMaxNodesLimit,
  callersDepth,
  setCallersDepth,
  calleesDepth,
  setCalleesDepth,
  displayLevel,
  setDisplayLevel,
  currentLayout,
  setCurrentLayout,
}) => {
  const displayNeo4jHandler = () => {
    vsCodeApiService.openUrl(vscodeSettings.graphRagExplorer.neo4j.url, true);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
        <Input
          id="input-max-nodes-limit"
          type="number"
          min={1}
          max={100}
          className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center"
          value={maxNodesLimit}
          onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)}
        />
      </div>
      <Button
        id="btn-neo4j-connect"
        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider"
        onClick={displayNeo4jHandler}
      >
        <Database size={11} /> Neo4j
      </Button>
      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
        <User size={12} className="text-muted-foreground" />
        <Input
          id="input-callers-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
          value={callersDepth}
          onChange={(e) => setCallersDepth(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
        <Baby size={12} className="text-muted-foreground" />
        <Input
          id="input-callees-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
          value={calleesDepth}
          onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)}
        />
      </div>
      <SelectFromTypeBuilder
        id="select-display-level"
        value={displayLevel}
        onChange={setDisplayLevel}
        options={DISPLAY_LEVEL_LIST.map((key) => ({
          value: key,
          icon: DISPLAY_LEVEL_ICON_MAP[key].icon,
          label: DISPLAY_LEVEL_ICON_MAP[key].label,
        }))}
      />
      <SelectFromTypeBuilder
        id="select-graph-layout"
        value={currentLayout}
        onChange={setCurrentLayout}
        options={GRAPH_LAYOUT_LIST.map((key) => ({
          value: key,
          icon: GRAPH_LAYOUT_ICON_MAP[key].icon,
          label: GRAPH_LAYOUT_ICON_MAP[key].label,
        }))}
      />
    </div>
  );
};

export interface GraphPanelHeaderRightProps {
  cyRef: React.RefObject<any>;
  isGraphMaximized: boolean;
  setIsGraphMaximized: (maximized: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  attributesVisible: boolean;
  setAttributesVisible: (val: boolean) => void;
  methodsVisible: boolean;
  setMethodsVisible: (val: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphPanelHeaderRightProps> = ({
  cyRef,
  isGraphMaximized,
  setIsGraphMaximized,
  showGrid,
  setShowGrid,
  attributesVisible,
  setAttributesVisible,
  methodsVisible,
  setMethodsVisible,
}) => (
  <div className="flex items-center gap-1">
    <ToggleButton
      id="btn-toggle-attributes-visibility"
      isSelected={attributesVisible}
      onToggle={() => setAttributesVisible(!attributesVisible)}
      tooltipText="Toggle Attributes Visibility"
      icon={<Code2 size={12} />}
    />
    <ToggleButton
      id="btn-toggle-methods-visibility"
      isSelected={methodsVisible}
      onToggle={() => setMethodsVisible(!methodsVisible)}
      tooltipText="Toggle Methods Visibility"
      icon={<Braces size={12} />}
    />

    <ToolbarSeparator />

    <ToggleButton
      id="btn-toggle-grid"
      isSelected={showGrid}
      onToggle={() => setShowGrid(!showGrid)}
      tooltipText="Toggle Grid"
      icon={<Grid size={12} />}
    />

    <ToolbarSeparator />

    <Button
      id="btn-graph-zoom-in"
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}
    >
      <Plus size={12} />
    </Button>
    <Button
      id="btn-graph-zoom-out"
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}
    >
      <Minus size={12} />
    </Button>
    <Button
      id="btn-graph-fit-view"
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => {
        cyRef.current?.fit();
        cyRef.current?.center();
      }}
    >
      <Focus size={12} />
    </Button>
  </div>
);
EOF

# 2. Update ExplorerFeature.tsx to pass props to GraphPanelHeaderRight
cat << 'EOF' > webview/src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

import { ContextPathsPanel } from './wkp-top-paths/context-paths-panel';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from './wksp-cnt-graph/GraphPanelHeader';
import { GlobalInspectorPanel } from './wkp-rgt-tabs-inspector/global-inspector-panel';
import { WkpBottomPanel } from './wkp-btm-infos/wkp-bottom-panel';
import { EntityPropertiesPanel } from './sdb-rgt-properties/EntityPropertiesPanel';

import { useCodebaseFilter } from './hooks/use-codebase-filter';
import { useTransitiveImpact } from './hooks/use-transitive-impact';
import { useGraph } from './wksp-cnt-graph/components/graph/use-graph';
import { usePlantUml } from './wksp-cnt-graph/components/graph/use-plantuml';

import { initialCodebase, FOLDER_POSITIONS } from './wksp-cnt-graph/components/graph/GraphData';

import {
  CodebaseData,
  SelectedEntity,
  ImpactDirection,
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
  const [impactDirection, setImpactDirection] = useState<ImpactDirection>('callee');

  const [showGrid, setShowGrid] = useState(true);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(1);
  const [currentLayout, setCurrentLayout] = useState('preset');

  const [attributesVisible, setAttributesVisible] = useState(false);
  const [methodsVisible, setMethodsVisible] = useState(true);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(selectedEntity, impactDirection, codebase.dependencies);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const handleSelectMember = useCallback((nodeId: string, memberId: string) => {
    setSelectedEntity({ type: 'member', nodeId, memberId });
  }, []);

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(isDarkMode, handleNodeSelect);

  const generatedPlantUML = usePlantUml(
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase.dependencies
  );

  useEffect(() => {
    if (!isReady || Object.keys(folderPositions).length === 0) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
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
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.right',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Global Inspector" path="workspace.right" />
        <div className="flex-1 min-h-0 overflow-auto">
          <GlobalInspectorPanel
            selectedEntity={selectedEntity}
            initialCodebase={codebase}
            impactDirection={impactDirection}
            setImpactDirection={setImpactDirection}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
            generatedPlantUML={generatedPlantUML}
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
    selectedEntity,
    codebase,
    folderPositions,
    impactDirection,
    impactedSet,
    generatedPlantUML,
    handleCopy,
    handleImportCodebase,
    handleSelectMember,
    containerRef,
    cyRef,
    isDarkMode,
    graphState,
  ]);

  return null;
}

export default ExplorerFeature;
EOF

echo "✅ refactor: Moved attribute and method toggles to GraphPanelHeaderRight and inverted icons!"

# Rebuild webview
npm run build:webview
