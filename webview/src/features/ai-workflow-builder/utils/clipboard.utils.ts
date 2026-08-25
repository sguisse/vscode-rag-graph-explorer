import { WorkflowNode } from '../model-ui';

let nodeClipboard: WorkflowNode | null = null;

export function copyNodeToClipboard(node: WorkflowNode) {
  nodeClipboard = JSON.parse(JSON.stringify(node));
}

export function getClipboardNode(): WorkflowNode | null {
  return nodeClipboard ? JSON.parse(JSON.stringify(nodeClipboard)) : null;
}

export function duplicateNode(node: WorkflowNode, offset = { x: 40, y: 40 }): WorkflowNode {
  const cloned: WorkflowNode = JSON.parse(JSON.stringify(node));
  cloned.id = `node-${node.type}-${Date.now()}`;
  cloned.position.x += offset.x;
  cloned.position.y += offset.y;
  cloned.data.label = `${node.data.label} (Copy)`;
  cloned.data.status = 'idle';
  return cloned;
}
