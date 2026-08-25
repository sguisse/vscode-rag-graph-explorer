import React, { useEffect, useState } from 'react';
import { Type, FileText, Bot, Search, LayoutTemplate, Info } from 'lucide-react';
import { createDefaultNode } from '../../shapes/workflow-shapes';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { NodeType } from '../../model-ui';

interface ContextMenuPos {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

export function CanvasContextMenu() {
  const [pos, setPos] = useState<ContextMenuPos | null>(null);
  const { addNode, panOffset, zoomLevel } = useWorkflowStore();

  useEffect(() => {
    const container = document.getElementById('workflow-canvas-container');
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const scale = zoomLevel / 100;
      const canvasX = Math.round((e.clientX - rect.left - panOffset.x) / scale);
      const canvasY = Math.round((e.clientY - rect.top - panOffset.y) / scale);

      setPos({
        x: e.clientX,
        y: e.clientY,
        canvasX,
        canvasY,
      });
    };

    const handleClick = () => setPos(null);

    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
    };
  }, [panOffset, zoomLevel]);

  if (!pos) return null;

  const spawnNode = (type: NodeType) => {
    const node = createDefaultNode(type, { x: pos.canvasX - 100, y: pos.canvasY - 50 });
    addNode(node);
    setPos(null);
  };

  const nodeTypes: { type: NodeType; label: string; icon: any }[] = [
    { type: 'textInput', label: 'Text Input', icon: Type },
    { type: 'markdownFile', label: 'Markdown File', icon: FileText },
    { type: 'aiAgent', label: 'AI Agent', icon: Bot },
    { type: 'searchTool', label: 'Search Reddit', icon: Search },
    { type: 'formattedOutput', label: 'Formatted Output', icon: LayoutTemplate },
    { type: 'annotation', label: 'Annotation Note', icon: Info },
  ];

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed bg-card shadow-xl p-1 border border-border rounded-lg w-48 font-mono text-xs z-50 select-none animate-in fade-in duration-150"
    >
      <div className="px-2 py-1 font-bold text-[10px] text-muted-foreground uppercase border-b border-border mb-1">
        Add Node to Canvas
      </div>
      {nodeTypes.map((item) => {
        const IconComp = item.icon;
        return (
          <button
            key={item.type}
            onClick={() => spawnNode(item.type)}
            className="flex items-center gap-2 hover:bg-muted p-1.5 rounded w-full text-foreground text-xs text-left cursor-pointer transition-colors"
          >
            <IconComp size={14} className="text-primary shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
