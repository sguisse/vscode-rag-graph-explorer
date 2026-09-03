import React, { useRef, useEffect, useState } from 'react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { useWorkflowPersistence } from '../../hooks/use-workflow-persistence';
import { createDefaultNode } from '../../shapes/workflow-shapes';
import { copyNodeToClipboard, getClipboardNode, duplicateNode } from '../../utils/clipboard.utils';
import { getPortCoordinates, getBezierPath } from '../../utils/port-layout.utils';
import { TextInputNodeView } from '../nodes/TextInputNodeView';
import { JsonInputNodeView } from '../nodes/JsonInputNodeView';
import { UrlNodeView } from '../nodes/UrlNodeView';
import { MarkdownFileNodeView } from '../nodes/MarkdownFileNodeView';
import { AiAgentNodeView } from '../nodes/AiAgentNodeView';
import { LlmNodeView } from '../nodes/LlmNodeView';
import { ReplaceNodeView } from '../nodes/ReplaceNodeView';
import { SanitizeNodeView } from '../nodes/SanitizeNodeView';
import { ExtractDataNodeView } from '../nodes/ExtractDataNodeView';
import { SearchToolNodeView } from '../nodes/SearchToolNodeView';
import { FormattedOutputNodeView } from '../nodes/FormattedOutputNodeView';
import { AnnotationNodeView } from '../nodes/AnnotationNodeView';
import { ScriptNodeView } from '../nodes/ScriptNodeView';
import { ArgumentNodeView } from '../nodes/ArgumentNodeView';
import { OutputAnalyzerNodeView } from '../nodes/OutputAnalyzerNodeView';
import { ImageNodeView } from '../nodes/ImageNodeView';
import { CanvasControls } from './CanvasControls';
import { Minimap } from './Minimap';
import { PortRubberbandLine } from './PortRubberbandLine';
import { AccessibilityValidator } from './AccessibilityValidator';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { CanvasContextMenu } from './CanvasContextMenu';

const DISTINCT_EDGE_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#0284c7', // Sky
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#e11d48', // Rose
];

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
    candidateNotePort,
    showGrid,
    addLog,
  } = useWorkflowStore();

  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; initialPan: { x: number; y: number } } | null>(null);

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

  const isInteractiveTarget = (target: HTMLElement): boolean => {
    return Boolean(
      target.closest('input, textarea, select, button, [data-port-id], [draggable="true"]')
    );
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isInteractiveTarget(target)) return;

    if (e.button === 0 || e.button === 1) {
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
        backgroundImage: showGrid
          ? 'radial-gradient(circle, rgba(148, 163, 184, 0.4) 1.5px, transparent 1.5px)'
          : 'none',
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
        <svg className="top-0 left-0 absolute pointer-events-none w-full h-full z-0">
          {edges.map((edge, idx) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isAnnotationEdge = sourceNode.type === 'annotation' || targetNode.type === 'annotation';

            const srcCoord = getPortCoordinates(sourceNode, edge.sourcePort, edges, nodes, candidateNotePort);
            const tgtCoord = getPortCoordinates(targetNode, edge.targetPort, edges, nodes, candidateNotePort);
            const { path: pathData, midX, midY } = getBezierPath(srcCoord, tgtCoord);

            const dashStyle = edge.style === 'dashed' ? '6 4' : edge.style === 'dotted' ? '2 3' : isAnnotationEdge ? '6 4' : undefined;

            const autoColor = DISTINCT_EDGE_COLORS[idx % DISTINCT_EDGE_COLORS.length];
            const lineColor = isSelected ? '#10b981' : edge.color || (isAnnotationEdge ? '#0284c7' : autoColor);

            // Fond transparent pour le badge et couleur de texte dynamique selon le thème (noir en clair / blanc en sombre)
            const badgeBg = edge.labelColor || 'transparent';
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
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-50"
                      y="-11"
                      width="100"
                      height="22"
                      rx="5"
                      fill={badgeBg}
                      stroke={lineColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={labelTextCol}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => {
          const width = node.data.isCollapsed ? 150 : (node.width || 240);
          const height = node.data.isCollapsed ? 150 : (node.height || 200);

          return (
            <div
              key={node.id}
              data-node-wrapper="true"
              style={{
                position: 'absolute',
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: `${width}px`,
                height: `${height}px`,
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
              {node.type === 'jsonInput' && <JsonInputNodeView node={node} />}
              {node.type === 'urlInput' && <UrlNodeView node={node} />}
              {node.type === 'markdownFile' && <MarkdownFileNodeView node={node} />}
              {node.type === 'llm' && <LlmNodeView node={node} />}
              {node.type === 'aiAgent' && <AiAgentNodeView node={node} />}
              {node.type === 'replace' && <ReplaceNodeView node={node} />}
              {node.type === 'sanitize' && <SanitizeNodeView node={node} />}
              {node.type === 'extractData' && <ExtractDataNodeView node={node} />}
              {node.type === 'searchTool' && <SearchToolNodeView node={node} />}
              {node.type === 'image' && <ImageNodeView node={node} />}
              {node.type === 'script' && <ScriptNodeView node={node} />}
              {node.type === 'argument' && <ArgumentNodeView node={node} />}
              {node.type === 'outputAnalyzer' && <OutputAnalyzerNodeView node={node} />}
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
