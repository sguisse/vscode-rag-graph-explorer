import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Terminal, Trash2, Copy, Check } from 'lucide-react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { NodeConfigForm } from './NodeConfigForm';
import { EdgeConfigForm } from './EdgeConfigForm';
import { Button } from '@/components/ui/button';

export function AttributesPanel() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, removeNode, logs, clearLogs } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Height state for Execution Telemetry section
  const [telemetryHeight, setTelemetryHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(200);

  const handleCopyLogs = async () => {
    try {
      const logText = logs.join('\n');
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(logText);
        setCopiedLogs(true);
        setTimeout(() => setCopiedLogs(false), 2000);
      }
    } catch (err) {
      console.warn('Failed to copy telemetry logs:', err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = telemetryHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(80, Math.min(550, resizeStartHeight.current + deltaY));
      setTelemetryHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 font-mono text-xs border-border border-l select-none">
      {/* Inspector Header */}
      <div className="flex justify-between items-center p-2 border-border border-b shrink-0">
        <span className="flex items-center gap-1.5 font-bold text-foreground">
          <Sliders size={14} className="text-primary" /> Inspector
        </span>
        {selectedNode && (
          <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6 text-destructive cursor-pointer"
            onClick={() => removeNode(selectedNode.id)}
            title="Delete Node"
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>

      {/* Configuration Form (Node or Edge) */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto">
        {selectedNode ? (
          <NodeConfigForm node={selectedNode} />
        ) : selectedEdge ? (
          <EdgeConfigForm edge={selectedEdge} />
        ) : (
          <div className="py-6 text-center text-muted-foreground text-xs">
            Select a node or edge connector on the canvas to inspect parameters.
          </div>
        )}
      </div>

      {/* Top Resize Bar for Execution Telemetry */}
      <div
        onMouseDown={handleMouseDown}
        className="group relative flex items-center justify-center h-2 bg-border/40 hover:bg-primary/50 cursor-ns-resize shrink-0 transition-colors z-10"
        title="Drag up or down to resize Execution Telemetry panel"
      >
        <div className="w-8 h-1 bg-muted-foreground/30 group-hover:bg-primary-foreground rounded-full transition-colors" />
      </div>

      {/* Execution Telemetry Log - Resizable Height */}
      <div
        style={{ height: `${telemetryHeight}px` }}
        className="flex flex-col shrink-0 min-h-0 overflow-hidden border-border border-t"
      >
        <div className="flex justify-between items-center p-2 border-border border-b shrink-0 bg-muted/20">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
            <Terminal size={13} className="text-emerald-500" /> Execution Telemetry
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLogs}
              className="hover:bg-muted p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Execution Telemetry Content"
            >
              {copiedLogs ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
            <button
              type="button"
              onClick={clearLogs}
              className="hover:bg-muted p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Clear Execution Telemetry"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 bg-background overflow-y-auto font-mono text-[10px] text-foreground space-y-1">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-tight">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
