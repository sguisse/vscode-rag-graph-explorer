#!/usr/bin/env bash
set -e

echo "🚀 Configuration du fond transparent et de la couleur dynamique (noir en mode clair / blanc en mode sombre) pour les étiquettes de relations..."

# S'assurer que les dossiers cibles existent
mkdir -p webview/src/features/ai-workflow-builder/components/canvas
mkdir -p webview/src/features/ai-workflow-builder/components/inspector
mkdir -p webview/src/features/ai-workflow-builder/utils

# 1. Mise à jour de CytoscapeCanvas.tsx (Fond transparent et texte adapté au thème)
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/canvas/CytoscapeCanvas.tsx
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
            const labelTextCol = edge.labelTextColor || 'hsl(var(--foreground))';

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
EOF

# 2. Mise à jour de EdgeConfigForm.tsx dans l'inspecteur
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/inspector/EdgeConfigForm.tsx
import React, { useState } from 'react';
import { WorkflowEdge, EdgeStyle } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { Button } from '@/components/ui/button';
import { Trash2, Link2, Palette, Type, Sliders, ChevronDown, ChevronRight } from 'lucide-react';

const LINK_COLOR_SWATCHES = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Sky', value: '#0284c7' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Transparent', value: 'transparent' },
  { label: 'White', value: '#ffffff' },
  { label: 'Dark Slate', value: '#1e293b' },
];

