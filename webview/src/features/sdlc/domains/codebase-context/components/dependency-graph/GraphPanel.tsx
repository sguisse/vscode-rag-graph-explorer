import React from 'react';
import { FolderNode, UmlClassNode, ConfigNode } from './components/GraphUmlShapes';
import { UmlClassNodeData } from './components/graph-common-shapes';
import {
  CondensedClassNode,
  CondensedConfigNode
} from './components/GraphCondensedShapes';
import {
  RoundClassNode,
  RoundConfigNode
} from './components/GraphRoundedShapes';
import {
  MinimizedClassNode,
  MinimizedConfigNode
} from './components/GraphMinizedShapes';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/view/graph-view.service';
import { useGraphPanel } from './hooks/use-graph-panel';
import { GraphToolbar } from './GraphToolbar';
import { useExplorerStore } from '@/features/sdlc/domains/codebase-context/store/useCodebaseDomainState';

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
  const graphRendering = useExplorerStore((s) => s.graphRendering) || 'rounded';

  const {
    effectiveFolderPositions,
    effectiveSearchFilteredFiles,
  } = useGraphPanel(
    folderPositions,
    graphState.nodePositions,
    showSelectedOnly,
    selectedEntity,
    searchFilteredFiles,
    impactedSet
  );

  return (
    <div className="relative inset-0 outline-none w-full h-full overflow-hidden">
      <GraphToolbar />

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
                graphRendering === 'rounded' ? (
                  <RoundConfigNode id={file.id} data={nodeData} />
                ) : graphRendering === 'minized' ? (
                  <MinimizedConfigNode id={file.id} data={nodeData} />
                ) : graphRendering === 'condensed' ? (
                  <CondensedConfigNode id={file.id} data={nodeData} />
                ) : (
                  <ConfigNode id={file.id} data={nodeData} />
                )
              ) : (
                graphRendering === 'rounded' ? (
                  <RoundClassNode id={file.id} data={nodeData} />
                ) : graphRendering === 'minized' ? (
                  <MinimizedClassNode id={file.id} data={nodeData} />
                ) : graphRendering === 'condensed' ? (
                  <CondensedClassNode id={file.id} data={nodeData} />
                ) : (
                  <UmlClassNode id={file.id} data={nodeData} />
                )
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
