import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Map, LocateFixed } from 'lucide-react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function Minimap() {
  const { nodes, zoomLevel, panOffset, setPanOffset, centerOnNode } = useWorkflowStore();
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; initialPan: { x: number; y: number } } | null>(null);

  const padding = 300;
  const minX = Math.min(...nodes.map((n) => n.position.x), 0) - padding;
  const maxX = Math.max(...nodes.map((n) => n.position.x + (n.data.isCollapsed ? 150 : (n.width || 240))), 1200) + padding;
  const minY = Math.min(...nodes.map((n) => n.position.y), 0) - padding;
  const maxY = Math.max(...nodes.map((n) => n.position.y + (n.data.isCollapsed ? 150 : (n.height || 200))), 800) + padding;

  const boundsWidth = Math.max(maxX - minX, 100);
  const boundsHeight = Math.max(maxY - minY, 100);

  const minimapWidth = 160;
  const minimapHeight = 96;

  const scaleX = minimapWidth / boundsWidth;
  const scaleY = minimapHeight / boundsHeight;
  const scale = zoomLevel / 100;

  const getContainerDimensions = useCallback(() => {
    const container = document.getElementById('workflow-canvas-container');
    return {
      width: container?.clientWidth || 800,
      height: container?.clientHeight || 600,
    };
  }, []);

  const { width: cWidth, height: cHeight } = getContainerDimensions();

  const viewportGraphX = -panOffset.x / scale;
  const viewportGraphY = -panOffset.y / scale;
  const viewportGraphW = cWidth / scale;
  const viewportGraphH = cHeight / scale;

  const viewX = (viewportGraphX - minX) * scaleX;
  const viewY = (viewportGraphY - minY) * scaleY;
  const viewW = Math.max(viewportGraphW * scaleX, 16);
  const viewH = Math.max(viewportGraphH * scaleY, 12);

  const panToMinimapCoord = useCallback(
    (mx: number, my: number) => {
      const graphX = mx / scaleX + minX;
      const graphY = my / scaleY + minY;

      const targetPanX = cWidth / 2 - graphX * scale;
      const targetPanY = cHeight / 2 - graphY * scale;

      setPanOffset({ x: targetPanX, y: targetPanY });
    },
    [scaleX, scaleY, minX, minY, cWidth, cHeight, scale, setPanOffset]
  );

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingViewport || !minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    panToMinimapCoord(mx, my);
  };

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingViewport(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialPan: { ...panOffset },
    });
  };

  useEffect(() => {
    if (!isDraggingViewport || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      const deltaGraphX = dx / scaleX;
      const deltaGraphY = dy / scaleY;

      setPanOffset({
        x: dragStart.initialPan.x - deltaGraphX * scale,
        y: dragStart.initialPan.y - deltaGraphY * scale,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingViewport(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingViewport, dragStart, scaleX, scaleY, scale, setPanOffset]);

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="right-4 bottom-16 absolute flex flex-col bg-card/95 shadow-xl p-2 border border-border rounded-xl w-48 h-36 font-mono text-[9px] z-30 select-none backdrop-blur-md">
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <span className="flex items-center gap-1 font-bold text-muted-foreground text-[10px] uppercase">
          <Map size={11} className="text-primary" /> Navigation Minimap
        </span>
        <button
          onClick={handleResetView}
          className="hover:bg-muted p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Reset Pan View (0,0)"
        >
          <LocateFixed size={12} />
        </button>
      </div>

      <div
        ref={minimapRef}
        onClick={handleMinimapClick}
        className="relative flex-1 bg-background/90 border border-border/80 rounded-md overflow-hidden cursor-crosshair"
      >
        {nodes.map((node) => {
          const left = (node.position.x - minX) * scaleX;
          const top = (node.position.y - minY) * scaleY;
          const width = Math.max((node.data.isCollapsed ? 150 : (node.width || 240)) * scaleX, 8);
          const height = Math.max((node.data.isCollapsed ? 150 : (node.height || 200)) * scaleY, 6);

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                centerOnNode(node.id, cWidth, cHeight);
              }}
              className="absolute bg-primary/40 hover:bg-primary border border-primary/80 rounded-[2px] transition-all cursor-pointer"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              title={`Click to focus: ${node.data.label}`}
            />
          );
        })}

        <div
          onMouseDown={handleViewportMouseDown}
          className={`absolute border-2 border-emerald-500 bg-emerald-500/15 rounded-[3px] shadow-sm ${
            isDraggingViewport ? 'cursor-grabbing border-emerald-400 bg-emerald-500/25' : 'cursor-grab'
          } transition-shadow`}
          style={{
            left: `${viewX}px`,
            top: `${viewY}px`,
            width: `${viewW}px`,
            height: `${viewH}px`,
          }}
          title="Drag to navigate canvas viewport"
        />
      </div>
    </div>
  );
}
