import { useCallback, useRef } from 'react';
import cytoscape from 'cytoscape';
import {
  CodebaseData,
  CodebaseFile,
  Dependency,
  FOLDER_BASE_X_POSITIONS_CONFIG,
  NODE_DIMENSIONS_CONFIG,
} from '@/shared/services/graph-rag-explorer';
import { buildMemberKeyToken } from '@/services/view/graph-view.service';

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

    // Clé unique de topologie pour éviter de ré-exécuter cy.layout().run() si les données n'ont pas changé
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

    Object.keys(folderPositions).forEach(folderKey => {
      if ((filesByFolder[folderKey] || []).length > 0) {
        cy.add({ data: { id: `folder__${folderKey}`, label: folderPositions[folderKey].label }, classes: 'folder' });
      }
    });

    Object.entries(folderPositions).forEach(([folderKey]) => {
      const folderFiles = filesByFolder[folderKey] || [];
      const dimensions = folderKey === 'config' ? NODE_DIMENSIONS_CONFIG.config : NODE_DIMENSIONS_CONFIG.default;
      const baseX = FOLDER_BASE_X_POSITIONS_CONFIG[folderKey as keyof typeof FOLDER_BASE_X_POSITIONS_CONFIG] || 40;

      folderFiles.forEach((file, index) => {
        const absX = baseX + 30 + (index % 2) * (dimensions.width + 50) + dimensions.width / 2;
        const absY = 80 + Math.floor(index / 2) * (dimensions.height + 50) + dimensions.height / 2;
        cy.add({
          data: { id: file.id, parent: `folder__${folderKey}`, width: dimensions.width, height: dimensions.height },
          position: { x: absX, y: absY }
        });
      });
    });

    codebase.dependencies.forEach((dep: Dependency) => {
      if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode] &&
          searchFilteredFiles.some(f => f.id === dep.sourceNode) &&
          searchFilteredFiles.some(f => f.id === dep.targetNode)) {

        const sourceKeyMember = buildMemberKeyToken(dep.sourceNode, dep.sourceHandle);
        const targetKeyMember = buildMemberKeyToken(dep.targetNode, dep.targetHandle);
        const isEdgeImpacted = impactedSet.has(dep.sourceHandle === 'header' ? dep.sourceNode : sourceKeyMember) &&
                               impactedSet.has(dep.targetHandle === 'header' ? dep.targetNode : targetKeyMember);

        cy.add({
          data: { id: dep.id, source: dep.sourceNode, target: dep.targetNode, label: dep.label },
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
