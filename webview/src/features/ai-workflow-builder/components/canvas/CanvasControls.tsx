import React from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function CanvasControls() {
  const { zoomLevel, setZoomLevel } = useWorkflowStore();

  return (
    <div className="right-4 bottom-4 absolute flex items-center gap-1 bg-card shadow-md p-1 border border-border rounded-lg font-mono text-xs z-30 select-none">
      <Button
        size="icon"
        variant="ghost"
        className="w-7 h-7"
        onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
      >
        <Minus size={13} />
      </Button>
      <span className="w-12 text-center text-[11px]">{zoomLevel}%</span>
      <Button
        size="icon"
        variant="ghost"
        className="w-7 h-7"
        onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
      >
        <Plus size={13} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="w-7 h-7"
        onClick={() => setZoomLevel(100)}
        title="Reset Zoom"
      >
        <Maximize2 size={13} />
      </Button>
    </div>
  );
}
