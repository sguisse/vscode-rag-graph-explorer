import { WorkflowNode, WorkflowPort, WorkflowEdge, PortSide } from '../model-ui';

export interface PortCoordinateResult {
  x: number;
  y: number;
  side: PortSide;
}

export function getDynamicPortSide(
  node: WorkflowNode,
  port: WorkflowPort,
  edges: WorkflowEdge[],
  nodes: WorkflowNode[]
): PortSide {
  if (port.side) return port.side;

  const connectedEdge = edges.find(
    (e) => (e.source === node.id && e.sourcePort === port.id) || (e.target === node.id && e.targetPort === port.id)
  );

  if (!connectedEdge) {
    return port.direction === 'input' ? 'left' : 'right';
  }

  const otherNodeId = connectedEdge.source === node.id ? connectedEdge.target : connectedEdge.source;
  const otherNode = nodes.find((n) => n.id === otherNodeId);

  if (!otherNode) {
    return port.direction === 'input' ? 'left' : 'right';
  }

  const nodeW = node.data.isCollapsed ? 150 : (node.width || 240);
  const nodeH = node.data.isCollapsed ? 150 : (node.height || 200);
  const otherW = otherNode.data.isCollapsed ? 150 : (otherNode.width || 240);
  const otherH = otherNode.data.isCollapsed ? 150 : (otherNode.height || 200);

  const cx1 = node.position.x + nodeW / 2;
  const cy1 = node.position.y + nodeH / 2;
  const cx2 = otherNode.position.x + otherW / 2;
  const cy2 = otherNode.position.y + otherH / 2;

  const dx = cx2 - cx1;
  const dy = cy2 - cy1;

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy > 0 ? 'bottom' : 'top';
  } else {
    return dx > 0 ? 'right' : 'left';
  }
}

export function getPortCoordinates(
  node: WorkflowNode,
  portId: string,
  edges: WorkflowEdge[],
  nodes: WorkflowNode[],
  candidateNotePort?: { targetNodeId: string; side: PortSide; portName: string } | null
): PortCoordinateResult {
  const width = node.data.isCollapsed ? 150 : (node.width || 240);
  const height = node.data.isCollapsed ? 150 : (node.height || 200);

  if (
    candidateNotePort &&
    candidateNotePort.targetNodeId === node.id &&
    (portId === 'candidate-temp-id' || !node.data.ports.some((p) => p.id === portId))
  ) {
    const side = candidateNotePort.side;
    let x = node.position.x;
    let y = node.position.y;
    switch (side) {
      case 'top':
        x += width / 2;
        y += 0;
        break;
      case 'bottom':
        x += width / 2;
        y += height;
        break;
      case 'left':
        x += 0;
        y += height / 2;
        break;
      case 'right':
        x += width;
        y += height / 2;
        break;
    }
    return { x, y, side };
  }

  const port = node.data.ports.find((p) => p.id === portId);
  if (!port) {
    return { x: node.position.x + width / 2, y: node.position.y + height / 2, side: 'right' };
  }

  const side = port.side || getDynamicPortSide(node, port, edges, nodes);
  const sidePorts = node.data.ports.filter((p) => (p.side || getDynamicPortSide(node, p, edges, nodes)) === side);

  const index = sidePorts.findIndex((p) => p.id === portId);
  const total = sidePorts.length || 1;
  const ratio = (index >= 0 ? index + 1 : 1) / (total + 1);

  let x = node.position.x;
  let y = node.position.y;

  switch (side) {
    case 'top':
      x += width * ratio;
      y += 0;
      break;
    case 'bottom':
      x += width * ratio;
      y += height;
      break;
    case 'left':
      x += 0;
      y += height * ratio;
      break;
    case 'right':
      x += width;
      y += height * ratio;
      break;
  }

  return { x, y, side };
}

export function getBezierPath(
  src: PortCoordinateResult,
  tgt: PortCoordinateResult
): { path: string; midX: number; midY: number } {
  const dist = Math.hypot(tgt.x - src.x, tgt.y - src.y) * 0.4;
  const offset = Math.max(25, Math.min(dist, 100));

  let c1x = src.x;
  let c1y = src.y;
  switch (src.side) {
    case 'right': c1x += offset; break;
    case 'left': c1x -= offset; break;
    case 'bottom': c1y += offset; break;
    case 'top': c1y -= offset; break;
  }

  let c2x = tgt.x;
  let c2y = tgt.y;
  switch (tgt.side) {
    case 'right': c2x += offset; break;
    case 'left': c2x -= offset; break;
    case 'bottom': c2y += offset; break;
    case 'top': c2y -= offset; break;
  }

  return {
    path: `M ${src.x} ${src.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tgt.x} ${tgt.y}`,
    midX: (src.x + tgt.x) / 2,
    midY: (src.y + tgt.y) / 2,
  };
}
