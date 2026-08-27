import { useCallback, useRef } from 'react';
import cytoscape from 'cytoscape';
import {
  CodebaseData,
  CodebaseFile,
  Dependency,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';
import { buildMemberKeyToken } from '@/services/view/graph-view.service';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

const FOLDER_BASE_X_POSITIONS_CONFIG = {
  frontend: 40,
  backend: 490,
  config: 940,
  other: 1390,
};

function getNodeDimensions(
  file: CodebaseFile,
  attributesVisible: boolean,
  methodsVisible: boolean,
  graphRendering: GraphRendering = 'uml'
): { width: number; height: number } {
  if (graphRendering === 'rounded') {
    return { width: 64, height: 64 };
  }

  if (graphRendering === 'minized') {
    return { width: 150, height: 32 };
  }

  if (graphRendering === 'condensed') {
    if (file.type === 'config') {
      return { width: 175, height: 42 };
    }
    return { width: 175, height: 68 };
  }

  if (file.type === 'config') {
    return { width: 320, height: 240 };
  }

  const baseHeaderHeight = 76;

  let attrHeight = 0;
  if (attributesVisible) {
    const attrCount = file.attributes?.length || 0;
    attrHeight = attrCount > 0 ? 28 + attrCount * 18 : 36;
  }

  let methodHeight = 0;
  if (methodsVisible) {
    const methodCount = file.methods?.length || 0;
    methodHeight = methodCount > 0 ? 28 + methodCount * 32 : 36;
  }

  const totalHeight = baseHeaderHeight + attrHeight + methodHeight;
  return { width: 288, height: totalHeight };
}

function applyCustomHierarchicalLayout(
  cy: cytoscape.Core,
  effectiveFiles: CodebaseFile[],
  codebase: CodebaseData,
  attributesVisible: boolean,
  methodsVisible: boolean,
  graphRendering: GraphRendering
) {
  if (effectiveFiles.length === 0) return;

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  effectiveFiles.forEach(f => {
    inDegree.set(f.id, 0);
    adj.set(f.id, []);
  });

  codebase.dependencies.forEach(dep => {
    const src = dep.sourceNode || dep.source;
    const tgt = dep.targetNode || dep.target;
    if (src && tgt && inDegree.has(src) && inDegree.has(tgt) && src !== tgt) {
      adj.get(src)!.push(tgt);
      inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
    }
  });

  const levelMap = new Map<string, number>();
  const queue: string[] = [];

  effectiveFiles.forEach(f => {
    if ((inDegree.get(f.id) || 0) === 0) {
      levelMap.set(f.id, 0);
      queue.push(f.id);
    }
  });

  if (queue.length === 0 && effectiveFiles.length > 0) {
    levelMap.set(effectiveFiles[0].id, 0);
    queue.push(effectiveFiles[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levelMap.get(curr) || 0;

    const neighbors = adj.get(curr) || [];
    neighbors.forEach(nbr => {
      const nextLevel = currLevel + 1;
      if (!levelMap.has(nbr) || levelMap.get(nbr)! < nextLevel) {
        levelMap.set(nbr, nextLevel);
        queue.push(nbr);
      }
    });
  }

  effectiveFiles.forEach(f => {
    if (!levelMap.has(f.id)) {
      levelMap.set(f.id, 0);
    }
  });

  const maxLevel = Math.max(...Array.from(levelMap.values()), 0);
  const levels: CodebaseFile[][] = Array.from({ length: maxLevel + 1 }, () => []);

  effectiveFiles.forEach(f => {
    const lvl = levelMap.get(f.id) || 0;
    levels[lvl].push(f);
  });

  const edgeLabelLengths = new Map<string, number>();
  codebase.dependencies.forEach(dep => {
    const src = dep.sourceNode || dep.source;
    const tgt = dep.targetNode || dep.target;
    const label = dep.label || '';
    if (src && tgt && label) {
      const key1 = `${src}__${tgt}`;
      const key2 = `${tgt}__${src}`;
      edgeLabelLengths.set(key1, Math.max(edgeLabelLengths.get(key1) || 0, label.length));
      edgeLabelLengths.set(key2, Math.max(edgeLabelLengths.get(key2) || 0, label.length));
    }
  });

  let currentY = 80;

  levels.forEach((levelFiles) => {
    if (levelFiles.length === 0) return;

    const levelHeights = levelFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible, graphRendering).height);
    const maxLevelHeight = Math.max(...levelHeights, 42);
    const dimsList = levelFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible, graphRendering));

    const gaps: number[] = [];
    for (let i = 0; i < levelFiles.length - 1; i++) {
      const f1 = levelFiles[i].id;
      const f2 = levelFiles[i + 1].id;
      const labelLen = Math.max(
        edgeLabelLengths.get(`${f1}__${f2}`) || 0,
        edgeLabelLengths.get(`${f2}__${f1}`) || 0
      );
      const gapX = labelLen > 0 ? Math.round(labelLen * 7) + 20 : 10;
      gaps.push(gapX);
    }

    const totalLevelWidth = dimsList.reduce((acc, d) => acc + d.width, 0) + gaps.reduce((acc, g) => acc + g, 0);
    let currentX = 600 - totalLevelWidth / 2;

    levelFiles.forEach((file, idx) => {
      const cyNode = cy.getElementById(file.id);
      const dims = dimsList[idx];

      if (cyNode && cyNode.length > 0) {
        cyNode.position({
          x: currentX + dims.width / 2,
          y: currentY + maxLevelHeight / 2
        });
      }

      currentX += dims.width + (gaps[idx] || 10);
    });

    currentY += maxLevelHeight + 50;
  });
}

