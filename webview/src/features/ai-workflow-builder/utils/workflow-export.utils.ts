import { WorkflowSchema, WorkflowNode, WorkflowEdge } from '../model-ui';

export interface AccessibilityIssue {
  type: 'error' | 'warning';
  nodeId?: string;
  nodeLabel?: string;
  message: string;
}

export function validateWorkflowSchema(data: any): { valid: boolean; schema?: WorkflowSchema; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON payload format.' };
  }

  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    return { valid: false, error: 'Missing "nodes" or "edges" array in schema.' };
  }

  const sanitizedNodes: WorkflowNode[] = data.nodes.map((n: any) => ({
    id: String(n.id || `node-${Date.now()}`),
    type: n.type || 'textInput',
    position: { x: Number(n.position?.x || 100), y: Number(n.position?.y || 100) },
    width: Number(n.width || 240),
    height: Number(n.height || 200),
    data: {
      label: String(n.data?.label || 'Node'),
      type: n.data?.type || n.type || 'textInput',
      description: n.data?.description || '',
      status: 'idle',
      ports: Array.isArray(n.data?.ports) ? n.data.ports : [],
      ...n.data,
    },
  }));

  const sanitizedEdges: WorkflowEdge[] = data.edges.map((e: any, idx: number) => ({
    id: String(e.id || `edge-${idx}-${Date.now()}`),
    source: String(e.source),
    sourcePort: String(e.sourcePort || 'out'),
    target: String(e.target),
    targetPort: String(e.targetPort || 'in'),
    label: e.label ? String(e.label) : undefined,
  }));

  return {
    valid: true,
    schema: {
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
    },
  };
}

export function checkWorkflowAccessibility(nodes: WorkflowNode[], edges: WorkflowEdge[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  if (nodes.length === 0) {
    issues.push({
      type: 'warning',
      message: 'Workflow canvas is empty. Drag nodes from the left palette to build a flow.',
    });
    return issues;
  }

  // Check disconnected nodes
  nodes.forEach((node) => {
    const isSource = edges.some((e) => e.source === node.id);
    const isTarget = edges.some((e) => e.target === node.id);

    if (!isSource && !isTarget) {
      issues.push({
        type: 'warning',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `Node "${node.data.label}" is isolated and not connected to any other node.`,
      });
    }

    // Node specific parameter checks
    if (node.type === 'textInput' && (!node.data.promptText || !node.data.promptText.trim())) {
      issues.push({
        type: 'error',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `Text Input node "${node.data.label}" has an empty prompt field.`,
      });
    }

    if (node.type === 'searchTool' && (!node.data.subreddit || !node.data.subreddit.trim())) {
      issues.push({
        type: 'error',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `Search tool node "${node.data.label}" requires a subreddit name.`,
      });
    }
  });

  // Check for AI Agent connection
  const hasAgent = nodes.some((n) => n.type === 'aiAgent');
  if (!hasAgent) {
    issues.push({
      type: 'warning',
      message: 'No AI Agent node present in the workflow.',
    });
  }

  // Check for Output node
  const hasOutput = nodes.some((n) => n.type === 'formattedOutput');
  if (!hasOutput) {
    issues.push({
      type: 'warning',
      message: 'No Formatted Output node present to render workflow results.',
    });
  }

  return issues;
}
