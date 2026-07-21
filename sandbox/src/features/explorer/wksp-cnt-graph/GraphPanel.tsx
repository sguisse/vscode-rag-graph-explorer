import React from 'react';
import { Info } from 'lucide-react';
import { FolderNode, UmlClassNode, ConfigNode, UmlClassNodeData } from './components/graph/GraphUmlShapes';
import { codebaseService, SelectedEntity, CodebaseFile, isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/codebase';

interface GraphPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
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

      <div className="top-4 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto">
        <div className="flex items-center gap-2 mb-1"><Info size={14} className="text-primary" /><span className="font-bold">Surgical Analysis (Cytoscape Engine)</span></div>
        <p className="text-[10px] text-muted-foreground">Le drag-and-drop sur les en-têtes et le zoom molette utilisent l'architecture réactive de Cytoscape.</p>
      </div>
    </div>
  );
}
