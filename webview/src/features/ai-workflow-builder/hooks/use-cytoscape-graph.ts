import { useCallback } from 'react';
import { useWorkflowStore } from './use-workflow-store';
import { getTopologicalSortOrder } from '../utils/dag-engine.utils';
import { WorkflowNode } from '../model-ui';

export type LayoutOrientation = 'horizontal-steps' | 'vertical-steps' | 'horizontal-grid' | 'vertical-grid';

export function useCytoscapeGraph() {
  const { nodes, edges, updateNodePosition, setZoomLevel, setPanOffset, zoomLevel } = useWorkflowStore();

  const isSatelliteNode = (node: WorkflowNode): boolean => {
    return (
      node.type === 'annotation' ||
      node.type === 'argument' ||
      node.type === 'searchTool'
    );
  };

  const rearrangeLayout = useCallback(
    (orientation: LayoutOrientation = 'horizontal-steps') => {
      if (nodes.length === 0) return;

      const stepNodes = nodes.filter((n) => !isSatelliteNode(n));
      const satelliteNodes = nodes.filter((n) => isSatelliteNode(n));

      const sortedSteps = getTopologicalSortOrder(stepNodes, edges);

      const startX = 100;
      const startY = 120;

      if (orientation === 'horizontal-steps') {
        const stepSpacingX = 360;
        const stepY = startY + 220;

        // Position main pipeline step nodes horizontally
        sortedSteps.forEach((stepNode, idx) => {
          const posX = startX + idx * stepSpacingX;
          updateNodePosition(stepNode.id, { x: posX, y: stepY });
        });

        // Position satellites relative to connected step nodes
        satelliteNodes.forEach((satNode) => {
          const connectedEdge = edges.find((e) => e.source === satNode.id || e.target === satNode.id);
          const relatedStepId = connectedEdge ? (connectedEdge.source === satNode.id ? connectedEdge.target : connectedEdge.source) : null;
          const stepIndex = sortedSteps.findIndex((s) => s.id === relatedStepId);

          if (stepIndex >= 0) {
            const stepX = startX + stepIndex * stepSpacingX;
            if (satNode.type === 'annotation') {
              updateNodePosition(satNode.id, { x: stepX - 40, y: stepY - 260 });
            } else if (satNode.type === 'argument') {
              updateNodePosition(satNode.id, { x: stepX - 260, y: stepY + 20 });
            } else {
              updateNodePosition(satNode.id, { x: stepX, y: stepY + 280 });
            }
          } else {
            updateNodePosition(satNode.id, { x: startX + sortedSteps.length * stepSpacingX, y: stepY });
          }
        });
      } else if (orientation === 'vertical-steps') {
        const stepSpacingY = 300;
        const stepX = startX + 300;

        // Position main pipeline step nodes vertically
        sortedSteps.forEach((stepNode, idx) => {
          const posY = startY + idx * stepSpacingY;
          updateNodePosition(stepNode.id, { x: stepX, y: posY });
        });

        // Position satellites relative to connected step nodes
        satelliteNodes.forEach((satNode) => {
          const connectedEdge = edges.find((e) => e.source === satNode.id || e.target === satNode.id);
          const relatedStepId = connectedEdge ? (connectedEdge.source === satNode.id ? connectedEdge.target : connectedEdge.source) : null;
          const stepIndex = sortedSteps.findIndex((s) => s.id === relatedStepId);

          if (stepIndex >= 0) {
            const posY = startY + stepIndex * stepSpacingY;
            if (satNode.type === 'annotation') {
              updateNodePosition(satNode.id, { x: stepX + 320, y: posY });
            } else if (satNode.type === 'argument') {
              updateNodePosition(satNode.id, { x: stepX - 280, y: posY });
            } else {
              updateNodePosition(satNode.id, { x: stepX - 280, y: posY + 120 });
            }
          } else {
            updateNodePosition(satNode.id, { x: stepX + 320, y: startY + sortedSteps.length * stepSpacingY });
          }
        });
      } else if (orientation === 'horizontal-grid') {
        const allSorted = getTopologicalSortOrder(nodes, edges);
        const colSpacing = 320;
        const rowSpacing = 260;
        allSorted.forEach((node, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          updateNodePosition(node.id, { x: startX + col * colSpacing, y: startY + row * rowSpacing });
        });
      } else if (orientation === 'vertical-grid') {
        const allSorted = getTopologicalSortOrder(nodes, edges);
        const colSpacing = 320;
        const rowSpacing = 260;
        allSorted.forEach((node, idx) => {
          const row = idx % 3;
          const col = Math.floor(idx / 3);
          updateNodePosition(node.id, { x: startX + col * colSpacing, y: startY + row * rowSpacing });
        });
      }
    },
    [nodes, edges, updateNodePosition]
  );

  const zoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    const container = document.getElementById('workflow-canvas-container');
    const cWidth = container?.clientWidth || 800;
    const cHeight = container?.clientHeight || 600;

    const padding = 80;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      const w = n.data.isCollapsed ? 150 : (n.width || 240);
      const h = n.data.isCollapsed ? 150 : (n.height || 200);
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
    });

    const bWidth = Math.max(maxX - minX, 100);
    const bHeight = Math.max(maxY - minY, 100);

    const scaleX = (cWidth - padding * 2) / bWidth;
    const scaleY = (cHeight - padding * 2) / bHeight;
    let targetScale = Math.min(scaleX, scaleY);
    targetScale = Math.min(1.5, Math.max(0.4, targetScale));

    const zoomPercent = Math.round(targetScale * 100);

    const targetPanX = (cWidth - bWidth * targetScale) / 2 - minX * targetScale;
    const targetPanY = (cHeight - bHeight * targetScale) / 2 - minY * targetScale;

    setZoomLevel(zoomPercent);
    setPanOffset({ x: targetPanX, y: targetPanY });
  }, [nodes, setZoomLevel, setPanOffset]);

  return {
    rearrangeLayout,
    zoomToFit,
    zoomLevel,
  };
}
