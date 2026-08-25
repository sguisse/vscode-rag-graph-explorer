import React, { useRef, useEffect, useState } from 'react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { useWorkflowPersistence } from '../../hooks/use-workflow-persistence';
import { createDefaultNode } from '../../shapes/workflow-shapes';
import { copyNodeToClipboard, getClipboardNode, duplicateNode } from '../../utils/clipboard.utils';
import { TextInputNodeView } from '../nodes/TextInputNodeView';
import { MarkdownFileNodeView } from '../nodes/MarkdownFileNodeView';
import { AiAgentNodeView } from '../nodes/AiAgentNodeView';
import { SearchToolNodeView } from '../nodes/SearchToolNodeView';
import { FormattedOutputNodeView } from '../nodes/FormattedOutputNodeView';
import { AnnotationNodeView } from '../nodes/AnnotationNodeView';
import { CanvasControls } from './CanvasControls';
import { Minimap } from './Minimap';
import { PortRubberbandLine } from './PortRubberbandLine';
import { AccessibilityValidator } from './AccessibilityValidator';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { CanvasContextMenu } from './CanvasContextMenu';

export function CytoscapeCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  useWorkflowPersistence();

  const {
    nodes,
    edges,
    addNode,
    updateNodePosition,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    selectedNodeId,
    selectedEdgeId,
    removeNode,
    removeEdge,
    setSelectedEdgeId,
    setSelectedNodeId,
    addLog,
  } = useWorkflowStore();

  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; initialPan: { x: number; y: number } } | null>(null);

  // Native non-passive mouse wheel listener for smooth scrolling and zoom
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input' || activeTag === 'select') return;

      e.preventDefault();
      e.stopPropagation();

      const currentZoom = useWorkflowStore.getState().zoomLevel;
      const currentPan = useWorkflowStore.getState().panOffset;

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY < 0 ? 5 : -5;
        useWorkflowStore.getState().setZoomLevel(Math.min(150, Math.max(40, currentZoom + delta)));
      } else {
        useWorkflowStore.getState().setPanOffset({
          x: currentPan.x - e.deltaX,
          y: currentPan.y - e.deltaY,
        });
      }
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  // Keyboard shortcut listeners (Delete, Copy, Paste, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      const selectedNode = nodes.find((n) => n.id === selectedNodeId);

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        if (selectedNode) {
          copyNodeToClipboard(selectedNode);
          addLog(`📋 Copied node [${selectedNode.data.label}] to clipboard.`);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        const pasted = getClipboardNode();
        if (pasted) {
          const dup = duplicateNode(pasted);
          addNode(dup);
          addLog(`📋 Pasted node [${dup.data.label}].`);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        if (selectedNode) {
          e.preventDefault();
          const dup = duplicateNode(selectedNode);
          addNode(dup);
          addLog(`👯 Duplicated node [${dup.data.label}].`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, nodes, removeNode, removeEdge, addNode, addLog]);

  // Check if click target is an interactive node control
  const isInteractiveTarget = (target: HTMLElement): boolean => {
    return Boolean(
      target.closest('input, textarea, select, button, [data-port-id], [draggable="true"]')
    );
  };

  // Background drag panning (Left Click or Middle Click)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isInteractiveTarget(target)) return;

    if (e.button === 0 || e.button === 1) {
      // Clear selection if clicking empty canvas
      if (!target.closest('[data-node-wrapper]')) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }

      setIsCanvasPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        initialPan: { ...panOffset },
      });
    }
  };

  useEffect(() => {
    if (!isCanvasPanning || !panStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset({
        x: panStart.initialPan.x + dx,
        y: panStart.initialPan.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsCanvasPanning(false);
      setPanStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCanvasPanning, panStart, setPanOffset]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr || !canvasRef.current) return;

    try {
      const { type } = JSON.parse(dataStr);
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoomLevel / 100;
      const x = Math.round((e.clientX - rect.left - panOffset.x) / scale - 100);
      const y = Math.round((e.clientY - rect.top - panOffset.y) / scale - 50);

      const newNode = createDefaultNode(type, { x, y });
      addNode(newNode);
    } catch (err) {
      // invalid payload
    }
  };

  return (
    <div
      id="workflow-canvas-container"
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex-1 bg-muted/10 w-full h-full min-h-0 overflow-hidden select-none ${
        isCanvasPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      <PortRubberbandLine />
      <CanvasContextMenu />

      <div
        className="w-full h-full transition-transform origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
        }}
      >
        {/* Connection Edges SVG Overlay */}
        <svg className="top-0 left-0 absolute pointer-events-none w-full h-full z-0">
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isAnnotationEdge = sourceNode.type === 'annotation' || targetNode.type === 'annotation';

            const x1 = sourceNode.position.x + (sourceNode.width || 240);
            const y1 = sourceNode.position.y + (sourceNode.height || 200) / 2;
            const x2 = targetNode.position.x;
            const y2 = targetNode.position.y + (targetNode.height || 200) / 2;

            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const dashStyle = edge.style === 'dashed' ? '6 4' : edge.style === 'dotted' ? '2 3' : isAnnotationEdge ? '6 4' : undefined;
            const lineColor = isSelected ? '#10b981' : edge.color || (isAnnotationEdge ? '#0284c7' : '#6366f1');
            const badgeBg = edge.labelColor || 'var(--card)';
            const labelTextCol = edge.labelTextColor || 'var(--foreground)';

            return (
              <g
                key={edge.id}
                className="group pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(edge.id);
                }}
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isSelected ? '4' : '3'}
                  strokeDasharray={dashStyle}
                  className="transition-colors"
                />
                {edge.label && (
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <rect x="-45" y="-10" width="90" height="20" rx="4" fill={badgeBg} stroke={lineColor} strokeWidth="1.5" />
                    <text x="0" y="3" textAnchor="middle" fill={labelTextCol} fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic React Graph Nodes */}
        {nodes.map((node) => {
          return (
            <div
              key={node.id}
              data-node-wrapper="true"
              style={{
                position: 'absolute',
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: `${node.width || 240}px`,
                height: `${node.height || 200}px`,
              }}
              draggable
              onDragEnd={(e) => {
                if (!canvasRef.current) return;
                const rect = canvasRef.current.getBoundingClientRect();
                const scale = zoomLevel / 100;
                updateNodePosition(node.id, {
                  x: Math.round((e.clientX - rect.left - panOffset.x) / scale - 100),
                  y: Math.round((e.clientY - rect.top - panOffset.y) / scale - 20),
                });
              }}
            >
              {node.type === 'textInput' && <TextInputNodeView node={node} />}
              {node.type === 'markdownFile' && <MarkdownFileNodeView node={node} />}
              {node.type === 'aiAgent' && <AiAgentNodeView node={node} />}
              {node.type === 'searchTool' && <SearchToolNodeView node={node} />}
              {node.type === 'formattedOutput' && <FormattedOutputNodeView node={node} />}
              {node.type === 'annotation' && <AnnotationNodeView node={node} />}
            </div>
          );
        })}
      </div>

      <AccessibilityValidator />
      <KeyboardShortcutsDialog />
      <Minimap />
      <CanvasControls />
    </div>
  );
}
