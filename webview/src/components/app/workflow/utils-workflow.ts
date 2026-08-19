import cytoscape from 'cytoscape';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { WorkflowNode, WorkflowData } from './model/workflow-model';

/**
 * Checks if any Cytoscape node positions have changed relative to the initial workflow data.
 * If at least one node position changed, logs the updated workflow JSON via logInfo.
 */
export function logWorkflowPositionsIfChanged(
  cy: cytoscape.Core | null,
  initialNodes: WorkflowNode[],
  workflowData: WorkflowData
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
    const updatedWorkflowJson: WorkflowData = {
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
