#!/usr/bin/env bash
set -e

# Create folder structure for wkp-top-paths feature component
mkdir -p webview/src/features/explorer/wkp-top-paths

# 1. Create the NEW PathsPanelHeader file
cat << 'EOF' > webview/src/features/explorer/wkp-top-paths/PathsPanelHeader.tsx
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface PathsPanelHeaderLeftProps {
  title?: string;
}

export const PathsPanelHeaderLeft: React.FC<PathsPanelHeaderLeftProps> = ({
  title = 'Context Paths',
}) => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate uppercase tracking-wider">
      {title}
    </span>
  </div>
);

export interface PathsPanelHeaderCenterProps {
  upstreamDepth: number;
  setUpstreamDepth: (val: number) => void;
  downstreamDepth: number;
  setDownstreamDepth: (val: number) => void;
}

export const PathsPanelHeaderCenter: React.FC<PathsPanelHeaderCenterProps> = ({
  upstreamDepth,
  setUpstreamDepth,
  downstreamDepth,
  setDownstreamDepth,
}) => {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <ArrowUp size={12} className="text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Upstream Depth:
        </span>
        <Input
          id="input-upstream-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent shadow-none p-0 border-0 focus:ring-0 focus-visible:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={upstreamDepth}
          onChange={(e) => setUpstreamDepth(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <ArrowDown size={12} className="text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Downstream Depth:
        </span>
        <Input
          id="input-downstream-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent shadow-none p-0 border-0 focus:ring-0 focus-visible:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={downstreamDepth}
          onChange={(e) => setDownstreamDepth(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
};

export interface PathsPanelHeaderRightProps {}

export const PathsPanelHeaderRight: React.FC<PathsPanelHeaderRightProps> = () => null;
EOF

# 2. Rewrite context-paths-panel.tsx with depth parameters and single-event selectedPath handling
cat << 'EOF' > webview/src/features/explorer/wkp-top-paths/context-paths-panel.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { useContextPaths } from './use-context-paths';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

interface ContextPathsPanelProps {
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function ContextPathsPanel({
  onCodebaseChange,
  upstreamDepth = 2,
  downstreamDepth = 2,
}: ContextPathsPanelProps = {}) {
  const { currentPath, updatePath, setCodebaseData } = useContextPaths();
  const [paths, setPaths] = useState<string>(currentPath);

  // Keep fresh references of depths for effect callbacks
  const depthRef = useRef({ upstreamDepth, downstreamDepth });
  useEffect(() => {
    depthRef.current = { upstreamDepth, downstreamDepth };
  }, [upstreamDepth, downstreamDepth]);

  // Helper function to handle async impact fetching
  const fetchImpacts = useCallback(
    async (
      targetPaths: string,
      up = depthRef.current.upstreamDepth,
      down = depthRef.current.downstreamDepth
    ) => {
      if (!targetPaths.trim()) return;
      const realCodebaseData = await getPathsChangeImpacts(targetPaths, up, down);

      // Update state or context with the real Neo4j data
      if (setCodebaseData) {
        setCodebaseData(realCodebaseData);
      }
      if (onCodebaseChange && realCodebaseData) {
        onCodebaseChange(realCodebaseData);
      }
    },
    [setCodebaseData, onCodebaseChange]
  );

  // Trigger impacts fetch if depths change while target paths are active
  useEffect(() => {
    if (paths.trim()) {
      fetchImpacts(paths, upstreamDepth, downstreamDepth);
    }
  }, [upstreamDepth, downstreamDepth, fetchImpacts]);

  useEffect(() => {
    // Register listener for 'selectedPath'
    const unsubscribeStatus = vsCodeHandleMessage.on('selectedPath', (message) => {
      logInfo(`Status received from extension: ${message.payload}`);
      if (message.payload) {
        // Atomic update replacing Textarea content in one step
        const newPath = message.payload;
        setPaths(newPath);
        updatePath(newPath);
        fetchImpacts(newPath, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
      }
    });

    // Cleanup event listeners on unmount
    return () => {
      unsubscribeStatus();
    };
  }, [updatePath, fetchImpacts]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPaths(val);
    updatePath(val);
    fetchImpacts(val, upstreamDepth, downstreamDepth);
  };

  return (
    <div className="flex flex-col bg-background p-0 w-full h-full">
      <Textarea
        value={paths}
        onChange={handleTextareaChange}
        placeholder="Selected paths from explorer..."
        className="bg-muted/20 border-border focus-visible:ring-1 w-full h-full min-h-[50px] font-mono text-foreground text-xs resize-none"
      />
    </div>
  );
}
EOF

# 3. Update ExplorerFeature.tsx to integrate PathsPanelHeader components and depth states into workspace.top
cat << 'EOF' > webview/src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

import { ContextPathsPanel } from './wkp-top-paths/context-paths-panel';
import {
  PathsPanelHeaderLeft,
  PathsPanelHeaderCenter,
  PathsPanelHeaderRight,
} from './wkp-top-paths/PathsPanelHeader';
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

  const [enableDownstream, setEnableDownstream] = useState<boolean>(true);
  const [enableUpstream, setEnableUpstream] = useState<boolean>(false);

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
        <ContainerPanelHeader
          path="workspace.top"
          headerLeft={<PathsPanelHeaderLeft />}
          headerCenter={
            <PathsPanelHeaderCenter
              upstreamDepth={upstreamDepth}
              setUpstreamDepth={setUpstreamDepth}
              downstreamDepth={downstreamDepth}
              setDownstreamDepth={setDownstreamDepth}
            />
          }
          headerRight={<PathsPanelHeaderRight />}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <ContextPathsPanel
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

npm run compile

echo "✅ feat/refactor: Added PathsPanelHeader component, integrated upstream/downstream depth state into ExplorerFeature's workspace.top container, and ensured selectedPath replaces Textarea atomically without duplicate events!"