export function useGraphTopology(cyRef: React.RefObject<cytoscape.Core | null>) {
  const lastStructureKeyRef = useRef<string>('');

  const updateGraphTopology = useCallback((
    searchFilteredFiles: CodebaseFile[],
    visibleFiles: Record<string, boolean>,
    codebase: CodebaseData,
    impactedSet: Set<string>,
    currentLayout: string,
    folderPositions: Record<string, { label: string }>,
    attributesVisible: boolean = false,
    methodsVisible: boolean = true,
    selectedEntity: SelectedEntity | null = null,
    showSelectedOnly: boolean = false,
    graphRendering: GraphRendering = 'rounded',
    maxNodesLimit: number = 50,
    autoFit: boolean = false
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    let effectiveFiles = (showSelectedOnly && selectedEntity)
      ? searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id))
      : searchFilteredFiles;

    if (maxNodesLimit > 0 && effectiveFiles.length > maxNodesLimit) {
      effectiveFiles = effectiveFiles.slice(0, maxNodesLimit);
    }

    const structureKey = JSON.stringify({
      files: effectiveFiles.map(f => f.id),
      visible: visibleFiles,
      layout: currentLayout,
      attributesVisible,
      methodsVisible,
      graphRendering,
      maxNodesLimit,
      deps: codebase.dependencies.map(d => d.id)
    });

    const isStructureChanged = lastStructureKeyRef.current !== structureKey;

    if (isStructureChanged) {
      lastStructureKeyRef.current = structureKey;

      cy.elements().remove();

      const filesByFolder: Record<string, CodebaseFile[]> = {};
      effectiveFiles.forEach(file => {
        const folderKey = file.path.split('/')[0] || 'other';
        if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
        filesByFolder[folderKey].push(file);
      });

      const allFolderKeys = Array.from(
        new Set([...Object.keys(folderPositions), ...Object.keys(filesByFolder)])
      );

      let maxLabelLength = 0;
      codebase.dependencies.forEach(dep => {
        if (dep.label) {
          maxLabelLength = Math.max(maxLabelLength, dep.label.length);
        }
      });
      const dynamicGapX = maxLabelLength > 0 ? Math.round(maxLabelLength * 7) + 20 : 10;
      const gapY = 50;

      allFolderKeys.forEach(folderKey => {
        if ((filesByFolder[folderKey] || []).length > 0) {
          const label = folderPositions[folderKey]?.label || `📂 ${folderKey.charAt(0).toUpperCase() + folderKey.slice(1)}`;
          cy.add({ data: { id: `folder__${folderKey}`, label }, classes: 'folder' });
        }
      });

      allFolderKeys.forEach((folderKey, folderIdx) => {
        const folderFiles = filesByFolder[folderKey] || [];
        if (folderFiles.length === 0) return;

        const baseX = FOLDER_BASE_X_POSITIONS_CONFIG[folderKey as keyof typeof FOLDER_BASE_X_POSITIONS_CONFIG] || (40 + folderIdx * 450);

        const numCols = 2;
        let currentY = 80;
        const rowCount = Math.ceil(folderFiles.length / numCols);

        for (let r = 0; r < rowCount; r++) {
          const rowFiles = folderFiles.slice(r * numCols, (r + 1) * numCols);
          const rowHeights = rowFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible, graphRendering).height);
          const maxRowHeight = Math.max(...rowHeights, 42);

          rowFiles.forEach((file, c) => {
            const dims = getNodeDimensions(file, attributesVisible, methodsVisible, graphRendering);
            const absX = baseX + 30 + c * (dims.width + dynamicGapX) + dims.width / 2;
            const absY = currentY + dims.height / 2;

            cy.add({
              data: {
                id: file.id,
                name: file.name,
                path: file.path || file.id,
                parent: `folder__${folderKey}`,
                width: dims.width,
                height: dims.height,
                shape: graphRendering === 'rounded' ? 'ellipse' : 'rectangle'
              },
              position: { x: absX, y: absY }
            });
          });

          currentY += maxRowHeight + gapY;
        }
      });

      codebase.dependencies.forEach((dep: Dependency) => {
        const sourceNodeId = dep.sourceNode || dep.source;
        const targetNodeId = dep.targetNode || dep.target;

        if (
          sourceNodeId &&
          targetNodeId &&
          visibleFiles[sourceNodeId] &&
          visibleFiles[targetNodeId] &&
          cy.getElementById(sourceNodeId).length > 0 &&
          cy.getElementById(targetNodeId).length > 0
        ) {
          cy.add({
            data: { id: dep.id, source: sourceNodeId, target: targetNodeId, label: dep.label }
          });
        }
      });

      if (currentLayout === 'hierarchical' || currentLayout === 'breadthfirst' || currentLayout === 'dagre') {
        applyCustomHierarchicalLayout(cy, effectiveFiles, codebase, attributesVisible, methodsVisible, graphRendering);
      } else if (currentLayout !== 'preset') {
        cy.layout({
          name: currentLayout,
          animate: false,
          fit: true,
          padding: 30,
        } as cytoscape.LayoutOptions).run();
      }

      cy.fit(undefined, 30);
      if (cy.zoom() > 1 && !autoFit) {
        cy.zoom(1);
      }
      cy.center();
    } else if (autoFit) {
      cy.fit(undefined, 30);
      cy.center();
    }

    codebase.dependencies.forEach((dep: Dependency) => {
      const edge = cy.getElementById(dep.id);
      if (edge && edge.length > 0) {
        const sourceNodeId = dep.sourceNode || dep.source;
        const targetNodeId = dep.targetNode || dep.target;
        const sourceHandle = dep.sourceHandle || 'header';
        const targetHandle = dep.targetHandle || 'header';

        if (sourceNodeId && targetNodeId) {
          const sourceKeyMember = buildMemberKeyToken(sourceNodeId, sourceHandle);
          const targetKeyMember = buildMemberKeyToken(targetNodeId, targetHandle);

          const isEdgeImpacted =
            (impactedSet.has(sourceNodeId) || impactedSet.has(sourceKeyMember)) &&
            (impactedSet.has(targetNodeId) || impactedSet.has(targetKeyMember));

          if (isEdgeImpacted) {
            edge.addClass('impacted');
          } else {
            edge.removeClass('impacted');
          }
        }
      }
    });

  }, [cyRef]);

  return { updateGraphTopology };
}
