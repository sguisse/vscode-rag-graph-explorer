import { WorkflowNode, WorkflowEdge } from '../model-ui';

export function getTopologicalSortOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (adjList.has(edge.source) && inDegree.has(edge.target)) {
      adjList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  const sortedOrder: WorkflowNode[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currNode = nodeMap.get(currId);
    if (currNode) sortedOrder.push(currNode);

    const neighbors = adjList.get(currId) || [];
    neighbors.forEach((nextId) => {
      const newDegree = (inDegree.get(nextId) || 1) - 1;
      inDegree.set(nextId, newDegree);
      if (newDegree === 0) queue.push(nextId);
    });
  }

  return sortedOrder.length === nodes.length ? sortedOrder : nodes;
}
