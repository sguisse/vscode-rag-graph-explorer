import React, { useRef, useState, useCallback, useMemo } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { useGraphMinimap } from '../hooks/use-graph-minimap';
import { useCodebaseDomainState } from '../../../store/useCodebaseDomainState';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';

const MINIMAP_WIDTH = 192; // px
const MINIMAP_HEIGHT = 120; // px

export function GraphMinimap() {
  const cyRef = useCodebaseDomainState((s) => s.cyRef);
  const showMinimap = useCodebaseDomainState((s) => s.showMinimap);
  const toggleShowMinimap = useCodebaseDomainState((s) => s.toggleShowMinimap);
  const selectedEntity = useCodebaseDomainState((s) => s.selectedEntity);
  const codebase = useCodebaseDomainState((s) => s.codebase);
  const callersDepth = useCodebaseDomainState((s) => s.callersDepth) ?? 2;
  const calleesDepth = useCodebaseDomainState((s) => s.calleesDepth) ?? 2;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingLensRef = useRef(false);

  const impactedSet = useMemo(() => {
    if (!selectedEntity || !codebase?.dependencies) return new Set<string>();
    return calculateTransitiveImpact(selectedEntity, codebase.dependencies, callersDepth, calleesDepth, true, true);
  }, [selectedEntity, codebase?.dependencies, callersDepth, calleesDepth]);

  const { nodes, lens, bounds, panToGraphCoordinates } = useGraphMinimap(
    cyRef,
    showMinimap && !isCollapsed,
    selectedEntity,
    impactedSet
  );

  const mapX = useCallback((graphX: number) => {
    return ((graphX - bounds.x1) / bounds.w) * MINIMAP_WIDTH;
  }, [bounds]);

  const mapY = useCallback((graphY: number) => {
    return ((graphY - bounds.y1) / bounds.h) * MINIMAP_HEIGHT;
  }, [bounds]);

  const unmapX = useCallback((pixelX: number) => {
    return (pixelX / MINIMAP_WIDTH) * bounds.w + bounds.x1;
  }, [bounds]);

  const unmapY = useCallback((pixelY: number) => {
    return (pixelY / MINIMAP_HEIGHT) * bounds.h + bounds.y1;
  }, [bounds]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingLensRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetGraphX = unmapX(clickX);
    const targetGraphY = unmapY(clickY);
    panToGraphCoordinates(targetGraphX, targetGraphY);
  };

  const handleLensMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingLensRef.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialLensGraphX = lens.x + lens.w / 2;
    const initialLensGraphY = lens.y + lens.h / 2;

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingLensRef.current) return;
      const dxPixels = moveEvt.clientX - startX;
      const dyPixels = moveEvt.clientY - startY;

      const dxGraph = (dxPixels / MINIMAP_WIDTH) * bounds.w;
      const dyGraph = (dyPixels / MINIMAP_HEIGHT) * bounds.h;

      panToGraphCoordinates(initialLensGraphX + dxGraph, initialLensGraphY + dyGraph);
    };

    const handleMouseUp = () => {
      isDraggingLensRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!showMinimap) return null;

  const lensLeft = Math.max(0, Math.min(MINIMAP_WIDTH, mapX(lens.x)));
  const lensTop = Math.max(0, Math.min(MINIMAP_HEIGHT, mapY(lens.y)));
  const lensWidth = Math.max(12, Math.min(MINIMAP_WIDTH - lensLeft, (lens.w / bounds.w) * MINIMAP_WIDTH));
  const lensHeight = Math.max(12, Math.min(MINIMAP_HEIGHT - lensTop, (lens.h / bounds.h) * MINIMAP_HEIGHT));

  return (
    <div className="bottom-3 right-3 z-30 absolute bg-card/90 backdrop-blur-md shadow-2xl border border-border/80 rounded-lg overflow-hidden transition-all select-none pointer-events-auto">
      <div className="flex justify-between items-center bg-muted/40 px-2 py-1 border-b border-border/60">
        <span className="font-mono font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          Minimap
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Minimap" : "Collapse Minimap"}
          >
            {isCollapsed ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          </button>
          <button
            type="button"
            className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            onClick={toggleShowMinimap}
            title="Close Minimap"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div
          ref={containerRef}
          onClick={handleMinimapClick}
          className="relative bg-black/40 cursor-crosshair overflow-hidden"
          style={{ width: `${MINIMAP_WIDTH}px`, height: `${MINIMAP_HEIGHT}px` }}
        >
          {/* Render Thumbnail Nodes with Mirrored Selection & Highlight Colors */}
          {nodes.map((node) => {
            const nx = mapX(node.x);
            const ny = mapY(node.y);
            let colorClass = 'bg-slate-400/70 border-slate-500/50';

            if (node.isOrigin) {
              colorClass = 'bg-red-500 ring-2 ring-red-400 z-10 animate-pulse';
            } else if (node.isDependency) {
              colorClass = 'bg-amber-500 ring-1 ring-amber-400 z-10';
            }

            return (
              <div
                key={node.id}
                className={`absolute rounded-full border transform -translate-x-1/2 -translate-y-1/2 transition-all ${colorClass}`}
                style={{
                  left: `${nx}px`,
                  top: `${ny}px`,
                  width: node.isOrigin ? '8px' : node.isDependency ? '6px' : '4px',
                  height: node.isOrigin ? '8px' : node.isDependency ? '6px' : '4px',
                }}
                title={node.id}
              />
            );
          })}

          {/* Draggable Viewport Lens */}
          <div
            onMouseDown={handleLensMouseDown}
            className="z-20 absolute border-2 border-primary/90 bg-primary/20 rounded-xs shadow-xs cursor-grab active:cursor-grabbing hover:bg-primary/30 transition-colors"
            style={{
              left: `${lensLeft}px`,
              top: `${lensTop}px`,
              width: `${lensWidth}px`,
              height: `${lensHeight}px`,
            }}
          />
        </div>
      )}
    </div>
  );
}
