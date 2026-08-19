import { NodeType, NodeStatus, EdgeLineStyle, EdgeCurveStyle, EdgeArrowShape } from './types';

export interface WorkflowNode {
  id: string;
  label: string;
  desc: string;
  type: NodeType;
  x?: number;
  y?: number;
  status?: NodeStatus;
  clickEnabled?: boolean;
  isCurrent?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  lineStyle?: EdgeLineStyle;
  curveStyle?: EdgeCurveStyle;
  arrowShape?: EdgeArrowShape;
  color?: string;
  textColor?: string;
}

export interface WorkflowDefinition {
  title: string;
  description: string;
  initialStepId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowData {
  workflow: WorkflowDefinition;
}
