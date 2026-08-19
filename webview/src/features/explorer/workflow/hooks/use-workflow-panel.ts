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
