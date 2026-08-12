#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src/features/explorer/wksp-cnt-graph/components/graph
mkdir -p webview/src/features/explorer/wksp-cnt-graph
mkdir -p webview/src/features/explorer

# 1. Update GraphUmlShapes.tsx to add `isFocused` support with a blinking ring effect
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/components/graph/GraphUmlShapes.tsx
import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { CodebaseFile, CodebaseAttribute, CodebaseMethod, ConfigProperty } from '@/shared/services/graph-rag-explorer';

export interface NodeStyle {
  bg: string;
  border: string;
  badge: string;
  iconColor: string;
}

export const NODE_STYLE_REGISTRY: Record<string, NodeStyle> = {
  component: {
    bg: 'bg-emerald-600 dark:bg-emerald-900/80',
    border: 'border-emerald-500',
    badge: '🎨 React Component',
    iconColor: 'text-emerald-400'
  },
  module: {
    bg: 'bg-purple-600 dark:bg-purple-950/80',
    border: 'border-purple-500',
    badge: '📦 Module / Service',
    iconColor: 'text-purple-400'
  },
  interface: {
    bg: 'bg-indigo-700 dark:bg-indigo-950/80',
    border: 'border-indigo-500',
    badge: '⚙️ Interface',
    iconColor: 'text-indigo-400'
  },
  class: {
    bg: 'bg-blue-600 dark:bg-blue-950/80',
    border: 'border-blue-500',
    badge: '☕ Class',
    iconColor: 'text-blue-400'
  },
  default: {
    bg: 'bg-slate-700 dark:bg-slate-900/80',
    border: 'border-slate-500',
    badge: '📄 Node / AST',
    iconColor: 'text-slate-400'
  }
};

export interface UmlClassNodeData extends CodebaseFile {
  isDimmed?: boolean;
  isOrigin?: boolean;
  isDependency?: boolean;
  isFocused?: boolean;
  impactedMembers?: string[];
  selectedMember?: string;
  onSelectMember: (nodeId: string, memberId: string) => void;
  attributesVisible?: boolean;
  methodsVisible?: boolean;
}

export interface FolderNodeProps {
  data: { label: string };
  isSelected?: boolean;
}

export const FolderNode: React.FC<FolderNodeProps> = ({ isSelected }) => (
  <div className={`w-full h-full rounded-lg transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`} />
);

