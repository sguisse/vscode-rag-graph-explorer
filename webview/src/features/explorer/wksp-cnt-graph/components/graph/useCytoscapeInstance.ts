import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const onNodeSelectRef = useRef(onNodeSelect);
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

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
        { selector: 'node[width][height]', style: { 'shape': 'rectangle', 'opacity': 0.0, 'width': 'data(width)', 'height': 'data(height)' } },
        { selector: 'node.folder', style: { 'shape': 'rectangle', 'opacity': 1.0, 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -12, 'font-size': '12px', 'font-family': 'monospace', 'font-weight': 'bold', 'color': isDarkMode ? '#94a3b8' : '#475569', 'background-opacity': 0.02, 'background-color': isDarkMode ? '#475569' : '#94a3b8', 'border-width': '2px', 'border-color': isDarkMode ? '#334155' : '#cbd5e1', 'border-style': 'dashed', 'padding': '40' } },
        { selector: 'edge', style: { 'width': 2, 'line-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'font-family': 'monospace', 'color': isDarkMode ? '#94a3b8' : '#475569', 'text-background-opacity': 1, 'text-background-color': isDarkMode ? '#18181b' : '#ffffff', 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle' } },
        { selector: 'edge.impacted', style: { 'line-color': '#f97316', 'target-arrow-color': '#f97316', 'width': 4 } }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      if (!evt.target.hasClass('folder')) {
        onNodeSelectRef.current(evt.target.id());
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
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      cy.destroy();
      cyRef.current = null;
    };
  }, [containerNode, isDarkMode]);

  return { containerRef, cyRef, graphState, isReady: !!containerNode };
}
