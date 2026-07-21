import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [graphState, setGraphState] = useState<GraphState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodePositions: {}
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
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
        onNodeSelect(evt.target.id());
      }
    });

    const syncGraph = () => {
      const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
      cy.nodes().forEach(node => {
        if (node.hasClass('folder')) return;
        const bb = node.boundingBox({ includeLabels: false, includeEdges: false });
        positions[node.id()] = { x: bb.x1, y: bb.y1, w: bb.w, h: bb.h };
      });
      setGraphState({ zoom: cy.zoom(), pan: cy.pan(), nodePositions: positions });
    };

    cy.on('drag pan zoom render', syncGraph);

    return () => cy.destroy();
  }, [isDarkMode, onNodeSelect]);

  return { containerRef, cyRef, graphState };
}
