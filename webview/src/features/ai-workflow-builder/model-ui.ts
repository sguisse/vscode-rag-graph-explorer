export type NodeType =
  | 'textInput'
  | 'markdownFile'
  | 'aiAgent'
  | 'searchTool'
  | 'formattedOutput'
  | 'instructionBox'
  | 'annotation'
  | 'script'
  | 'argument'
  | 'outputAnalyzer';

export type PortType = 'prompt' | 'skill' | 'tool' | 'text' | 'result' | 'note';
export type PortDirection = 'input' | 'output';
export type PortSide = 'top' | 'right' | 'bottom' | 'left';

export type EdgeStyle = 'solid' | 'dashed' | 'dotted';
export type NodeFontFamily = 'Sans' | 'Mono' | 'Serif';

export interface WorkflowPort {
  id: string;
  name: string;
  type: PortType;
  direction: PortDirection;
  side?: PortSide;
  color?: string;
}

export interface BaseNodeData {
  label: string;
  type: NodeType;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  executionTimeMs?: number;
  ports: WorkflowPort[];
  promptText?: string;
  markdownFile?: string;
  instructionText?: string;
  model?: string;
  tokenBudget?: number;
  subreddit?: string;
  topicLimit?: number;
  outputText?: string;
  annotationTitle?: string;
  annotationSteps?: string[];
  annotationTip?: string;

  // Script & Logic Properties
  scriptType?: 'python' | 'bash';
  scriptLocation?: string;
  argumentName?: string;
  argumentValue?: string;
  analyzerCondition?: string;
  analyzerStatus?: 'OK' | 'KO' | 'idle';

  // Appearance Customization
  fillColor?: string;
  textColor?: string;
  borderColor?: string;
  fontFamily?: NodeFontFamily;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: BaseNodeData;
  parentId?: string;
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  label?: string;
  style?: EdgeStyle;
  color?: string;
  labelColor?: string;
  labelTextColor?: string;
}

export interface WorkflowSchema {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface PaletteItemDefinition {
  type: NodeType;
  label: string;
  category: 'Inputs' | 'Agent' | 'Tools' | 'Output' | 'Annotations' | 'Scripts' | 'Logic';
  description: string;
  iconName: string;
  badge?: string;
}