export const UmlClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;

  let borderClass = style.border;
  let headerBg = `${style.bg} text-white`;
  let iconColor = style.iconColor;

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-background animate-pulse scale-105 shadow-2xl shadow-amber-500/50';
    headerBg = 'bg-amber-500/40 dark:bg-amber-500/45 text-foreground';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500 dark:text-amber-400';
  }

  return (
    <div className={`w-72 bg-card rounded-lg shadow-xl border-2 ${borderClass} relative transition-all duration-300 opacity-100`}>
      <div className={`${headerBg} p-3 relative rounded-t-[5px] transition-colors`}>
        <div className="flex justify-between items-center">
          <span className="bg-black/30 opacity-85 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">{style.badge}</span>
          <span className="opacity-60 font-mono text-[10px]">{data.language}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileCode size={18} className={iconColor} />
          <h4 className="font-mono font-bold text-sm truncate">{data.name}</h4>
        </div>
      </div>

      {data.attributesVisible && (
        <div className="bg-muted/30 p-2.5 border-border border-b">
          <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Attributes</div>
          {(!data.attributes || data.attributes.length === 0) ? (
            <div className="text-muted-foreground text-xs italic">no attributes available</div>
          ) : (
            <ul className="space-y-0.5 font-mono text-[11px] text-foreground/80">
              {data.attributes.map((attr: CodebaseAttribute, idx: number) => (
                <li key={idx} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}</span>
                  {attr.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {data.methodsVisible && (
        <div className="p-2.5">
          <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Methods / Exports</div>
          <div className="space-y-2">
            {data.methods?.map((m: CodebaseMethod) => {
              const isMethodImpacted = data.impactedMembers && data.impactedMembers.includes(m.id);
              const isSelected = data.selectedMember === m.id;
              return (
                <div key={m.id} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, m.id); }}
                  className={`pointer-events-auto group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                    isSelected ? 'border-red-500 bg-red-500/20 text-foreground font-bold' : isMethodImpacted ? 'border-amber-500 bg-amber-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                  }`}
                >
                  <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  let borderClass = 'border-amber-500';
  let headerBg = 'bg-amber-500 text-white';
  let iconColor = 'text-amber-100';

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-background animate-pulse scale-105 shadow-2xl shadow-amber-500/50';
    headerBg = 'bg-amber-500/40 dark:bg-amber-500/45 text-foreground';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500';
  }

  return (
    <div className={`w-80 bg-card rounded-lg shadow-xl border-2 ${borderClass} relative transition-all duration-300 opacity-100`}>
      <div className={`flex justify-between items-center ${headerBg} p-2.5 rounded-t-[5px] transition-colors`}>
        <div className="flex items-center gap-1.5">
          <Settings size={16} className={iconColor} />
          <h4 className="font-mono font-bold text-xs truncate">{data.name}</h4>
        </div>
        <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest">Configuration</span>
      </div>
      <div className="space-y-2 bg-black/90 p-3 max-h-64 overflow-y-auto font-mono text-[10px] text-slate-300">
        {data.configProperties?.map((prop: ConfigProperty) => {
          const isPropImpacted = data.impactedMembers && data.impactedMembers.includes(prop.key);
          const isSelected = data.selectedMember === prop.key;
          return (
            <div key={prop.key} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, prop.key); }}
              className={`pointer-events-auto group relative p-2 rounded border transition-all cursor-pointer ${
                isSelected ? 'border-red-500 bg-red-500/20 text-white' : isPropImpacted ? 'border-amber-500 bg-amber-950/50 text-amber-400' : 'border-slate-800 hover:bg-slate-900'
              }`}
            >
              <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
              <div className="pl-2 text-slate-400 truncate">{prop.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
EOF

# 2. Update GraphPanel.tsx to accept focusedNodeId prop
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanel.tsx
import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { FolderNode, UmlClassNode, ConfigNode, UmlClassNodeData } from './components/graph/GraphUmlShapes';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/view/graph-view.service';

interface GraphPanelProps {
  folderPositions: Record<string, { label: string }>;
  containerRef: (node: HTMLDivElement | null) => void;
  showGrid: boolean;
  isDarkMode: boolean;
  graphState: {
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  selectedEntity: SelectedEntity | null;
  focusedNodeId?: string | null;
  searchFilteredFiles: CodebaseFile[];
  impactedSet: Set<string>;
  handleSelectMember: (nodeId: string, memberId: string) => void;
  attributesVisible: boolean;
  methodsVisible: boolean;
  showSelectedOnly?: boolean;
}

export function GraphPanel({
  folderPositions,
  containerRef,
  showGrid,
  isDarkMode,
  graphState,
  selectedEntity,
  focusedNodeId,
  searchFilteredFiles,
  impactedSet,
  handleSelectMember,
  attributesVisible,
  methodsVisible,
  showSelectedOnly = false
}: GraphPanelProps) {
  const effectiveFolderPositions = useMemo(() => {
    const folderMap: Record<string, { label: string }> = { ...folderPositions };

    Object.keys(graphState.nodePositions).forEach((nodeKey) => {
      if (nodeKey.startsWith('folder__')) {
        const folderKey = nodeKey.replace('folder__', '');
        if (!folderMap[folderKey]) {
          folderMap[folderKey] = {
            label: `📂 ${folderKey.charAt(0).toUpperCase() + folderKey.slice(1)}`
          };
        }
      }
    });

    return folderMap;
  }, [folderPositions, graphState.nodePositions]);

  const effectiveSearchFilteredFiles = useMemo(() => {
    if (showSelectedOnly && selectedEntity) {
      return searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id));
    }
    return searchFilteredFiles;
  }, [searchFilteredFiles, showSelectedOnly, selectedEntity, impactedSet]);

  return (
    <div className="absolute inset-0 outline-none w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="z-0 absolute inset-0 w-full h-full"
        style={showGrid ? {
          backgroundImage: isDarkMode
            ? 'radial-gradient(#334155 1.2px, transparent 1.2px)'
            : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
          backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`
        } : undefined}
      />

      <div
        className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none"
        style={{ transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})` }}
      >
        {Object.entries(effectiveFolderPositions).map(([folderKey, initialPos]) => {
          const bounds = graphState.nodePositions[`folder__${folderKey}`];
          if (!bounds) return null;
          const isSelected = selectedEntity?.nodeId === `folder__${folderKey}`;
          return (
            <div
              key={`folder-box-${folderKey}`}
              className="z-10 absolute transition-all duration-75 ease-out"
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              <FolderNode data={{ label: initialPos.label }} isSelected={isSelected} />
            </div>
          );
        })}

        {effectiveSearchFilteredFiles.map((file: CodebaseFile) => {
          const bounds = graphState.nodePositions[file.id];
          if (!bounds) return null;

          const impactedMembers: string[] = [];
          impactedSet.forEach(item => {
            if (isMemberKeyForFileToken(item, file.id)) {
              impactedMembers.push(extractMemberIdFromKeyToken(item));
            }
          });

          const isOrigin = selectedEntity?.nodeId === file.id;
          const isDependency = impactedSet.has(file.id) && !isOrigin;
          const isFocused = focusedNodeId === file.id;

          const nodeData: UmlClassNodeData = {
            ...file,
            isOrigin,
            isDependency,
            isFocused,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember,
            attributesVisible,
            methodsVisible
          };

          return (
            <div
              key={file.id}
              className={`absolute transition-all duration-75 ease-out pointer-events-none ${isFocused ? 'z-30' : 'z-20'}`}
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              {file.type === 'config' ? (
                <ConfigNode id={file.id} data={nodeData} />
              ) : (
                <UmlClassNode id={file.id} data={nodeData} />
              )}
            </div>
          );
        })}
      </div>

      <div
        id="cytoscape-engine-info"
        className="top-4 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto"
      >
        <div className="flex justify-between items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="font-bold">Surgical Analysis (Cytoscape Engine)</span>
          </div>
          <button
            onClick={() => {
              const infoDiv = document.getElementById('cytoscape-engine-info');
              if (infoDiv) infoDiv.style.display = 'none';
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Drag-and-drop on headers and wheel zoom use Cytoscape's responsive architecture.
        </p>
      </div>
    </div>
  );
}
EOF

# 3. Update ExplorerFeature.tsx to trigger graph camera centering AND blinking effect for focused node
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

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick
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
    // Activate blinking pulse effect on the graph node for 2 seconds
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

echo "✅ feat(graph-animation): Added pulsing amber ring blink effect on centered node when clicked from codebase tree!"
