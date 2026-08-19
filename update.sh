#!/usr/bin/env bash
set -e

# Ensure workflow directory structure exists
mkdir -p webview/src/features/explorer/workflow/components
mkdir -p webview/src/features/explorer/workflow/hooks

# 1. Update Workflow JSON: set initialStepId to "draft" so "1. File Selection" is active step instead of decision diamond
cat << 'EOF' > webview/src/features/explorer/workflow/data-workflow.json
{
  "workflow": {
    "title": "Context Engineering Pipeline",
    "description": "Interactive multi-branch document validation flow with automated decision checks.",
    "initialStepId": "draft",
    "nodes": [
      {
        "id": "start",
        "label": "Context Engineering Pipeline",
        "desc": "BPMN Start Event: Trigger point of the pipeline.",
        "type": "start",
        "x": 30,
        "y": 110,
        "status": "completed"
      },
      {
        "id": "draft",
        "label": "1. File Selection",
        "desc": "Select target source files in Codebase Explorer.",
        "type": "step",
        "x": 160,
        "y": 110,
        "status": "current"
      },
      {
        "id": "check_compliance",
        "label": "2. Blast Radius",
        "desc": "Transitive BFS traversal computes callers & callees.",
        "type": "decision",
        "x": 300,
        "y": 110,
        "status": "pending"
      },
      {
        "id": "legal_review",
        "label": "3a. Minifier",
        "desc": "AST skeletonization strips method implementation bodies.",
        "type": "step",
        "x": 440,
        "y": 50,
        "status": "pending"
      },
      {
        "id": "fast_track",
        "label": "3b. Raw Context",
        "desc": "Exports complete unminified source code context.",
        "type": "step",
        "x": 440,
        "y": 170,
        "status": "pending"
      },
      {
        "id": "check_exec",
        "label": "4. Anonymizer",
        "desc": "Regex rules replace sensitive secrets & database URIs.",
        "type": "decision",
        "x": 580,
        "y": 50,
        "status": "pending"
      },
      {
        "id": "published",
        "label": "5. Prompt Export",
        "desc": "Compiles structured XML prompt & copies payload to clipboard.",
        "type": "step",
        "x": 720,
        "y": 110,
        "status": "pending"
      },
      {
        "id": "end",
        "label": "Pipeline Completed",
        "desc": "BPMN End Event: Context generated and ready.",
        "type": "end",
        "x": 840,
        "y": 110,
        "status": "pending"
      }
    ],
    "edges": [
      { "id": "e0", "source": "start", "target": "draft", "label": "Start" },
      { "id": "e1", "source": "draft", "target": "check_compliance", "label": "Selected" },
      { "id": "e2", "source": "check_compliance", "target": "legal_review", "label": "Minify" },
      { "id": "e3", "source": "check_compliance", "target": "fast_track", "label": "Full Source" },
      { "id": "e4", "source": "legal_review", "target": "check_exec", "label": "Transform" },
      { "id": "e5", "source": "fast_track", "target": "published", "label": "Compile" },
      { "id": "e6", "source": "check_exec", "target": "published", "label": "Clean" },
      { "id": "e7", "source": "check_exec", "target": "draft", "label": "Reset" },
      { "id": "e8", "source": "published", "target": "end", "label": "Finish" }
    ]
  }
}
EOF

# 2. Update Cytoscape Shapes: Hover effects apply ONLY to step nodes
cat << 'EOF' > webview/src/features/explorer/workflow/components/shapes-workflow.tsx
import cytoscape from 'cytoscape';

