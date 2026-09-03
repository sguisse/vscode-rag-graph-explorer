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

    case 'jsonInput':
      return {
        id,
        type,
        position,
        width: 260,
        height: 200,
        data: {
          label: 'JSON Input',
          type,
          description: 'Raw or structured JSON value payload',
          jsonText: '{\n  "user": "Alice",\n  "role": "admin"\n}',
          ports: [{ id: 'json_out', name: 'json', type: 'result', direction: 'output', color: 'bg-amber-400' }],
        },
      };

    case 'urlInput':
      return {
        id,
        type,
        position,
        width: 260,
        height: 200,
        data: {
          label: 'URL Input',
          type,
          description: 'URL endpoint with authentication token',
          url: 'https://api.example.com/data',
          bearerToken: '',
          ports: [{ id: 'url_out', name: 'response', type: 'result', direction: 'output', color: 'bg-emerald-400' }],
        },
      };

    case 'llm':
      return {
        id,
        type,
        position,
        width: 280,
        height: 240,
        data: {
          label: 'LLM Engine',
          type,
          description: 'Run LLM with prompt & multiple file context inputs',
          llmProvider: 'Ollama',
          model: 'llama3:latest',
          ports: [
            { id: 'prompt_in', name: 'prompt', type: 'prompt', direction: 'input', color: 'bg-amber-400' },
            { id: 'file_ctx_1', name: 'fileCtx 1', type: 'text', direction: 'input', color: 'bg-purple-400' },
            { id: 'llm_out', name: 'response', type: 'result', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };

    case 'replace':
      return {
        id,
        type,
        position,
        width: 250,
        height: 190,
        data: {
          label: 'Replace Text',
          type,
          description: 'Regex search pattern and replace string',
          replacePattern: 'TODO',
          replaceBy: 'DONE',
          ports: [
            { id: 'in', name: 'input', type: 'text', direction: 'input', color: 'bg-rose-400' },
            { id: 'out', name: 'output', type: 'text', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };

    case 'sanitize':
      return {
        id,
        type,
        position,
        width: 250,
        height: 190,
        data: {
          label: 'Sanitize Text',
          type,
          description: 'Mask, Hash, or Redact sensitive patterns',
          sanitizePattern: '\\b\\d{4}-\\d{4}-\\d{4}-\\d{4}\\b',
          sanitizeMethod: 'Mask',
          ports: [
            { id: 'in', name: 'input', type: 'text', direction: 'input', color: 'bg-rose-400' },
            { id: 'out', name: 'output', type: 'text', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };

    case 'extractData':
      return {
        id,
        type,
        position,
        width: 250,
        height: 190,
        data: {
          label: 'Extract Variable',
          type,
          description: 'Extract Regex pattern into context variable',
          extractPattern: '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
          extractVarName: 'extractedEmail',
          ports: [
            { id: 'in', name: 'input', type: 'text', direction: 'input', color: 'bg-rose-400' },
            { id: 'out', name: 'output', type: 'text', direction: 'output', color: 'bg-sky-400' },
          ],
        },
      };

    case 'image':
      return {
        id,
        type,
        position,
        width: 260,
        height: 220,
        data: {
          label: 'Image Node',
          type,
          description: 'Image display and preview node',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
          displayImageOnly: false,
          ports: [
            { id: 'image_in', name: 'input', type: 'result', direction: 'input', color: 'bg-amber-400' },
            { id: 'image_out', name: 'output', type: 'result', direction: 'output', color: 'bg-indigo-400' },
          ],
        },
      };

    case 'script':
      return {
        id,
        type,
        position,
        width: 260,
        height: 220,
        data: {
          label: 'Script Execution',
          type,
          description: 'Executes Python or Bash script',
          scriptType: 'python',
          scriptLocation: 'scripts/process_data.py',
          ports: [
            { id: 'arg_1', name: 'arg_1', type: 'text', direction: 'input', color: 'bg-purple-400' },
            { id: 'result', name: 'result', type: 'result', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };

    case 'argument':
      return {
        id,
        type,
        position,
        width: 230,
        height: 170,
        data: {
          label: 'Script Argument',
          type,
          description: 'Key/Value script argument',
          argumentName: 'env',
          argumentValue: 'production',
          ports: [
            { id: 'arg_out', name: 'arg', type: 'text', direction: 'output', color: 'bg-purple-400' },
          ],
        },
      };

    case 'outputAnalyzer':
      return {
        id,
        type,
        position,
        width: 250,
        height: 190,
        data: {
          label: 'Output Analyzer',
          type,
          description: 'Evaluates output status (OK / KO)',
          analyzerCondition: 'exit_code == 0',
          analyzerStatus: 'idle',
          ports: [
            { id: 'input', name: 'input', type: 'result', direction: 'input', color: 'bg-amber-400' },
            { id: 'ok', name: 'OK', type: 'result', direction: 'output', color: 'bg-emerald-500' },
            { id: 'ko', name: 'KO', type: 'result', direction: 'output', color: 'bg-rose-500' },
          ],
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
            { id: 'skill', name: 'skill', type: 'skill', direction: 'input', color: 'bg-sky-400' },
            { id: 'agent_tools', name: 'agent tools', type: 'tool', direction: 'input', color: 'bg-purple-400' },
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
