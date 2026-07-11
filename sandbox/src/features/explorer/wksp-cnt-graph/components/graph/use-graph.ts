import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';

interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useGraph(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [graphState, setGraphState] = useState<GraphState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodePositions: {}
  });

  // 1. Initialize Cytoscape Instance
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
      if(!evt.target.hasClass('folder')) {
        onNodeSelect(evt.target.id());
      }
    });

    const syncGraph = () => {
      const positions: Record<string, any> = {};
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

  // 2. Method to re-initialize and render graph topology with new/filtered codebase data
  const updateGraphTopology = useCallback((
    searchFilteredFiles: any[],
    visibleFiles: Record<string, boolean>,
    codebase: { files: any[], dependencies: any[] },
    impactedSet: Set<string>,
    currentLayout: string,
    folderPositions: Record<string, any>
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Clear existing topology
    cy.elements().remove();

    const filesByFolder: Record<string, any[]> = {};
    searchFilteredFiles.forEach(file => {
      const folderKey = file.path.split('/')[0] || 'other';
      if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
      filesByFolder[folderKey].push(file);
    });

    const folderBaseX: Record<string, number> = { 'frontend': 40, 'backend': 460, 'config': 1270 };

    // Create Folder Wrappers
    Object.keys(folderPositions).forEach(folderKey => {
      if ((filesByFolder[folderKey] || []).length > 0) {
        cy.add({ data: { id: `folder__${folderKey}`, label: folderPositions[folderKey].label }, classes: 'folder' });
      }
    });

    // Create Nodes
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

    // Create Edges
    codebase.dependencies.forEach(dep => {
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

    // Run layout algorithm
    cy.layout({ name: currentLayout === 'preset' ? 'grid' : currentLayout, animate: false }).run();
  }, []);

  return { containerRef, cyRef, graphState, updateGraphTopology };
}
