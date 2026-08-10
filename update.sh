#!/usr/bin/env bash
set -e

# Ensure target directory exists
mkdir -p webview/src/features/explorer/wksp-cnt-graph/components/graph

# Update useGraphTopology.ts with dynamic horizontal node spacing
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
  const lastTopologyKeyRef = useRef<string>('');

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

    const topologyKey = JSON.stringify({
      files: effectiveFiles.map(f => f.id),
      visible: visibleFiles,
      impacted: Array.from(impactedSet),
      layout: currentLayout,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly
    });

    if (lastTopologyKeyRef.current === topologyKey) {
      return;
    }
    lastTopologyKeyRef.current = topologyKey;

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

    // Calculate dynamic horizontal gap: at least 50px or scaled to maximum dependency label length
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
          (impactedSet.has(sourceNodeId) || impactedSet.has(sourceKeyMember)) &&
          (impactedSet.has(targetNodeId) || impactedSet.has(targetKeyMember));

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

    cy.fit(undefined, 40);
    cy.center();

  }, [cyRef]);

  return { updateGraphTopology };
}
EOF

echo "✅ feat: Configured horizontal node gap to be at least 50px or dynamically scaled according to dependency label character length!"

# Rebuild webview
npm run build:webview