export function getWorkflowCytoscapeStyles(isDarkMode: boolean): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'font-family': 'monospace, sans-serif',
        'font-size': '10px',
        'font-weight': 'bold',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '80px',
        'color': isDarkMode ? '#f8fafc' : '#0f172a',
        'overlay-opacity': 0,
        'transition-property': 'background-color, border-color, border-width',
        'transition-duration': 0.15,
      },
    },
    // Standard Step Node (Round Rectangle): Always background in defined blue
    {
      selector: 'node.step, node[type = "step"]',
      style: {
        'shape': 'roundrectangle',
        'width': '95px',
        'height': '40px',
        'background-color': isDarkMode ? '#1e3a8a' : '#dbeafe',
        'border-width': '2px',
        'border-color': isDarkMode ? '#3b82f6' : '#2563eb',
        'color': isDarkMode ? '#eff6ff' : '#1e3a8a',
      },
    },
    // Decision Node (Diamond): Always background in pure white
    {
      selector: 'node.decision, node[type = "decision"]',
      style: {
        'shape': 'diamond',
        'width': '72px',
        'height': '72px',
        'background-color': '#ffffff',
        'border-width': '2.5px',
        'border-color': isDarkMode ? '#818cf8' : '#6366f1',
        'color': '#312e81',
        'font-size': '9px',
      },
    },
    // BPMN Start Event: Empty circle with white background
    {
      selector: 'node.start, node[type = "start"]',
      style: {
        'shape': 'ellipse',
        'width': '32px',
        'height': '32px',
        'background-color': '#ffffff',
        'border-width': '2.5px',
        'border-color': isDarkMode ? '#34d399' : '#10b981',
        'text-valign': 'bottom',
        'text-margin-y': 6,
        'color': isDarkMode ? '#a7f3d0' : '#047857',
        'font-size': '9px',
        'text-max-width': '120px',
      },
    },
    // BPMN End Event: Pale Red circle with bold red border
    {
      selector: 'node.end, node[type = "end"]',
      style: {
        'shape': 'ellipse',
        'width': '32px',
        'height': '32px',
        'background-color': isDarkMode ? '#451a1a' : '#fef2f2',
        'border-width': '4px',
        'border-color': isDarkMode ? '#f87171' : '#dc2626',
        'text-valign': 'bottom',
        'text-margin-y': 6,
        'color': isDarkMode ? '#fca5a5' : '#b91c1c',
        'font-size': '9px',
        'text-max-width': '100px',
      },
    },
    // Completed Status: Light gold border (#fbbf24)
    {
      selector: 'node[status = "completed"], node.completed',
      style: {
        'border-color': '#fbbf24',
        'border-width': '3px',
      },
    },
    // Current Step Highlight (Bright Emerald Green)
    {
      selector: 'node[?isCurrent], node.current',
      style: {
        'background-color': isDarkMode ? '#064e3b' : '#d1fae5',
        'border-color': '#10b981',
        'border-width': '3.5px',
        'color': isDarkMode ? '#a7f3d0' : '#065f46',
      },
    },
    // Hover State for Clickable Step Nodes ONLY
    {
      selector: 'node.step.hovered[!isCurrent]',
      style: {
        'border-color': '#2563eb',
        'border-width': '3.5px',
        'background-color': isDarkMode ? '#2563eb' : '#bfdbfe',
        'color': isDarkMode ? '#ffffff' : '#1e3a8a',
      },
    },
    // Selected Node Highlight
    {
      selector: 'node:selected',
      style: {
        'border-color': '#3b82f6',
        'border-width': '3.5px',
      },
    },
    // Smooth Bezier Edges
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': isDarkMode ? '#475569' : '#94a3b8',
        'target-arrow-color': isDarkMode ? '#475569' : '#94a3b8',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '8px',
        'font-family': 'monospace, sans-serif',
        'color': isDarkMode ? '#94a3b8' : '#64748b',
        'text-background-opacity': 1,
        'text-background-color': isDarkMode ? '#0f172a' : '#ffffff',
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle',
      },
    },
  ];
}
EOF

# 3. Update useWorkflowPanel hook: ONLY non-current step nodes trigger onSelectNode
cat << 'EOF' > webview/src/features/explorer/workflow/hooks/use-workflow-panel.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import workflowData from '../data-workflow.json';
import { useAppContextStore } from '@/store/useAppContextStore';
import { getWorkflowCytoscapeStyles } from '../components/shapes-workflow';
import { logWorkflowPositionsIfChanged } from '../utils-workflow';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface WorkflowNodeData {
  id: string;
  label: string;
  desc: string;
  type: 'start' | 'end' | 'step' | 'decision';
  status?: string;
  isCurrent?: boolean;
}

