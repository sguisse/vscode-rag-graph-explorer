#!/usr/bin/env bash
set -e

echo "🎨 Updating panel maximize/minimize icon styling with pastel destructive theme..."

# 1. Create or update ContainerPanelHeader.tsx
mkdir -p webview/src/components/app/layout

cat << 'EOF' > webview/src/components/app/layout/ContainerPanelHeader.tsx
import React from 'react';
import { Maximize2, Minimize2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/store/useLayoutStore';

interface ContainerPanelHeaderProps {
  title?: React.ReactNode;
  path?: string;
  isHiddable?: boolean;
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export function ContainerPanelHeader({
  title,
  path,
  isHiddable = true,
  headerLeft,
  headerCenter,
  headerRight,
  className = '',
}: ContainerPanelHeaderProps) {
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const toggleContainerVisible = useLayoutStore((s) => s.toggleContainerVisible);
  const isMaximized = useLayoutStore((s) => {
    if (!path) return false;
    if (typeof s.isContainerMaximized === 'function') {
      return s.isContainerMaximized(path);
    }
    return !!(s.containers as any)?.[path]?.maximizeContainer?.isMaximized;
  });

  const handleMaximizeToggle = () => {
    if (path) {
      toggleContainerMaximized(path);
    }
  };

  const handleHide = () => {
    if (path) {
      toggleContainerVisible(path);
    }
  };

  return (
    <div className={`flex items-center justify-between bg-muted/40 px-2.5 py-1.5 border-b border-border text-xs select-none shrink-0 min-h-[32px] ${className}`}>
      <div className="flex items-center gap-2 min-w-0 font-mono font-bold text-foreground">
        {headerLeft ? headerLeft : (typeof title === 'string' ? <span className="truncate">{title}</span> : title)}
      </div>

      {headerCenter && (
        <div className="flex items-center justify-center flex-1 px-2 overflow-hidden">
          {headerCenter}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        {headerRight}

        {path && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleMaximizeToggle}
            className={`p-1 rounded transition-colors w-6 h-6 cursor-pointer ${
              isMaximized
                ? 'bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-tooltip={isMaximized ? "Restore / Minimize Panel" : "Maximize Panel"}
          >
            {isMaximized ? <Minimize2 size={12} className="text-destructive shrink-0" /> : <Maximize2 size={12} className="shrink-0" />}
          </Button>
        )}

        {isHiddable && path && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleHide}
            className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-6 h-6 cursor-pointer"
            data-tooltip="Hide Panel"
          >
            <EyeOff size={12} className="shrink-0" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default ContainerPanelHeader;
EOF

# 2. Update GraphPanelHeader.tsx
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, SquareFunction, Code2, Target, Maximize2, Minimize2 } from 'lucide-react';
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
        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider cursor-pointer"
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
  showSelectedOnly: boolean;
  setShowSelectedOnly: (val: boolean) => void;
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
  showSelectedOnly,
  setShowSelectedOnly,
}) => (
  <div className="flex items-center gap-1">
    <ToggleButton
      id="btn-toggle-show-selected-only"
      isSelected={showSelectedOnly}
      onToggle={() => setShowSelectedOnly(!showSelectedOnly)}
      tooltipText="Display Only Selected & Connected Items"
      icon={<Target size={12} />}
    />
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
      icon={<SquareFunction size={12} />}
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
      size="icon-xs"
      className="w-5 h-5 text-muted-foreground hover:bg-muted cursor-pointer"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}
    >
      <Plus size={12} />
    </Button>
    <Button
      id="btn-graph-zoom-out"
      variant="ghost"
      size="icon-xs"
      className="w-5 h-5 text-muted-foreground hover:bg-muted cursor-pointer"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}
    >
      <Minus size={12} />
    </Button>
    <Button
      id="btn-graph-fit-view"
      variant="ghost"
      size="icon-xs"
      className="w-5 h-5 text-muted-foreground hover:bg-muted cursor-pointer"
      onClick={() => {
        cyRef.current?.fit(undefined, 40);
        cyRef.current?.center();
      }}
    >
      <Focus size={12} />
    </Button>

    <Button
      id="btn-graph-maximize-toggle"
      variant="ghost"
      size="icon-xs"
      onClick={() => setIsGraphMaximized(!isGraphMaximized)}
      className={`p-1 rounded transition-colors w-6 h-6 cursor-pointer ${
        isGraphMaximized
          ? 'bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      data-tooltip={isGraphMaximized ? "Restore / Minimize Graph" : "Maximize Graph"}
    >
      {isGraphMaximized ? <Minimize2 size={12} className="text-destructive shrink-0" /> : <Maximize2 size={12} className="shrink-0" />}
    </Button>
  </div>
);
EOF

# 3. Update ExplorerFeature.tsx to pass the real maximized state
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
  const isCenterMaximized = useLayoutStore((s) => {
    if (typeof s.isContainerMaximized === 'function') {
      return s.isContainerMaximized('workspace.center');
    }
    return !!(s.containers as any)?.['workspace.center']?.maximizeContainer?.isMaximized;
  });

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
              isGraphMaximized={isCenterMaximized}
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
    isCenterMaximized,
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

echo "⚙️ Rebuilding project..."
npm run compile

echo "✅ style: Updated panel minimize icon to display in red (text-destructive) with light red pastel background (bg-destructive/15) when maximized!"
