import { useCallback } from 'react';
import cytoscape from 'cytoscape';
import { CodebaseData, CodebaseFile, Dependency } from '@/services/codebase';

export function useGraphTopology(cyRef: React.RefObject<cytoscape.Core | null>) {
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

    cy.elements().remove();

    const filesByFolder: Record<string, CodebaseFile[]> = {};
    searchFilteredFiles.forEach(file => {
      const folderKey = file.path.split('/')[0] || 'other';
      if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
      filesByFolder[folderKey].push(file);
    });

    const folderBaseX: Record<string, number> = { frontend: 40, backend: 460, config: 1270 };

    Object.keys(folderPositions).forEach(folderKey => {
      if ((filesByFolder[folderKey] || []).length > 0) {
        cy.add({ data: { id: `folder__${folderKey}`, label: folderPositions[folderKey].label }, classes: 'folder' });
      }
    });

    Object.entries(folderPositions).forEach(([folderKey]) => {
      const folderFiles = filesByFolder[folderKey] || [];
      const maxNodeWidth = folderKey === 'config' ? 320 : 288;
      const maxNodeHeight = folderKey === 'config' ? 240 : 280;

      folderFiles.forEach((file, index) => {
        const absX = folderBaseX[folderKey] + 30 + (index % 2) * (maxNodeWidth + 50) + maxNodeWidth / 2;
        const absY = 80 + Math.floor(index / 2) * (maxNodeHeight + 50) + maxNodeHeight / 2;
        cy.add({
          data: { id: file.id, parent: `folder__${folderKey}`, width: maxNodeWidth, height: maxNodeHeight },
          position: { x: absX, y: absY }
        });
      });
    });

    codebase.dependencies.forEach((dep: Dependency) => {
      if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode] &&
          searchFilteredFiles.some(f => f.id === dep.sourceNode) &&
          searchFilteredFiles.some(f => f.id === dep.targetNode)) {

        const isEdgeImpacted = impactedSet.has(dep.sourceHandle === 'header' ? dep.sourceNode : `${dep.sourceNode}__member__${dep.sourceHandle}`) &&
                               impactedSet.has(dep.targetHandle === 'header' ? dep.targetNode : `${dep.targetNode}__member__${dep.targetHandle}`);

        cy.add({
          data: { id: dep.id, source: dep.sourceNode, target: dep.targetNode, label: dep.label },
          classes: isEdgeImpacted ? 'impacted' : ''
        });
      }
    });

    cy.layout({ name: currentLayout === 'preset' ? 'grid' : currentLayout, animate: false }).run();
  }, [cyRef]);

  return { updateGraphTopology };
}
