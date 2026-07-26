#!/usr/bin/env bash
set -e

echo "🚀 Fixing parentContainerId DOM warning and Cytoscape destroyed() method call..."

# 1. Update ResizableContainer component
cat << 'EOF' > src/components/app/container/resizable-container.tsx
import React from "react";
import { cn } from "@/lib/utils";

export interface ResizableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  visible?: boolean;
  resizeHandle?: 'top' | 'right' | 'bottom' | 'left' | 'none';
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function ResizableContainer({
  id,
  visible = true,
  resizeHandle = 'none',
  onResizeStart,
  className,
  children,
  style,
  ...props
}: ResizableContainerProps) {
  if (!visible) return null;

  const handleClasses = {
    top: "top-0 right-0 left-0 h-1 cursor-row-resize hover:bg-primary/40",
    right: "top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40",
    bottom: "bottom-0 right-0 left-0 h-1 cursor-row-resize hover:bg-primary/40",
    left: "top-0 bottom-0 left-0 w-1 cursor-col-resize hover:bg-primary/40",
    none: "hidden"
  };

  // Only pass custom React prop parentContainerId to React Components, NOT standard HTML elements (div, etc.)
  const childrenWithParentId = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && typeof child.type !== 'string') {
      return React.cloneElement(child, {
        parentContainerId: id,
      } as React.Attributes & { parentContainerId?: string });
    }
    return child;
  });

  return (
    <div
      id={id}
      style={style}
      className={cn("relative flex flex-col bg-card border-border min-w-0 min-h-0 overflow-hidden shrink-0", className)}
      {...props}
    >
      <div
        id={`${id}-content`}
        className="relative flex-1 flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-x-hidden overflow-y-auto scrollbar-hide"
      >
        {childrenWithParentId}
      </div>

      {resizeHandle !== 'none' && onResizeStart && (
        <div
          id={`${id}-handle`}
          className={cn("group z-20 absolute transition-colors", handleClasses[resizeHandle])}
          onMouseDown={onResizeStart}
        />
      )}
    </div>
  );
}
EOF

# 2. Update useCytoscapeInstance to use cy.destroyed()
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/useCytoscapeInstance.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [graphState, setGraphState] = useState<GraphState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodePositions: {}
  });

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setContainerNode(node);
    }
  }, []);

  useEffect(() => {
    if (!containerNode) return;

    const cy = cytoscape({
      container: containerNode,
      style: [
        { selector: 'node[width][height]', style: { 'shape': 'rectangle', 'opacity': 0.0, 'width': 'data(width)', 'height': 'data(height)' } },
        { selector: 'node.folder', style: { 'shape': 'rectangle', 'opacity': 1.0, 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -12, 'font-size': '12px', 'font-family': 'monospace', 'font-weight': 'bold', 'color': isDarkMode ? '#94a3b8' : '#475569', 'background-opacity': 0.02, 'background-color': isDarkMode ? '#475569' : '#94a3b8', 'border-width': '2px', 'border-color': isDarkMode ? '#334155' : '#cbd5e1', 'border-style': 'dashed', 'padding': '40' } },
        { selector: 'edge', style: { 'width': 2, 'line-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'font-family': 'monospace', 'color': isDarkMode ? '#94a3b8' : '#475569', 'text-background-opacity': 1, 'text-background-color': isDarkMode ? '#18181b' : '#ffffff', 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle' } },
        { selector: 'edge.impacted', style: { 'line-color': '#f97316', 'target-arrow-color': '#f97316', 'width': 4 } }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      if (!evt.target.hasClass('folder')) {
        onNodeSelect(evt.target.id());
      }
    });

    const syncGraph = () => {
      const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
      cy.nodes().forEach(node => {
        if (node.hasClass('folder')) return;
        const bb = node.boundingBox({ includeLabels: false, includeEdges: false });
        positions[node.id()] = { x: bb.x1, y: bb.y1, w: bb.w, h: bb.h };
      });
      setGraphState({ zoom: cy.zoom(), pan: cy.pan(), nodePositions: positions });
    };

    cy.on('drag pan zoom render', syncGraph);

    requestAnimationFrame(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
      }
    });

    return () => cy.destroy();
  }, [containerNode, isDarkMode, onNodeSelect]);

  return { containerRef, cyRef, graphState, isReady: !!containerNode };
}
EOF

echo "✅ Console errors fixed!"
