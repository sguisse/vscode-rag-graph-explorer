#!/usr/bin/env bash
set -e

mkdir -p webview/src/features/explorer/wksp-cnt-graph/hooks
mkdir -p webview/src/features/explorer/wksp-cnt-graph/components

# 1. Update useGraphTopology.ts to include name and path in Cytoscape node data
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/hooks/useGraphTopology.ts
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
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

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
    graphRendering: GraphRendering = 'uml'
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    const effectiveFiles = (showSelectedOnly && selectedEntity)
      ? searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id))
      : searchFilteredFiles;

    const structureKey = JSON.stringify({
      files: effectiveFiles.map(f => f.id),
      visible: visibleFiles,
      layout: currentLayout,
      attributesVisible,
      methodsVisible,
      graphRendering,
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
      if (cy.zoom() > 1) {
        cy.zoom(1);
      }
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
EOF

# 2. Update useCytoscapeInstance.ts to dynamically set/remove 'data-tooltip' on containerNode for the global Tooltip component
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/hooks/useCytoscapeInstance.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(
  isDarkMode: boolean,
  onNodeSelect: (nodeId: string) => void,
  onNodeDoubleClick?: (nodeId: string) => void,
  onNodeCmdClick?: (nodeId: string) => void
) {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const onNodeSelectRef = useRef(onNodeSelect);
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  const onNodeDoubleClickRef = useRef(onNodeDoubleClick);
  useEffect(() => {
    onNodeDoubleClickRef.current = onNodeDoubleClick;
  }, [onNodeDoubleClick]);

  const onNodeCmdClickRef = useRef(onNodeCmdClick);
  useEffect(() => {
    onNodeCmdClickRef.current = onNodeCmdClick;
  }, [onNodeCmdClick]);

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
        { selector: 'node[width][height]', style: { 'shape': 'data(shape)' as any, 'opacity': 0.0, 'width': 'data(width)', 'height': 'data(height)' } },
        { selector: 'node.folder', style: { 'shape': 'rectangle', 'opacity': 1.0, 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -12, 'font-size': '12px', 'font-family': 'monospace', 'font-weight': 'bold', 'color': isDarkMode ? '#94a3b8' : '#475569', 'background-opacity': 0.02, 'background-color': isDarkMode ? '#475569' : '#94a3b8', 'border-width': '2px', 'border-color': isDarkMode ? '#334155' : '#cbd5e1', 'border-style': 'dashed', 'padding': '40' } },
        { selector: 'edge', style: { 'width': 2, 'line-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'font-family': 'monospace', 'color': isDarkMode ? '#94a3b8' : '#475569', 'text-background-opacity': 1, 'text-background-color': isDarkMode ? '#18181b' : '#ffffff', 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle' } },
        { selector: 'edge.impacted', style: { 'line-color': '#eab308', 'target-arrow-color': '#eab308', 'width': 3.5, 'color': isDarkMode ? '#fef08a' : '#854d0e', 'text-background-color': isDarkMode ? '#422006' : '#fef9c3', 'text-background-opacity': 1 } }
      ],
      userZoomingEnabled: false,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (!cyRef.current || cyRef.current.destroyed()) return;
      const currentCy = cyRef.current;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl) {
        const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const currentZoom = currentCy.zoom();
        const minZoom = currentCy.minZoom();
        const maxZoom = currentCy.maxZoom();
        let newZoom = currentZoom * zoomFactor;
        if (newZoom < minZoom) newZoom = minZoom;
        if (newZoom > maxZoom) newZoom = maxZoom;

        const rect = containerNode.getBoundingClientRect();
        const renderedPosition = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        currentCy.zoom({
          level: newZoom,
          renderedPosition: renderedPosition,
        });
      } else {
        const pan = currentCy.pan();
        currentCy.pan({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        });
      }
    };

    containerNode.addEventListener('wheel', handleWheel, { capture: true, passive: false });

    // Node Cursor & data-tooltip Attribute Handlers for the global Tooltip component
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      if (!node.hasClass('folder') && containerNode) {
        containerNode.style.cursor = 'pointer';
        const name = node.data('name') || node.id();
        const path = node.data('path') || '';
        const tooltipText = path ? `${name} (${path})` : name;
        if (tooltipText) {
          containerNode.setAttribute('data-tooltip', tooltipText);
        }
      }
    });

    cy.on('mouseout', 'node', () => {
      if (containerNode) {
        containerNode.style.cursor = 'default';
        containerNode.removeAttribute('data-tooltip');
      }
    });

    // Single / Cmd + Click
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (!node.hasClass('folder')) {
        const nodeId = node.id();
        const nodePath = node.data('path') || node.data('absolutePath') || node.data('filePath') || nodeId;
        if (nodePath) {
          logInfo(`Cytoscape node single-clicked: ${nodeId} (${nodePath}). Revealing in VS Code Explorer & copying...`);
          vsCodeApiService.revealInExplorer(nodePath);
          vsCodeApiService.copyToClipboard(nodePath);
        }
        const origEvt = evt.originalEvent as MouseEvent | undefined;
        if (origEvt && (origEvt.metaKey || origEvt.ctrlKey)) {
          onNodeCmdClickRef.current?.(nodeId);
        } else {
          onNodeSelectRef.current(nodeId);
        }
      }
    });

    // Double Click
    cy.on('dbltap', 'node', (evt) => {
      if (!evt.target.hasClass('folder')) {
        const nodeId = evt.target.id();
        const nodePath = evt.target.data('path') || evt.target.data('absolutePath') || evt.target.data('filePath') || nodeId;
        if (nodePath) {
          logInfo(`Cytoscape node double-clicked: ${nodeId} (${nodePath}). Opening in VS Code...`);
          vsCodeApiService.revealInExplorer(nodePath);
          vsCodeApiService.openFile(nodePath);
        }
        onNodeDoubleClickRef.current?.(nodeId);
      }
    });

    const syncGraph = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (!cyRef.current || cyRef.current.destroyed()) return;

        const currentCy = cyRef.current;
        const zoom = currentCy.zoom();
        const pan = currentCy.pan();
        const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};

        currentCy.nodes().forEach(node => {
          if (node.hasClass('folder')) return;
          const bb = node.boundingBox({ includeLabels: false, includeEdges: false });
          positions[node.id()] = {
            x: Math.round(bb.x1),
            y: Math.round(bb.y1),
            w: Math.round(bb.w),
            h: Math.round(bb.h)
          };
        });

        setGraphState(prev => {
          const zoomDiff = Math.abs(prev.zoom - zoom);
          const panXDiff = Math.abs(prev.pan.x - pan.x);
          const panYDiff = Math.abs(prev.pan.y - pan.y);

          let positionsChanged = Object.keys(prev.nodePositions).length !== Object.keys(positions).length;
          if (!positionsChanged) {
            for (const key of Object.keys(positions)) {
              const p1 = prev.nodePositions[key];
              const p2 = positions[key];
              if (!p1 || Math.abs(p1.x - p2.x) > 1 || Math.abs(p1.y - p2.y) > 1 || Math.abs(p1.w - p2.w) > 1 || Math.abs(p1.h - p2.h) > 1) {
                positionsChanged = true;
                break;
              }
            }
          }

          if (zoomDiff < 0.001 && panXDiff < 0.5 && panYDiff < 0.5 && !positionsChanged) {
            return prev;
          }

          return { zoom, pan: { x: pan.x, y: pan.y }, nodePositions: positions };
        });
      });
    };

    cy.on('dragfree pan zoom layoutstop', syncGraph);

    requestAnimationFrame(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
      }
    });

    return () => {
      containerNode.removeEventListener('wheel', handleWheel, { capture: true });
      if (containerNode) {
        containerNode.removeAttribute('data-tooltip');
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      cy.destroy();
      cyRef.current = null;
    };
  }, [containerNode, isDarkMode]);

  return { containerRef, cyRef, graphState, isReady: !!containerNode };
}
EOF

echo "✅ feat/fix: Integrated Cytoscape hover events with global data-tooltip component while keeping mouse drag, pan, zoom and cursor selection active!"
