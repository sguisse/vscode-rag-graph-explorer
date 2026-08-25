import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function PortRubberbandLine() {
  const { connectingPort, nodes } = useWorkflowStore();
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!connectingPort) {
      setMousePos(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.getElementById('workflow-canvas-container');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useWorkflowStore.getState().setConnectingPort(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectingPort]);

  if (!connectingPort || !mousePos) return null;

  const sourceNode = nodes.find((n) => n.id === connectingPort.nodeId);
  if (!sourceNode) return null;

  const x1 =
    connectingPort.direction === 'output'
      ? sourceNode.position.x + (sourceNode.width || 240)
      : sourceNode.position.x;
  const y1 = sourceNode.position.y + (sourceNode.height || 200) / 2;

  const x2 = mousePos.x;
  const y2 = mousePos.y;

  const dx = Math.abs(x2 - x1) * 0.5;
  const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

  return (
    <svg className="top-0 left-0 absolute pointer-events-none w-full h-full z-40">
      <path
        d={pathData}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeDasharray="6 4"
        className="animate-pulse"
      />
      <circle cx={x2} cy={y2} r="5" fill="#10b981" className="animate-ping opacity-75" />
    </svg>
  );
}