export function useWorkflowPanel(onSelectNode?: (nodeId: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);

  const workflow = workflowData.workflow;

  const initCytoscape = useCallback(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    workflow.nodes.forEach((node) => {
      const isCurrent = node.status === 'current' || node.id === workflow.initialStepId;
      elements.push({
        group: 'nodes',
        classes: `${node.type} ${isCurrent ? 'current' : ''}`,
        data: {
          id: node.id,
          label: node.label,
          desc: node.desc,
          type: node.type,
          status: node.status || 'pending',
          isCurrent,
        },
        position: { x: node.x, y: node.y },
      });
    });

    workflow.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        },
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: getWorkflowCytoscapeStyles(isDarkMode),
      layout: {
        name: 'preset',
        fit: true,
        padding: 25,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
    });

    cyRef.current = cy;

    const currentStep = workflow.nodes.find((n) => n.status === 'current' || n.id === workflow.initialStepId);
    if (currentStep) {
      setSelectedNode({
        ...currentStep,
        isCurrent: true,
      } as WorkflowNodeData);
    }

    // Hover handler: Add pointer cursor and hover highlight ONLY for non-current STEP nodes
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      if (!data.isCurrent && data.type === 'step') {
        node.addClass('hovered');
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
      }
      setSelectedNode({
        id: data.id,
        label: data.label,
        desc: data.desc,
        type: data.type,
        status: data.status,
        isCurrent: data.isCurrent,
      });
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      node.removeClass('hovered');
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    });

    // Tap handler: ONLY non-current STEP nodes trigger step selection / popup closing
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();

      setSelectedNode({
        id: data.id,
        label: data.label,
        desc: data.desc,
        type: data.type,
        status: data.status,
        isCurrent: data.isCurrent,
      });

      if (!data.isCurrent && data.type === 'step') {
        logInfo(`[WorkflowPanel] Workflow step selected: '${data.label}' (ID: ${data.id})`);
        if (onSelectNode) {
          onSelectNode(data.id);
        }
      }
    });

    setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.fit(undefined, 25);
        cyRef.current.center();
      }
    }, 100);
  }, [isDarkMode, workflow, onSelectNode]);

  useEffect(() => {
    initCytoscape();
    return () => {
      if (cyRef.current) {
        logWorkflowPositionsIfChanged(cyRef.current, workflow.nodes as any[]);
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCytoscape, workflow.nodes]);

  const handleFitView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 25);
      cyRef.current.center();
    }
  };

  return {
    containerRef,
    workflowTitle: workflow.title,
    workflowDescription: workflow.description,
    selectedNode,
    handleFitView,
  };
}
EOF

# 4. Update useWorkflowPopup hook: ONLY non-current step nodes trigger onSelectNode
cat << 'EOF' > webview/src/features/explorer/workflow/hooks/use-workflow-popup.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import workflowData from '../data-workflow.json';
import { useAppContextStore } from '@/store/useAppContextStore';
import { getWorkflowCytoscapeStyles } from '../components/shapes-workflow';
import { logWorkflowPositionsIfChanged } from '../utils-workflow';

export interface WorkflowNodeData {
  id: string;
  label: string;
  desc: string;
  type: 'start' | 'end' | 'step' | 'decision';
  status?: string;
  isCurrent?: boolean;
}

export function useWorkflowPopup(onSelectNode?: (nodeId: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);

  const workflow = workflowData.workflow;

  const initCytoscape = useCallback(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    workflow.nodes.forEach((node) => {
      const isCurrent = node.status === 'current' || node.id === workflow.initialStepId;
      elements.push({
        group: 'nodes',
        classes: `${node.type} ${isCurrent ? 'current' : ''}`,
        data: {
          id: node.id,
          label: node.label,
          desc: node.desc,
          type: node.type,
          status: node.status || 'pending',
          isCurrent,
        },
        position: { x: node.x, y: node.y },
      });
    });

    workflow.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        },
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: getWorkflowCytoscapeStyles(isDarkMode),
      layout: {
        name: 'preset',
        fit: true,
        padding: 25,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
    });

    cyRef.current = cy;

    const currentStep = workflow.nodes.find((n) => n.status === 'current' || n.id === workflow.initialStepId);
    if (currentStep) {
      setSelectedNode({
        ...currentStep,
        isCurrent: true,
      } as WorkflowNodeData);
    }

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      if (!data.isCurrent && data.type === 'step') {
        node.addClass('hovered');
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
      }
      setSelectedNode({
        id: data.id,
        label: data.label,
        desc: data.desc,
        type: data.type,
        status: data.status,
        isCurrent: data.isCurrent,
      });
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      node.removeClass('hovered');
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();

      setSelectedNode({
        id: data.id,
        label: data.label,
        desc: data.desc,
        type: data.type,
        status: data.status,
        isCurrent: data.isCurrent,
      });

      if (!data.isCurrent && data.type === 'step') {
        if (onSelectNode) {
          onSelectNode(data.id);
        }
      }
    });

    setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.fit(undefined, 25);
        cyRef.current.center();
      }
    }, 100);
  }, [isDarkMode, workflow, onSelectNode]);

  useEffect(() => {
    initCytoscape();
    return () => {
      if (cyRef.current) {
        logWorkflowPositionsIfChanged(cyRef.current, workflow.nodes as any[]);
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCytoscape, workflow.nodes]);

  const handleFitView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 25);
      cyRef.current.center();
    }
  };

  return {
    containerRef,
    workflowTitle: workflow.title,
    workflowDescription: workflow.description,
    selectedNode,
    handleFitView,
  };
}
EOF

