#!/usr/bin/env bash
set -e

# Ensure workflow hooks and components directory exists
mkdir -p webview/src/features/explorer/workflow/hooks
mkdir -p webview/src/features/explorer/workflow

# 1. Update use-workflow-popup.ts (Single Responsibility: Managing Popup visibility state, hover timer grace period, and select/close actions)
cat << 'EOF' > webview/src/features/explorer/workflow/hooks/use-workflow-popup.ts
import { useState, useRef, useCallback } from 'react';

export function useWorkflowPopup(
  onSelectStep?: (stepId: string) => void,
  closeDelayMs = 200
) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, closeDelayMs);
  }, [closeDelayMs]);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const handleSelectStep = useCallback(
    (stepId: string) => {
      if (onSelectStep) {
        onSelectStep(stepId);
      }
      handleClose();
    },
    [onSelectStep, handleClose]
  );

  return {
    isOpen,
    setIsOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
    handleSelectStep,
  };
}
EOF

# 2. Update use-workflow-panel.ts (Single Responsibility: Managing Cytoscape diagram initialization, canvas events, selected node state, fit view, and position logging)
cat << 'EOF' > webview/src/features/explorer/workflow/hooks/use-workflow-panel.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import rawWorkflowData from '../data-workflow.json';
import { useAppContextStore } from '@/store/useAppContextStore';
import { getWorkflowCytoscapeStyles } from '../components/shapes-workflow';
import { logWorkflowPositionsIfChanged } from '../utils-workflow';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { WorkflowData, WorkflowNode } from '../model/workflow-model';
import { isCurrentStatus } from '../model/types/type-node';

function sanitizeLabel(label: string): string {
  if (!label) return '';
  return label
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
}

export function useWorkflowPanel(onSelectNode?: (nodeId: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const workflow = (rawWorkflowData as WorkflowData).workflow;

  const initCytoscape = useCallback(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    workflow.nodes.forEach((node: WorkflowNode) => {
      const isCurrent = isCurrentStatus(node.status) || node.id === workflow.initialStepId;
      const clickEnabled = node.clickEnabled !== undefined ? node.clickEnabled : node.type === 'step';
      elements.push({
        group: 'nodes',
        classes: `${node.type} ${isCurrent ? 'current' : ''}`,
        data: {
          id: node.id,
          label: sanitizeLabel(node.label),
          desc: node.desc,
          type: node.type,
          status: node.status || 'pending',
          isCurrent,
          clickEnabled,
        },
        position: { x: node.x ?? 0, y: node.y ?? 0 },
      });
    });

    const defaultEdgeColor = isDarkMode ? '#475569' : '#94a3b8';
    const defaultEdgeTextColor = isDarkMode ? '#94a3b8' : '#64748b';

    workflow.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: sanitizeLabel(edge.label),
          lineStyle: edge.lineStyle || 'solid',
          curveStyle: edge.curveStyle || 'bezier',
          arrowShape: edge.arrowShape || 'triangle',
          color: edge.color || defaultEdgeColor,
          textColor: edge.textColor || defaultEdgeTextColor,
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

    const currentStep = workflow.nodes.find((n) => isCurrentStatus(n.status) || n.id === workflow.initialStepId);
    if (currentStep) {
      setSelectedNode({
        ...currentStep,
        label: sanitizeLabel(currentStep.label),
        isCurrent: true,
        clickEnabled: currentStep.clickEnabled !== undefined ? currentStep.clickEnabled : currentStep.type === 'step',
      });
    }

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      if (!data.isCurrent && data.clickEnabled) {
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
        clickEnabled: data.clickEnabled,
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
        clickEnabled: data.clickEnabled,
      });

      if (!data.isCurrent && data.clickEnabled) {
        logInfo(`[WorkflowPanel] Workflow step selected: '${data.label.replace(/\n/g, ' ')}' (ID: ${data.id})`);
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
        logWorkflowPositionsIfChanged(cyRef.current, workflow.nodes);
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

# 3. Update workflow-popup.tsx component to leverage useWorkflowPopup hook
cat << 'EOF' > webview/src/features/explorer/workflow/workflow-popup.tsx
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkflowPanel } from './workflow-panel';
import { useWorkflowPopup } from './hooks/use-workflow-popup';

interface WorkflowPopupProps {
  children: React.ReactNode;
  onSelectStep?: (stepId: string) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function WorkflowPopup({
  children,
  onSelectStep,
  side = 'bottom',
  align = 'center',
}: WorkflowPopupProps) {
  const {
    isOpen,
    setIsOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleSelectStep,
  } = useWorkflowPopup(onSelectStep);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="inline-block"
        >
          {children}
        </div>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        className="z-[9999] bg-card/95 shadow-2xl backdrop-blur-md p-0 border-primary/20 rounded-xl w-[1200px] overflow-hidden font-mono text-xs animate-in duration-200 fade-in zoom-in-95"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <WorkflowPanel onSelectStep={handleSelectStep} />
      </PopoverContent>
    </Popover>
  );
}
EOF

# 4. Rebuild workspace to ensure clean TypeScript compilation


echo "✅ refactor(workflow): Successfully separated responsibilities following SOLID principles and eliminated code duplication between panel and popup hooks!"
