import { NodeType, WorkflowNode } from '../model-ui';

export function createDefaultNode(type: NodeType, position: { x: number; y: number }): WorkflowNode {
  const id = `node-${type}-${Date.now()}`;

  switch (type) {
    case 'textInput':
      return {
        id,
        type,
        position,
        width: 240,
        height: 180,
        data: {
          label: 'Text Input',
          type,
          description: 'The starting prompt for the flow',
          promptText: 'Enter your custom AI prompt here...',
          ports: [{ id: 'text', name: 'text', type: 'text', direction: 'output', color: 'bg-rose-400' }],
        },
      };
    case 'markdownFile':
      return {
        id,
        type,
        position,
        width: 240,
        height: 220,
        data: {
          label: 'Markdown File',
          type,
          description: 'Instruction markdown prompt file',
          markdownFile: 'skill-definition.md',
          instructionText: 'You are an AI system assistant.',
          ports: [{ id: 'skill', name: 'skill', type: 'skill', direction: 'output', color: 'bg-amber-500' }],
        },
      };
    case 'aiAgent':
      return {
        id,
        type,
        position,
        width: 260,
        height: 240,
        data: {
          label: 'AI Agent',
          type,
          description: 'Runs an LLM with tool calling',
          model: 'Mock - Offline',
          tokenBudget: 1000,
          ports: [
            { id: 'prompt', name: 'prompt', type: 'prompt', direction: 'input', color: 'bg-amber-400' },
            { id: 'skill', name: 'skill', type: 'skill', direction: 'input', color: 'bg-amber-500' },
            { id: 'agent_tools', name: 'agent tools', type: 'tool', direction: 'input', color: 'bg-rose-400' },
            { id: 'result', name: 'result', type: 'result', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };
    case 'searchTool':
      return {
        id,
        type,
        position,
        width: 240,
        height: 190,
        data: {
          label: 'Search Reddit',
          type,
          description: 'Finds trending posts in a subreddit',
          subreddit: 'reactjs',
          topicLimit: 10,
          ports: [{ id: 'tool', name: 'tool', type: 'tool', direction: 'output', color: 'bg-rose-500' }],
        },
      };
    case 'formattedOutput':
      return {
        id,
        type,
        position,
        width: 260,
        height: 200,
        data: {
          label: 'Formatted Output',
          type,
          description: 'Renders the result as Markdown',
          outputText: 'Waiting for workflow execution...',
          ports: [{ id: 'result', name: 'result', type: 'result', direction: 'input', color: 'bg-emerald-400' }],
        },
      };
    case 'annotation':
      return {
        id,
        type,
        position,
        width: 280,
        height: 240,
        data: {
          label: 'AI Agent Setup',
          type,
          description: 'Movable instruction & annotation box',
          annotationTitle: 'AI agent setup',
          annotationSteps: [
            'Choose a model',
            'Set token budget',
            'Connect prompt & skill',
            'Add agent tools',
            'Run & view result',
          ],
          annotationTip: 'Tip: Runs with mock data by default — add your Anthropic or OpenAI API key to use a real LLM.',
          ports: [
            { id: 'note', name: 'annotation link', type: 'note', direction: 'output', color: 'bg-sky-400' },
          ],
        },
      };
    default:
      return {
        id,
        type: 'textInput',
        position,
        width: 200,
        height: 150,
        data: {
          label: 'Custom Node',
          type: 'textInput',
          ports: [],
        },
      };
  }
}
