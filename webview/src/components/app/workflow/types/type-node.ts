export const NODE_TYPE_LIST = ['start', 'end', 'step', 'decision'] as const;
export type NodeType = (typeof NODE_TYPE_LIST)[number];

export function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && NODE_TYPE_LIST.includes(value as NodeType);
}

export const NODE_STATUS_LIST = ['pending', 'current', 'completed', 'cancelled'] as const;
export type NodeStatus = (typeof NODE_STATUS_LIST)[number];

export function isNodeStatus(value: unknown): value is NodeStatus {
  return typeof value === 'string' && NODE_STATUS_LIST.includes(value as NodeStatus);
}

export function isCurrentStatus(value: unknown): boolean {
  return value === 'current';
}
