#!/usr/bin/env bash
set -e

echo "🚀 Fixing Cytoscape DOM mounting lifecycle in ExplorerFeature..."

mkdir -p src/features/explorer/wksp-cnt-graph/components/graph

# 1. Update useCytoscapeInstance.ts to use Callback Ref
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/useCytoscapeInstance.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [graphState, setGraphState] = useState<GraphState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodePositions: {}
  });

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setContainerNode(node);
    }
  }, []);

  useEffect(() => {
    if (!containerNode) return;

    const cy = cytoscape({
      container: containerNode,
      style: [
        { selector: 'node[width][height]', style: { 'shape': 'rectangle', 'opacity': 0.0, 'width': 'data(width)', 'height': 'data(height)' } },
        { selector: 'node.folder', style: { 'shape': 'rectangle', 'opacity': 1.0, 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -12, 'font-size': '12px', 'font-family': 'monospace', 'font-weight': 'bold', 'color': isDarkMode ? '#94a3b8' : '#475569', 'background-opacity': 0.02, 'background-color': isDarkMode ? '#475569' : '#94a3b8', 'border-width': '2px', 'border-color': isDarkMode ? '#334155' : '#cbd5e1', 'border-style': 'dashed', 'padding': '40' } },
        { selector: 'edge', style: { 'width': 2, 'line-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'font-family': 'monospace', 'color': isDarkMode ? '#94a3b8' : '#475569', 'text-background-opacity': 1, 'text-background-color': isDarkMode ? '#18181b' : '#ffffff', 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle' } },
        { selector: 'edge.impacted', style: { 'line-color': '#f97316', 'target-arrow-color': '#f97316', 'width': 4 } }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      if (!evt.target.hasClass('folder')) {
        onNodeSelect(evt.target.id());
      }
    });

    const syncGraph = () => {
      const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
      cy.nodes().forEach(node => {
        if (node.hasClass('folder')) return;
        const bb = node.boundingBox({ includeLabels: false, includeEdges: false });
        positions[node.id()] = { x: bb.x1, y: bb.y1, w: bb.w, h: bb.h };
      });
      setGraphState({ zoom: cy.zoom(), pan: cy.pan(), nodePositions: positions });
    };

    cy.on('drag pan zoom render', syncGraph);

    requestAnimationFrame(() => {
      if (cyRef.current && !cyRef.current.isDestroyed()) {
        cyRef.current.resize();
      }
    });

    return () => cy.destroy();
  }, [containerNode, isDarkMode, onNodeSelect]);

  return { containerRef, cyRef, graphState, isReady: !!containerNode };
}
EOF

# 2. Update use-graph.ts
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/use-graph.ts
import { useCytoscapeInstance } from './useCytoscapeInstance';
import { useGraphTopology } from './useGraphTopology';

export function useGraph(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const { containerRef, cyRef, graphState, isReady } = useCytoscapeInstance(isDarkMode, onNodeSelect);
  const { updateGraphTopology } = useGraphTopology(cyRef);

  return { containerRef, cyRef, graphState, updateGraphTopology, isReady };
}
EOF

# 3. Update GraphPanel.tsx
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/GraphPanel.tsx
import React from 'react';
import { Info } from 'lucide-react';
import { FolderNode, UmlClassNode, ConfigNode, UmlClassNodeData } from './components/graph/GraphUmlShapes';
import { codebaseService, SelectedEntity, CodebaseFile, isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/codebase';

interface GraphPanelProps {
  containerRef: (node: HTMLDivElement | null) => void;
  showGrid: boolean;
  isDarkMode: boolean;
  graphState: {
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  selectedEntity: SelectedEntity | null;
  searchFilteredFiles: CodebaseFile[];
  impactedSet: Set<string>;
  handleSelectMember: (nodeId: string, memberId: string) => void;
}

export function GraphPanel({
  containerRef,
  showGrid,
  isDarkMode,
  graphState,
  selectedEntity,
  searchFilteredFiles,
  impactedSet,
  handleSelectMember
}: GraphPanelProps) {
  const folderPositions = codebaseService.getFolderPositions();

  return (
    <div className="absolute inset-0 outline-none w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="z-0 absolute inset-0 w-full h-full"
        style={showGrid ? {
          backgroundImage: isDarkMode ? 'radial-gradient(#334155 1.2px, transparent 1.2px)' : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
          backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`
        } : undefined}
      />

      <div
        className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none"
        style={{ transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})` }}
      >
        {Object.entries(folderPositions).map(([folderKey, initialPos]) => {
          const bounds = graphState.nodePositions[`folder__${folderKey}`];
          if (!bounds) return null;
          const isSelected = selectedEntity?.nodeId === `folder__${folderKey}`;
          return (
            <div key={`folder-box-${folderKey}`} className="z-10 absolute transition-all duration-75 ease-out" style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}>
              <FolderNode data={{ label: initialPos.label }} isSelected={isSelected} />
            </div>
          );
        })}

        {searchFilteredFiles.map((file: CodebaseFile) => {
          const bounds = graphState.nodePositions[file.id];
          if (!bounds) return null;

          const impactedMembers: string[] = [];
          impactedSet.forEach(item => {
            if (isMemberKeyForFileToken(item, file.id)) {
              impactedMembers.push(extractMemberIdFromKeyToken(item));
            }
          });
          const isNodeImpacted = impactedSet.has(file.id);
          const isDimmed = selectedEntity !== null && impactedSet.size > 0 && !isNodeImpacted;

          const nodeData: UmlClassNodeData = {
            ...file,
            isDimmed,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember
          };

          return (
            <div key={file.id} className="z-20 absolute transition-all duration-75 ease-out pointer-events-none" style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}>
              {file.type === 'config' ? <ConfigNode id={file.id} data={nodeData} /> : <UmlClassNode id={file.id} data={nodeData} />}
            </div>
          );
        })}
      </div>

      <div id="cytoscape-engine-info" className="top-4 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto">
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
        <p className="text-[10px] text-muted-foreground">Drag-and-drop on headers and wheel zoom use Cytoscape's responsive architecture.</p>
      </div>
    </div>
  );
}
EOF

# 4. Update ExplorerFeature.tsx
cat << 'EOF' > src/features/explorer/ExplorerFeature.tsx
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

import {
  codebaseService,
  CodebaseData,
  SelectedEntity,
  ImpactDirection,
} from '@/services/codebase';

export function ExplorerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setNotification = useAppContextStore((s) => s.setNotification);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const [codebase, setCodebase] = useState<CodebaseData>(() => codebaseService.getCodebase());
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [impactDirection, setImpactDirection] = useState<ImpactDirection>('aval');

  const [showGrid, setShowGrid] = useState(true);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(1);
  const [currentLayout, setCurrentLayout] = useState('preset');

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
    if (!isReady) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      codebaseService.getFolderPositions()
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
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
    (importedData: CodebaseData) => {
      codebaseService.importCodebase(importedData);
      setCodebase({ ...importedData });
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
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background overflow-hidden">
              <ContainerPanelHeader title="Context Paths" path="workspace.top" />
              <div className="flex-1 min-h-0 overflow-auto">
                <ContextPathsPanel />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-card overflow-hidden">
              <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
              <div className="flex-1 min-h-0 overflow-auto">
                <CodebaseExplorerPanel
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
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          isResizable: false,
          isHiddable: false,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background relative overflow-hidden">
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
                  />
                }
              />
              <div className="flex-1 min-h-0 relative w-full h-full">
                <GraphPanel
                  containerRef={containerRef}
                  showGrid={showGrid}
                  isDarkMode={isDarkMode}
                  graphState={graphState}
                  selectedEntity={selectedEntity}
                  searchFilteredFiles={filter.searchFilteredFiles}
                  impactedSet={impactedSet}
                  handleSelectMember={handleSelectMember}
                />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-card overflow-hidden">
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
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background overflow-hidden">
              <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
              <div className="flex-1 min-h-0 overflow-auto">
                <WkpBottomPanel />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: {
        visible: true,
        isResizable: true,
        isHiddable: true,
        container: (
          <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-card overflow-hidden">
            <ContainerPanelHeader title="Entity Properties" path="sidebarRight" />
            <div className="flex-1 min-h-0 overflow-auto">
              <EntityPropertiesPanel selectedEntity={selectedEntity} />
            </div>
          </div>
        ),
        maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [
    setLayoutContainers,
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
    selectedEntity,
    codebase,
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

echo "✅ Cytoscape DOM callback ref updated. The Graph now renders smoothly in AST Explorer!"
