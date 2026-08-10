import { useCallback, useRef } from 'react';
import cytoscape from 'cytoscape';
import {
  CodebaseData,
  CodebaseFile,
  Dependency,
} from '@/shared/services/graph-rag-explorer';
import { buildMemberKeyToken } from '@/services/view/graph-view.service';
import { NODE_DIMENSIONS_CONFIG, FOLDER_BASE_X_POSITIONS_CONFIG } from '@/features/explorer/constants/graph.constants';

export function useGraphTopology(cyRef: React.RefObject<cytoscape.Core | null>) {
  const lastTopologyKeyRef = useRef<string>('');

  const updateGraphTopology = useCallback((
    searchFilteredFiles: CodebaseFile[],
    visibleFiles: Record<string, boolean>,
    codebase: CodebaseData,
    impactedSet: Set<string>,
    currentLayout: string,
    folderPositions: Record<string, { label: string }>
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Unique topology key to avoid re-executing cy.layout().run() if the data has not changed
    const topologyKey = JSON.stringify({
      files: searchFilteredFiles.map(f => f.id),
      visible: visibleFiles,
      impacted: Array.from(impactedSet),
      layout: currentLayout
    });

    if (lastTopologyKeyRef.current === topologyKey) {
      return;
    }
    lastTopologyKeyRef.current = topologyKey;

    cy.elements().remove();

    const filesByFolder: Record<string, CodebaseFile[]> = {};
    searchFilteredFiles.forEach(file => {
      const folderKey = file.path.split('/')[0] || 'other';
      if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
      filesByFolder[folderKey].push(file);
    });

    // Collect all folder keys from positions config and discovered codebase files
    const allFolderKeys = Array.from(
      new Set([...Object.keys(folderPositions), ...Object.keys(filesByFolder)])
    );

    // Create container nodes for folders containing active files
    allFolderKeys.forEach(folderKey => {
      if ((filesByFolder[folderKey] || []).length > 0) {
        const label = folderPositions[folderKey]?.label || `📂 ${folderKey.charAt(0).toUpperCase() + folderKey.slice(1)}`;
        cy.add({ data: { id: `folder__${folderKey}`, label }, classes: 'folder' });
      }
    });

    // Create file nodes inside their respective parent folder containers
    allFolderKeys.forEach((folderKey, folderIdx) => {
      const folderFiles = filesByFolder[folderKey] || [];
      if (folderFiles.length === 0) return;

      const dimensions = folderKey === 'config' ? NODE_DIMENSIONS_CONFIG.config : NODE_DIMENSIONS_CONFIG.default;
      const baseX = FOLDER_BASE_X_POSITIONS_CONFIG[folderKey as keyof typeof FOLDER_BASE_X_POSITIONS_CONFIG] || (40 + folderIdx * 400);

      folderFiles.forEach((file, index) => {
        const absX = baseX + 30 + (index % 2) * (dimensions.width + 50) + dimensions.width / 2;
        const absY = 80 + Math.floor(index / 2) * (dimensions.height + 50) + dimensions.height / 2;
        cy.add({
          data: { id: file.id, parent: `folder__${folderKey}`, width: dimensions.width, height: dimensions.height },
          position: { x: absX, y: absY }
        });
      });
    });

    // Safely render edges with normalized schema handles and element collection length checks
    codebase.dependencies.forEach((dep: Dependency) => {
      const sourceNodeId = dep.sourceNode || dep.source;
      const targetNodeId = dep.targetNode || dep.target;
      const sourceHandle = dep.sourceHandle || 'header';
      const targetHandle = dep.targetHandle || 'header';

      if (
        sourceNodeId &&
        targetNodeId &&
        visibleFiles[sourceNodeId] &&
        visibleFiles[targetNodeId] &&
        cy.getElementById(sourceNodeId).length > 0 &&
        cy.getElementById(targetNodeId).length > 0
      ) {
        const sourceKeyMember = buildMemberKeyToken(sourceNodeId, sourceHandle);
        const targetKeyMember = buildMemberKeyToken(targetNodeId, targetHandle);
        const isEdgeImpacted =
          impactedSet.has(sourceHandle === 'header' ? sourceNodeId : sourceKeyMember) &&
          impactedSet.has(targetHandle === 'header' ? targetNodeId : targetKeyMember);

        cy.add({
          data: { id: dep.id, source: sourceNodeId, target: targetNodeId, label: dep.label },
          classes: isEdgeImpacted ? 'impacted' : ''
        });
      }
    });

    cy.layout({
      name: currentLayout,
      animate: false,
      fit: true,
      padding: 40,
      boundingBox: { x1: 0, y1: 0, w: 2000, h: 2000 }
    } as cytoscape.LayoutOptions).run();

    if (currentLayout === 'preset') {
      cy.fit(undefined, 40);
      cy.center();
    }

  }, [cyRef]);

  return { updateGraphTopology };
}
