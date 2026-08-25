import { getTopologicalSortOrder } from './dag-engine.utils';
import { checkWorkflowAccessibility, validateWorkflowSchema } from './workflow-export.utils';
import { WorkflowNode, WorkflowEdge } from '../model-ui';

export function runWorkflowSanityTests(): boolean {
  console.info('🧪 Running AI Workflow Builder DAG & Schema Sanity Checks...');

  const mockNodes: WorkflowNode[] = [
    {
      id: 'node-A',
      type: 'textInput',
      position: { x: 0, y: 0 },
      data: { label: 'Input A', type: 'textInput', promptText: 'Hello', ports: [] },
    },
    {
      id: 'node-B',
      type: 'aiAgent',
      position: { x: 200, y: 0 },
      data: { label: 'Agent B', type: 'aiAgent', ports: [] },
    },
  ];

  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'node-A', sourcePort: 'out', target: 'node-B', targetPort: 'in' },
  ];

  // Test 1: Topological Sort
  const sorted = getTopologicalSortOrder(mockNodes, mockEdges);
  if (sorted[0].id !== 'node-A' || sorted[1].id !== 'node-B') {
    console.error('❌ Topological sort test failed.');
    return false;
  }

  // Test 2: Schema Validation
  const validation = validateWorkflowSchema({ nodes: mockNodes, edges: mockEdges });
  if (!validation.valid || !validation.schema) {
    console.error('❌ Schema validation test failed.');
    return false;
  }

  // Test 3: Accessibility Check
  const issues = checkWorkflowAccessibility(mockNodes, mockEdges);
  if (issues.some((i) => i.type === 'error')) {
    console.error('❌ Unexpected error in accessibility diagnostic.');
    return false;
  }

  console.info('✅ All AI Workflow Builder sanity checks passed!');
  return true;
}
