export type NodeType =
  | 'textInput'
  | 'jsonInput'
  | 'urlInput'
  | 'markdownFile'
  | 'aiAgent'
  | 'llm'
  | 'replace'
  | 'sanitize'
  | 'extractData'
  | 'searchTool'
  | 'formattedOutput'
  | 'instructionBox'
  | 'annotation'
  | 'script'
  | 'argument'
  | 'outputAnalyzer'
  | 'image';

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
  isCollapsed?: boolean;
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

  // JSON Input Properties
  jsonText?: string;

  // URL Input Properties
  url?: string;
  bearerToken?: string;

  // LLM Node Properties
  llmProvider?: 'Ollama' | 'Copilot' | 'Gemini' | 'Claude' | 'OpenAI';

  // Transformer Properties
  replacePattern?: string;
  replaceBy?: string;
  sanitizePattern?: string;
  sanitizeMethod?: 'Hash' | 'Mask' | 'MD5' | 'Redact';

  // Extractor Properties
  extractPattern?: string;
  extractVarName?: string;

  // Universal Variable Store
  outputVariableName?: string;

  // Script & Logic Properties
  scriptType?: 'python' | 'bash';
  scriptLocation?: string;
  argumentName?: string;
  argumentValue?: string;
  analyzerCondition?: string;
  analyzerStatus?: 'OK' | 'KO' | 'idle';

  // Image Node Properties
  imageUrl?: string;
  displayImageOnly?: boolean;

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
  group: 'Data Node' | 'Step Node';
  subGroup: string;
  category?: string;
  description: string;
  iconName: string;
  badge?: string;
}