export function EdgeConfigForm({ edge }: { edge: WorkflowEdge }) {
  const { nodes, updateEdge, removeEdge } = useWorkflowStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(true);

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  return (
    <div className="space-y-3 font-mono text-xs select-none">
      <div className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase">
        <Link2 size={14} /> Link Relationship
      </div>

      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Source Point</label>
        <div className="mt-0.5 p-1.5 bg-muted/40 border border-border rounded-lg text-xs truncate">
          {sourceNode ? `${sourceNode.data.label} (${edge.sourcePort})` : edge.source}
        </div>
      </div>

      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Target Entry</label>
        <div className="mt-0.5 p-1.5 bg-muted/40 border border-border rounded-lg text-xs truncate">
          {targetNode ? `${targetNode.data.label} (${edge.targetPort})` : edge.target}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
          <Type size={11} /> Relationship Title
        </label>
        <input
          type="text"
          value={edge.label || ''}
          placeholder="e.g. Tokens used: 3"
          onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
          className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="pt-2 border-border/80 border-t">
        <button
          type="button"
          onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
          className="flex justify-between items-center w-full font-bold text-[10px] text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Palette size={12} className="text-primary" /> Relationship Appearance
          </span>
          {isAppearanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isAppearanceOpen && (
          <div className="space-y-3 mt-2.5 pl-1">
            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                <Sliders size={11} /> Line Style
              </label>
              <select
                value={edge.style || 'solid'}
                onChange={(e) => updateEdge(edge.id, { style: e.target.value as EdgeStyle })}
                className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs cursor-pointer"
              >
                <option value="solid">━━ Solid Line</option>
                <option value="dashed">╌╌ Dashed Line</option>
                <option value="dotted">┈ ┈ Dotted Line</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                Line Color
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={edge.color || '#6366f1'}
                  onChange={(e) => updateEdge(edge.id, { color: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {LINK_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { color: c.value })}
                      className="w-4 h-4 rounded-full border border-background shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.value === 'transparent' ? 'rgba(0,0,0,0.1)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                Label Text Color
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={edge.labelTextColor || '#000000'}
                  onChange={(e) => updateEdge(edge.id, { labelTextColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {LINK_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { labelTextColor: c.value })}
                      className="w-4 h-4 rounded-full border border-background shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.value === 'transparent' ? 'rgba(0,0,0,0.1)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                Badge Background Color
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={edge.labelColor || '#000000'}
                  onChange={(e) => updateEdge(edge.id, { labelColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {LINK_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { labelColor: c.value })}
                      className="w-4 h-4 rounded-full border border-background shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.value === 'transparent' ? 'rgba(0,0,0,0.1)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => removeEdge(edge.id)}
        className="w-full mt-2 h-8 font-semibold text-xs gap-1.5 cursor-pointer"
      >
        <Trash2 size={13} /> Delete Relationship Link
      </Button>
    </div>
  );
}
EOF

# 3. Extraction exacte de la couleur calculée lors de l'export PNG dans canvas-export.utils.ts
cat << 'EOF' > webview/src/features/ai-workflow-builder/utils/canvas-export.utils.ts
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export interface RenderedCanvasImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

const CRITICAL_CSS_PROPERTIES = [
  'display',
  'position',
  'top',
  'left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex-direction',
  'align-items',
  'justify-content',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'background-color',
  'color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'box-shadow',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'white-space',
  'word-break',
  'overflow-x',
  'overflow-y',
  'text-overflow',
  'box-sizing',
  'opacity',
  'visibility',
  'transform',
  'accent-color',
];

function cloneAndFreezeNodeTree(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;

  const origElements = Array.from(source.querySelectorAll('*')) as HTMLElement[];
  const cloneElements = Array.from(clone.querySelectorAll('*')) as HTMLElement[];

  origElements.forEach((orig, idx) => {
    const target = cloneElements[idx];
    if (!target) return;

    const tag = orig.tagName.toLowerCase();
    const computed = window.getComputedStyle(orig);

    if (tag === 'img') {
      const img = orig as HTMLImageElement;
      const replacement = document.createElement('div');

      replacement.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${computed.width};
        height: ${computed.height};
        border-radius: ${computed.borderRadius};
        background-color: ${computed.backgroundColor || '#1e293b'};
        overflow: hidden;
        border: ${computed.border};
        box-sizing: border-box;
      `;

      const span = document.createElement('span');
      span.style.cssText = 'font-size: 10px; color: #94a3b8; font-family: monospace; font-weight: bold;';
      span.textContent = `🖼️ [Image: ${img.alt || 'Media'}]`;
      replacement.appendChild(span);

      target.parentNode?.replaceChild(replacement, target);
    } else if (tag === 'input' && (orig as HTMLInputElement).type === 'range') {
      const inputEl = orig as HTMLInputElement;
      const min = parseFloat(inputEl.min) || 0;
      const max = parseFloat(inputEl.max) || 100;
      const val = parseFloat(inputEl.value) || min;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

      let accentCol = computed.accentColor;
      if (!accentCol || accentCol === 'auto' || accentCol === 'initial' || accentCol === 'inherit') {
        accentCol = computed.color && computed.color !== 'rgba(0, 0, 0, 0)' ? computed.color : '#6366f1';
      }

      const sliderContainer = document.createElement('div');
      sliderContainer.style.cssText = `
        display: flex;
        align-items: center;
        position: relative;
        width: ${computed.width || '100%'};
        height: ${computed.height || '20px'};
        padding: ${computed.padding};
        margin: ${computed.margin};
        box-sizing: border-box;
      `;

      const track = document.createElement('div');
      track.style.cssText = `
        width: 100%;
        height: 6px;
        background-color: rgba(148, 163, 184, 0.25);
        border-radius: 9999px;
        position: relative;
      `;

      const activeTrack = document.createElement('div');
      activeTrack.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${pct}%;
        background-color: ${accentCol};
        border-radius: 9999px;
      `;

      const thumb = document.createElement('div');
      thumb.style.cssText = `
        position: absolute;
        top: 50%;
        left: ${pct}%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        background-color: ${accentCol};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      `;

      track.appendChild(activeTrack);
      track.appendChild(thumb);
      sliderContainer.appendChild(track);

      target.parentNode?.replaceChild(sliderContainer, target);
    } else if (tag === 'input' && (orig as HTMLInputElement).type === 'checkbox') {
      const checkbox = orig as HTMLInputElement;
      const box = document.createElement('div');
      box.style.cssText = `
        width: ${computed.width || '14px'};
        height: ${computed.height || '14px'};
        border: ${computed.border || '1px solid #64748b'};
        border-radius: ${computed.borderRadius || '3px'};
        background-color: ${checkbox.checked ? '#6366f1' : 'transparent'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 10px;
        font-weight: bold;
        box-sizing: border-box;
      `;
      if (checkbox.checked) {
        box.textContent = '✓';
      }
      target.parentNode?.replaceChild(box, target);
    } else if (tag === 'textarea' || tag === 'input' || tag === 'select') {
      const replacement = document.createElement('div');

      let textVal = '';
      if (tag === 'select') {
        const select = orig as HTMLSelectElement;
        textVal = select.options[select.selectedIndex]?.text || select.value;
      } else {
        textVal = (orig as HTMLInputElement | HTMLTextAreaElement).value || '';
      }

      replacement.textContent = textVal;

      let inlineStyle = '';
      for (const prop of CRITICAL_CSS_PROPERTIES) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== 'initial' && val !== 'inherit') {
          inlineStyle += `${prop}:${val};`;
        }
      }

      inlineStyle += `white-space: ${tag === 'textarea' ? 'pre-wrap' : 'nowrap'}; overflow: hidden; text-overflow: ellipsis; word-break: break-word;`;
      replacement.setAttribute('style', inlineStyle);

      target.parentNode?.replaceChild(replacement, target);
    } else {
      let inlineStyle = '';
      for (const prop of CRITICAL_CSS_PROPERTIES) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== 'initial' && val !== 'inherit') {
          inlineStyle += `${prop}:${val};`;
        }
      }
      target.setAttribute('style', inlineStyle);
    }
  });

  return clone;
}

function freezeSvgStyles(origSvg: SVGElement, clonedSvg: SVGElement) {
  const origEls = Array.from(origSvg.querySelectorAll('*'));
  const cloneEls = Array.from(clonedSvg.querySelectorAll('*'));

  origEls.forEach((orig, idx) => {
    const target = cloneEls[idx] as HTMLElement | SVGElement;
    if (!target) return;

    const computed = window.getComputedStyle(orig);
    const tag = orig.tagName.toLowerCase();

    if (computed.fill && computed.fill !== 'none') {
      target.setAttribute('fill', computed.fill);
    }
    if (computed.stroke && computed.stroke !== 'none') {
      target.setAttribute('stroke', computed.stroke);
    }
    if (computed.strokeWidth) {
      target.setAttribute('stroke-width', computed.strokeWidth);
    }
    if (computed.strokeDasharray && computed.strokeDasharray !== 'none') {
      target.setAttribute('stroke-dasharray', computed.strokeDasharray);
    }

    if (tag === 'text') {
      target.setAttribute('fill', computed.fill !== 'none' && computed.fill !== 'rgba(0, 0, 0, 0)' ? computed.fill : computed.color);
    }

    if (tag === 'svg') {
      target.setAttribute('width', computed.width);
      target.setAttribute('height', computed.height);
    }

    target.setAttribute(
      'style',
      `font-family:${computed.fontFamily}; font-size:${computed.fontSize}; font-weight:${computed.fontWeight}; color:${computed.color};`
    );
  });
}

export async function generateCanvasImage(containerId: string): Promise<RenderedCanvasImageResult | null> {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const svgElement = container.querySelector('svg');
  if (!svgElement) return null;

  const nodeElements = Array.from(container.querySelectorAll('[data-node-wrapper="true"]')) as HTMLElement[];
  if (nodeElements.length === 0) return null;

  const nodesWrapper = nodeElements[0].parentElement;
  if (!nodesWrapper) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodeElements.forEach((el) => {
    const left = parseFloat(el.style.left) || 0;
    const top = parseFloat(el.style.top) || 0;
    const width = parseFloat(el.style.width) || 240;
    const height = parseFloat(el.style.height) || 200;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  });

  const padding = 50;
  minX = Math.floor(minX - padding);
  minY = Math.floor(minY - padding);
  maxX = Math.ceil(maxX + padding);
  maxY = Math.ceil(maxY + padding);

  const exportWidth = Math.max(Math.ceil(maxX - minX), 400);
  const exportHeight = Math.max(Math.ceil(maxY - minY), 300);

  const clonedNodesWrapper = cloneAndFreezeNodeTree(nodesWrapper);
  clonedNodesWrapper.style.transform = `translate(${-minX}px, ${-minY}px)`;
  clonedNodesWrapper.style.position = 'absolute';
  clonedNodesWrapper.style.top = '0';
  clonedNodesWrapper.style.left = '0';
  clonedNodesWrapper.style.width = `${exportWidth}px`;
  clonedNodesWrapper.style.height = `${exportHeight}px`;

  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  clonedSvg.style.transform = `translate(${-minX}px, ${-minY}px)`;
  clonedSvg.setAttribute('width', `${exportWidth}`);
  clonedSvg.setAttribute('height', `${exportHeight}`);
  freezeSvgStyles(svgElement, clonedSvg);

  const xmlSerializer = new XMLSerializer();
  const svgEdgesString = xmlSerializer.serializeToString(clonedSvg);
  const nodesXhtmlString = xmlSerializer.serializeToString(clonedNodesWrapper);

  const combinedSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}">
      <defs>
        <style>
          * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          body, div, span, text {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          code, kbd, pre, select, input, textarea {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
        </style>
      </defs>
      <g>
        ${svgEdgesString}
      </g>
      <foreignObject width="${exportWidth}" height="${exportHeight}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${exportWidth}px; height:${exportHeight}px; position:relative; background:transparent;">
          ${nodesXhtmlString}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(combinedSvg);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scaleFactor = 3;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(exportWidth * scaleFactor);
      canvas.height = Math.ceil(exportHeight * scaleFactor);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scaleFactor, scaleFactor);
        ctx.drawImage(image, 0, 0);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/png');
          resolve({
            blob: pngBlob,
            dataUrl,
            width: exportWidth,
            height: exportHeight,
          });
        }, 'image/png');
      } else {
        resolve(null);
      }
    };

    image.onerror = (err) => {
      console.error('Failed to load SVG image during PNG export:', err);
      resolve(null);
    };

    image.src = svgDataUrl;
  });
}
EOF

echo "✅ style: Configuration du fond transparent et du texte dynamique (noir en mode clair / blanc en mode sombre) effectuée !"