# 5. Update WorkflowPanel UI: Show "Select Step" button ONLY for step nodes
cat << 'EOF' > webview/src/features/explorer/workflow/workflow-panel.tsx
import React from 'react';
import { Focus, CheckCircle2, GitBranch, ArrowRight, Lock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowPanel } from './hooks/use-workflow-panel';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface WorkflowPanelProps {
  onSelectStep?: (stepId: string) => void;
}

export function WorkflowPanel({ onSelectStep }: WorkflowPanelProps) {
  const {
    containerRef,
    workflowTitle,
    workflowDescription,
    selectedNode,
    handleFitView,
  } = useWorkflowPanel(onSelectStep);

  return (
    <div className="flex flex-col w-full font-mono text-xs">
      {/* Panel Header */}
      <div className="flex justify-between items-center bg-muted/50 p-3 border-border/80 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch size={15} className="text-primary shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h4 className="font-bold text-foreground text-xs leading-none truncate">{workflowTitle}</h4>
            <p className="mt-1 text-[10px] text-muted-foreground truncate">{workflowDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 rounded-full font-bold text-[10px] text-emerald-500">
            <CheckCircle2 size={11} /> Step 1 Active
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/80 w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleFitView}
            data-tooltip="Fit Diagram View"
          >
            <Focus size={13} />
          </Button>
        </div>
      </div>

      {/* Cytoscape Canvas */}
      <div className="relative bg-muted/10 w-full h-[230px]">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Step Inspector Footer */}
      <div className="bg-muted/30 p-2.5 border-border/80 border-t min-h-[58px] flex items-center justify-between">
        {selectedNode ? (
          <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                    selectedNode.isCurrent
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : selectedNode.type === 'start'
                      ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      : selectedNode.type === 'end'
                      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                      : selectedNode.type === 'decision'
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {selectedNode.isCurrent
                    ? 'Active Step'
                    : selectedNode.type === 'start'
                    ? 'BPMN Start'
                    : selectedNode.type === 'end'
                    ? 'BPMN End'
                    : selectedNode.type === 'decision'
                    ? '◆ Decision Check'
                    : 'Process Step'}
                </span>
                <span className="font-bold text-foreground text-xs truncate">{selectedNode.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate leading-snug">{selectedNode.desc}</p>
            </div>

            <div className="shrink-0 ml-2">
              {selectedNode.isCurrent ? (
                <span className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground opacity-60">
                  <Lock size={10} /> Active
                </span>
              ) : selectedNode.type === 'step' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 h-6 font-bold text-[10px] text-primary hover:text-primary-foreground cursor-pointer"
                  onClick={() => {
                    logInfo(`[WorkflowPanel] Workflow step selected via inspector button: '${selectedNode.label}' (ID: ${selectedNode.id})`);
                    if (onSelectStep) {
                      onSelectStep(selectedNode.id);
                    }
                  }}
                >
                  <span>Select Step</span>
                  <ArrowRight size={10} />
                </Button>
              ) : (
                <span className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground opacity-50">
                  Info Only
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
            <HelpCircle size={12} />
            <span>Hover or click any node/decision diamond to inspect step details.</span>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

# 6. Rebuild workspace
npm run build

echo "✅ fix(workflow): Set active step to '1. File Selection', leaving Blast Radius white, and restricted node clickability/hover highlights strictly to step nodes!"
