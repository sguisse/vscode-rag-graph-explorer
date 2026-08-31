import React, { useEffect, useMemo, useCallback } from 'react';
import { FolderNode, UmlClassNode, ConfigNode } from './components/GraphUmlShapes';
import { UmlClassNodeData } from './components/graph-common-shapes';
import { CondensedClassNode, CondensedConfigNode } from './components/GraphCondensedShapes';
import { RoundClassNode, RoundConfigNode } from './components/GraphRoundedShapes';
import { MinimizedClassNode, MinimizedConfigNode } from './components/GraphMinizedShapes';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { isMemberKeyForFileToken, extractMemberIdFromKeyToken, calculateTransitiveImpact } from '@/services/view/graph-view.service';
import { useGraphPanel } from './hooks/use-graph-panel';
import { GraphToolbar } from './GraphToolbar';
import { GraphMinimap } from './components/GraphMinimap';
import { useCodebaseDomainState } from '../../store/useCodebaseDomainState';
import { useGraph } from './hooks/use-graph';
import { FOLDER_POSITIONS, demoCodebase } from './data/GraphData';

export interface GraphPanelProps {
  folderPositions?: Record<string, { label: string }>;
  containerRef?: (node: HTMLDivElement | null) => void;
  showGrid?: boolean;
  isDarkMode?: boolean;
  graphState?: {
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  selectedEntity?: SelectedEntity | null;
  focusedNodeId?: string | null;
  searchFilteredFiles?: CodebaseFile[];
  impactedSet?: Set<string>;
  handleSelectMember?: (nodeId: string, memberId: string) => void;
  attributesVisible?: boolean;
  methodsVisible?: boolean;
  showSelectedOnly?: boolean;
}

export function GraphPanel(props: GraphPanelProps = {}) {
  const graphRendering = useCodebaseDomainState((s) => s.graphRendering) || 'rounded';
  const codebase = useCodebaseDomainState((s) => s.codebase) || demoCodebase;
  const currentLayout = useCodebaseDomainState((s) => s.currentLayout) || 'fcose';
  const setCurrentPath = useCodebaseDomainState((s) => s.setCurrentPath);
  const callersDepth = useCodebaseDomainState((s) => s.callersDepth) ?? 2;
  const calleesDepth = useCodebaseDomainState((s) => s.calleesDepth) ?? 2;
  const enableDownstream = useCodebaseDomainState((s) => s.enableDownstream);
  const enableUpstream = useCodebaseDomainState((s) => s.enableUpstream);
  const maxNodesLimit = useCodebaseDomainState((s) => s.maxNodesLimit) ?? 50;
  const storeSetSelectedEntity = useCodebaseDomainState((s) => s.setSelectedEntity);
  const visibleFiles = useCodebaseDomainState((s) => s.visibleFiles);
  const selectedContextFiles = useCodebaseDomainState((s) => s.selectedContextFiles);
  const paths = useCodebaseDomainState((s) => s.paths);
  const setPaths = useCodebaseDomainState((s) => s.setPaths);
  const storeFocusedNodeId = useCodebaseDomainState((s) => s.focusedNodeId);

  const storeShowGrid = useCodebaseDomainState((s) => s.showGrid);
  const storeAttributesVisible = useCodebaseDomainState((s) => s.attributesVisible);
  const storeMethodsVisible = useCodebaseDomainState((s) => s.methodsVisible);
  const storeShowSelectedOnly = useCodebaseDomainState((s) => s.showSelectedOnly);
  const autoFit = useCodebaseDomainState((s) => s.autoFit);
  const setCyRef = useCodebaseDomainState((s) => s.setCyRef);

  const pathLines = useMemo(() => {
    return (paths || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [paths]);

  const onNodeSelect = useCallback((nodeId: string) => {
    setCurrentPath(nodeId);
    storeSetSelectedEntity({ type: 'node', nodeId });
  }, [setCurrentPath, storeSetSelectedEntity]);

  const onNodeCmdClick = useCallback((nodeId: string) => {
    const file = codebase?.files?.find((f) => f.id === nodeId);
    const targetPath = file?.path || nodeId;
    if (!targetPath) return;

    setPaths((prev: string) => {
      const trimmedTarget = targetPath.trim();
      if (!prev || !prev.trim()) return trimmedTarget;
      const existingLines = prev.split('\n').map((l) => l.trim()).filter(Boolean);
      if (existingLines.includes(trimmedTarget)) return prev;
      return `${trimmedTarget}\n${prev.trim()}`;
    });
  }, [codebase?.files, setPaths]);

  const {
    containerRef: internalContainerRef,
    cyRef,
    graphState: internalGraphState,
    updateGraphTopology,
    isReady,
  } = useGraph(
    props.isDarkMode ?? false,
    onNodeSelect,
    undefined,
    onNodeCmdClick
  );

  useEffect(() => {
    if (cyRef) {
      setCyRef(cyRef);
    }
  }, [cyRef, setCyRef]);

  const containerRef = props.containerRef || internalContainerRef;
  const graphState = props.graphState || internalGraphState;
  const folderPositions = props.folderPositions || FOLDER_POSITIONS;
  const showGrid = props.showGrid ?? storeShowGrid;
  const isDarkMode = props.isDarkMode ?? false;
  const storeSelectedEntity = useCodebaseDomainState((s) => s.selectedEntity);
  const selectedEntity = props.selectedEntity ?? storeSelectedEntity;
  const searchFilteredFiles = props.searchFilteredFiles ?? (codebase.files as CodebaseFile[]);
  const focusedNodeId = props.focusedNodeId ?? storeFocusedNodeId;

  const checkedSearchFilteredFiles = useMemo(() => {
    return searchFilteredFiles.filter((file) => visibleFiles[file.id] !== false);
  }, [searchFilteredFiles, visibleFiles]);

  const computedImpactedSet = useMemo(() => {
    if (!selectedEntity || !codebase?.dependencies) return new Set<string>();
    return calculateTransitiveImpact(
      selectedEntity,
      codebase.dependencies,
      callersDepth,
      calleesDepth,
      enableDownstream,
      enableUpstream
    );
  }, [selectedEntity, codebase?.dependencies, callersDepth, calleesDepth, enableDownstream, enableUpstream]);

  const impactedSet = props.impactedSet ?? computedImpactedSet;
  const handleSelectMember = props.handleSelectMember ?? ((nodeId: string, memberId: string) => {
    storeSetSelectedEntity({ type: 'member', nodeId, memberId });
  });

  const attributesVisible = props.attributesVisible ?? storeAttributesVisible;
  const methodsVisible = props.methodsVisible ?? storeMethodsVisible;
  const showSelectedOnly = props.showSelectedOnly ?? storeShowSelectedOnly;

  const { effectiveFolderPositions, effectiveSearchFilteredFiles } = useGraphPanel(
    folderPositions,
    graphState.nodePositions,
    showSelectedOnly,
    selectedEntity,
    checkedSearchFilteredFiles,
    impactedSet
  );

  const visibleNodeIdsKey = useMemo(() => {
    return effectiveSearchFilteredFiles.map((f) => f.id).sort().join(',');
  }, [effectiveSearchFilteredFiles]);

  useEffect(() => {
    if (autoFit) return;
    const targetNodeId = focusedNodeId || selectedEntity?.nodeId;
    if (targetNodeId && cyRef.current) {
      const cy = cyRef.current;
      const cyNode = cy.getElementById(targetNodeId);
      if (cyNode && cyNode.length > 0) {
        cy.animate({
          center: { eles: cyNode },
          zoom: Math.max(cy.zoom(), 0.75),
          duration: 300,
        });
      }
    }
  }, [focusedNodeId, selectedEntity?.nodeId, cyRef, autoFit]);

  useEffect(() => {
    if (!isReady) return;
    updateGraphTopology(
      checkedSearchFilteredFiles,
      visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly,
      graphRendering,
      maxNodesLimit,
      autoFit
    );
  }, [
    isReady,
    checkedSearchFilteredFiles,
    visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
    attributesVisible,
    methodsVisible,
    selectedEntity,
    showSelectedOnly,
    graphRendering,
    maxNodesLimit,
    autoFit,
    updateGraphTopology,
  ]);

  useEffect(() => {
    if (isReady && autoFit && cyRef.current) {
      const timer = setTimeout(() => {
        if (cyRef.current && !cyRef.current.destroyed() && cyRef.current.nodes().not('.folder').length > 0) {
          cyRef.current.fit(undefined, 30);
          cyRef.current.center();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isReady, visibleNodeIdsKey, autoFit, cyRef]);

  return (
    <div className="relative inset-0 outline-none w-full h-full overflow-hidden">
      <GraphToolbar />

      <div
        ref={containerRef}
        className="z-0 absolute inset-0 w-full h-full"
        style={
          showGrid
            ? {
                backgroundImage: isDarkMode
                  ? 'radial-gradient(#334155 1.2px, transparent 1.2px)'
                  : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
                backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
                backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`,
              }
            : undefined
        }
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

          const isCheckedInPlan = selectedContextFiles[file.id] !== false;

          const impactedMembers: string[] = [];
          if (isCheckedInPlan) {
            impactedSet.forEach((item) => {
              if (isMemberKeyForFileToken(item, file.id)) {
                impactedMembers.push(extractMemberIdFromKeyToken(item));
              }
            });
          }

          const isTargetPath = isCheckedInPlan && pathLines.some(
            (p) => p === file.id || p === file.path || (file.path && file.path.endsWith(p))
          );
          const isOrigin = isCheckedInPlan && selectedEntity?.nodeId === file.id;
          const isDependency = isCheckedInPlan && impactedSet.has(file.id) && !isOrigin && !isTargetPath;
          const isFocused = focusedNodeId === file.id;

          const nodeData: UmlClassNodeData = {
            ...file,
            isOrigin,
            isTargetPath,
            isDependency,
            isFocused,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember,
            attributesVisible,
            methodsVisible,
          };

          return (
            <div
              key={file.id}
              className={`absolute transition-all duration-75 ease-out pointer-events-none ${isFocused || isOrigin || isTargetPath ? 'z-30' : 'z-20'}`}
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              {file.type === 'config' ? (
                graphRendering === 'rounded' ? (
                  <RoundConfigNode id={file.id} data={nodeData} />
                ) : graphRendering === 'minized' ? (
                  <MinimizedConfigNode id={file.id} data={nodeData} />
                ) : graphRendering === 'condensed' ? (
                  <CondensedConfigNode id={file.id} data={nodeData} />
                ) : (
                  <ConfigNode id={file.id} data={nodeData} />
                )
              ) : graphRendering === 'rounded' ? (
                <RoundClassNode id={file.id} data={nodeData} />
              ) : graphRendering === 'minized' ? (
                <MinimizedClassNode id={file.id} data={nodeData} />
              ) : graphRendering === 'condensed' ? (
                <CondensedClassNode id={file.id} data={nodeData} />
              ) : (
                <UmlClassNode id={file.id} data={nodeData} />
              )}
            </div>
          );
        })}
      </div>

      <GraphMinimap />
    </div>
  );
}
