#!/usr/bin/env bash
set -e

# Ensure target directory exists
mkdir -p webview/src/features/explorer/wksp-cnt-graph/components/graph

# Update useGraphTopology.ts to add strict type checks for sourceNodeId and targetNodeId
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/components/graph/useGraphTopology.ts
import { useCallback, useRef } from 'react';
import cytoscape from 'cytoscape';
import {
  CodebaseData,
  CodebaseFile,
  Dependency,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';
import { buildMemberKeyToken } from '@/services/view/graph-view.service';
import { FOLDER_BASE_X_POSITIONS_CONFIG } from '@/features/explorer/constants/graph.constants';

function getNodeDimensions(
  file: CodebaseFile,
  attributesVisible: boolean,
  methodsVisible: boolean
): { width: number; height: number } {
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
    showSelectedOnly: boolean = false
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    const effectiveFiles = (showSelectedOnly && selectedEntity)
      ? searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id))
      : searchFilteredFiles;

    // Structural key tracks only physical layout factors (excluding selection/impact state)
    const structureKey = JSON.stringify({
      files: effectiveFiles.map(f => f.id),
      visible: visibleFiles,
      layout: currentLayout,
      attributesVisible,
      methodsVisible,
      deps: codebase.dependencies.map(d => d.id)
    });

    const isStructureChanged = lastStructureKeyRef.current !== structureKey;

    // Only rebuild nodes, rerun layout, fit and center if structural graph definition changes
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
      const dynamicGapX = Math.max(50, maxLabelLength * 8 + 24);

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
        const gapX = dynamicGapX;
        const gapY = 65;

        let currentY = 80;
        const rowCount = Math.ceil(folderFiles.length / numCols);

        for (let r = 0; r < rowCount; r++) {
          const rowFiles = folderFiles.slice(r * numCols, (r + 1) * numCols);
          const rowHeights = rowFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible).height);
          const maxRowHeight = Math.max(...rowHeights, 76);

          rowFiles.forEach((file, c) => {
            const dims = getNodeDimensions(file, attributesVisible, methodsVisible);
            const absX = baseX + 30 + c * (dims.width + gapX) + dims.width / 2;
            const absY = currentY + dims.height / 2;

            cy.add({
              data: {
                id: file.id,
                parent: `folder__${folderKey}`,
                width: dims.width,
                height: dims.height
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

      cy.layout({
        name: currentLayout,
        animate: false,
        fit: true,
        padding: 40,
        boundingBox: { x1: 0, y1: 0, w: 2000, h: 2000 }
      } as cytoscape.LayoutOptions).run();

      cy.fit(undefined, 40);
      cy.center();
    }

    // Dynamically update highlighted dependency classes on existing edges without resetting camera zoom or pan
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
EOF

npm run compile

echo "✅ fix(ts-compile): Added string type guards for sourceNodeId and targetNodeId in useGraphTopology to resolve build compilation errors!"
