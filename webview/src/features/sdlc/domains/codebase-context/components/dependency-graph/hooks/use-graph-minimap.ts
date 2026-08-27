import { useState, useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { SelectedEntity } from '@/shared/services/graph-rag-explorer';

export interface MinimapNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isOrigin: boolean;
  isDependency: boolean;
}

export interface MinimapViewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MinimapBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  h: number;
}

export function useGraphMinimap(
  cyRef: React.RefObject<cytoscape.Core | null> | null,
  showMinimap: boolean,
  selectedEntity: SelectedEntity | null,
  impactedSet: Set<string>
) {
  const [nodes, setNodes] = useState<MinimapNode[]>([]);
  const [lens, setLens] = useState<MinimapViewport>({ x: 0, y: 0, w: 0, h: 0 });
  const [bounds, setBounds] = useState<MinimapBounds>({ x1: -500, y1: -500, x2: 500, y2: 500, w: 1000, h: 1000 });

  const syncMinimap = useCallback(() => {
    if (!cyRef?.current || cyRef.current.destroyed()) return;
    const cy = cyRef.current;
    const eles = cy.nodes().not('.folder');
    if (eles.length === 0) return;

    const bb = eles.boundingBox({ includeLabels: false });
    const padding = 100;
    const x1 = bb.x1 - padding;
    const y1 = bb.y1 - padding;
    const x2 = bb.x2 + padding;
    const y2 = bb.y2 + padding;
    const graphW = Math.max(x2 - x1, 200);
    const graphH = Math.max(y2 - y1, 200);

    setBounds({ x1, y1, x2, y2, w: graphW, h: graphH });

    const nodeList: MinimapNode[] = [];
    eles.forEach((node) => {
      const id = node.id();
      const pos = node.position();
      const nBb = node.boundingBox({ includeLabels: false });
      const isOrigin = selectedEntity?.nodeId === id;
      const isDependency = impactedSet.has(id) && !isOrigin;
      nodeList.push({
        id,
        x: pos.x,
        y: pos.y,
        w: nBb.w || 40,
        h: nBb.h || 40,
        isOrigin,
        isDependency,
      });
    });
    setNodes(nodeList);

    const extent = cy.extent();
    setLens({
      x: extent.x1,
      y: extent.y1,
      w: extent.w,
      h: extent.h,
    });
  }, [cyRef, selectedEntity?.nodeId, impactedSet]);

  useEffect(() => {
    if (!showMinimap || !cyRef?.current) return;
    const cy = cyRef.current;

    syncMinimap();

    const handleUpdate = () => syncMinimap();
    cy.on('pan zoom render position add remove layoutstop', handleUpdate);

    return () => {
      cy.off('pan zoom render position add remove layoutstop', handleUpdate);
    };
  }, [showMinimap, cyRef, syncMinimap]);

  const panToGraphCoordinates = useCallback((graphX: number, graphY: number) => {
    if (!cyRef?.current || cyRef.current.destroyed()) return;
    const cy = cyRef.current;
    cy.center();
    cy.pan({
      x: cy.width() / 2 - graphX * cy.zoom(),
      y: cy.height() / 2 - graphY * cy.zoom(),
    });
  }, [cyRef]);

  return {
    nodes,
    lens,
    bounds,
    panToGraphCoordinates,
    syncMinimap,
  };
}
