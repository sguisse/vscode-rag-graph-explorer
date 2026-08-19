import cytoscape from 'cytoscape';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import workflowData from './data-workflow.json';

export interface WorkflowNodeConfig {
  id: string;
  label: string;
  desc: string;
  type: 'start' | 'end' | 'step' | 'decision';
  x: number;
  y: number;
  status?: string;
}

/**
 * Checks if any Cytoscape node positions have changed relative to the initial workflow data.
 * If at least one node position changed, logs the updated workflow JSON via logInfo.
 */
export function logWorkflowPositionsIfChanged(
  cy: cytoscape.Core | null,
  initialNodes: WorkflowNodeConfig[]
): boolean {
  if (!cy || cy.destroyed()) return false;

  let hasChanged = false;

  const updatedNodes = initialNodes.map((initialNode) => {
    const cyNode = cy.getElementById(initialNode.id);
    if (!cyNode || cyNode.empty()) {
      return initialNode;
    }

    const pos = cyNode.position();
    const roundedX = Math.round(pos.x);
    const roundedY = Math.round(pos.y);

    if (roundedX !== initialNode.x || roundedY !== initialNode.y) {
      hasChanged = true;
    }

    return {
      ...initialNode,
      x: roundedX,
      y: roundedY,
    };
  });

  if (hasChanged) {
    const updatedWorkflowJson = {
      workflow: {
        ...workflowData.workflow,
        nodes: updatedNodes,
      },
    };

    logInfo(
      '[WorkflowUtils] Updated workflow node positions on popup close:',
      [updatedWorkflowJson]
    );
    return true;
  }

  return false;
}
