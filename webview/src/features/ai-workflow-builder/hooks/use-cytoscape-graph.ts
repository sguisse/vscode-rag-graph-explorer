import { useCallback } from 'react';
import { useWorkflowStore } from './use-workflow-store';
import { getTopologicalSortOrder } from '../utils/dag-engine.utils';

export function useCytoscapeGraph() {
  const { nodes, edges, updateNodePosition, setZoomLevel, zoomLevel } = useWorkflowStore();

  // Auto-rearrange layout using topological column positioning
  const rearrangeLayout = useCallback(() => {
    const sortedNodes = getTopologicalSortOrder(nodes, edges);
    const startX = 80;
    const startY = 80;
    const colSpacing = 320;
    const rowSpacing = 260;

    const layers = new Map<string, number>();
    sortedNodes.forEach((node, idx) => {
      const parentEdges = edges.filter((e) => e.target === node.id);
      let maxParentLayer = -1;
      parentEdges.forEach((e) => {
        const parentLayer = layers.get(e.source) ?? 0;
        if (parentLayer > maxParentLayer) maxParentLayer = parentLayer;
      });
      layers.set(node.id, maxParentLayer + 1);
    });

    const layerNodeCounts = new Map<number, number>();

    sortedNodes.forEach((node) => {
      const layer = layers.get(node.id) || 0;
      const count = layerNodeCounts.get(layer) || 0;
      layerNodeCounts.set(layer, count + 1);

      const x = startX + layer * colSpacing;
      const y = startY + count * rowSpacing;

      updateNodePosition(node.id, { x, y });
    });
  }, [nodes, edges, updateNodePosition]);

  const zoomToFit = useCallback(() => {
    setZoomLevel(100);
  }, [setZoomLevel]);

  return {
    rearrangeLayout,
    zoomToFit,
    zoomLevel,
  };
}
