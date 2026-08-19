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
