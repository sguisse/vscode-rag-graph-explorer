import { WorkflowSchema } from '../model-ui';
import { DEFAULT_WORKFLOW_SCHEMA } from './workflow.constants';

export interface WorkflowPresetTemplate {
  id: string;
  name: string;
  description: string;
  schema: WorkflowSchema;
}

export const WORKFLOW_PRESET_TEMPLATES: WorkflowPresetTemplate[] = [
  {
    id: 'ai-agent-setup',
    name: 'AI Agent Setup (Default)',
    description: 'JointJS AI Agent flow with Markdown instruction, text input prompt, and Reddit search tool.',
    schema: DEFAULT_WORKFLOW_SCHEMA,
  },
  {
    id: 'code-review-pipeline',
    name: 'Code Review & Security Analysis',
    description: 'Analyzes code snippets against security guidelines and outputs structured markdown feedback.',
    schema: {
      nodes: [
        {
          id: 'node-markdown-sec',
          type: 'markdownFile',
          position: { x: 80, y: 80 },
          data: {
            label: 'Security Guidelines',
            type: 'markdownFile',
            description: 'OWASP Security Guidelines',
            markdownFile: 'security-rules.md',
            instructionText: 'Enforce OWASP top 10 security standards and sanitize all inputs.',
            ports: [{ id: 'skill', name: 'skill', type: 'skill', direction: 'output', color: 'bg-amber-500' }],
          },
          width: 240,
          height: 220,
        },
        {
          id: 'node-text-code',
          type: 'textInput',
          position: { x: 80, y: 330 },
          data: {
            label: 'Target Source Code',
            type: 'textInput',
            description: 'Source code snippet for review',
            promptText: 'function handleLogin(req, res) { const user = query("SELECT * FROM users WHERE id=" + req.body.id); }',
            ports: [{ id: 'text', name: 'text', type: 'text', direction: 'output', color: 'bg-rose-400' }],
          },
          width: 240,
          height: 180,
        },
        {
          id: 'node-agent-reviewer',
          type: 'aiAgent',
          position: { x: 420, y: 200 },
          data: {
            label: 'Security Auditor Agent',
            type: 'aiAgent',
            description: 'Runs static analysis & vulnerability check',
            model: 'gpt-4o',
            tokenBudget: 2000,
            ports: [
              { id: 'prompt', name: 'prompt', type: 'prompt', direction: 'input', color: 'bg-amber-400' },
              { id: 'skill', name: 'skill', type: 'skill', direction: 'input', color: 'bg-amber-500' },
              { id: 'result', name: 'result', type: 'result', direction: 'output', color: 'bg-emerald-400' },
            ],
          },
          width: 260,
          height: 240,
        },
        {
          id: 'node-output-report',
          type: 'formattedOutput',
          position: { x: 760, y: 220 },
          data: {
            label: 'Audit Findings',
            type: 'formattedOutput',
            description: 'Security vulnerabilities report',
            outputText: 'Run flow to perform security audit...',
            ports: [{ id: 'result', name: 'result', type: 'result', direction: 'input', color: 'bg-emerald-400' }],
          },
          width: 260,
          height: 200,
        },
      ],
      edges: [
        { id: 'sec-edge-1', source: 'node-markdown-sec', sourcePort: 'skill', target: 'node-agent-reviewer', targetPort: 'skill' },
        { id: 'sec-edge-2', source: 'node-text-code', sourcePort: 'text', target: 'node-agent-reviewer', targetPort: 'prompt' },
        { id: 'sec-edge-3', source: 'node-agent-reviewer', sourcePort: 'result', target: 'node-output-report', targetPort: 'result', label: 'Vulnerabilities: 1' },
      ],
    },
  },
  {
    id: 'simple-qa-pipeline',
    name: 'Simple Q&A Pipeline',
    description: 'Minimal two-node pipeline taking prompt input directly into formatted Markdown output.',
    schema: {
      nodes: [
        {
          id: 'node-text-qa',
          type: 'textInput',
          position: { x: 100, y: 150 },
          data: {
            label: 'User Question',
            type: 'textInput',
            description: 'Question input prompt',
            promptText: 'Explain SOLID principles in React TypeScript development.',
            ports: [{ id: 'text', name: 'text', type: 'text', direction: 'output', color: 'bg-rose-400' }],
          },
          width: 250,
          height: 180,
        },
        {
          id: 'node-output-qa',
          type: 'formattedOutput',
          position: { x: 450, y: 140 },
          data: {
            label: 'Answer Result',
            type: 'formattedOutput',
            description: 'Formatted answer output',
            outputText: 'Run flow to see explanation...',
            ports: [{ id: 'result', name: 'result', type: 'result', direction: 'input', color: 'bg-emerald-400' }],
          },
          width: 260,
          height: 200,
        },
      ],
      edges: [
        { id: 'qa-edge-1', source: 'node-text-qa', sourcePort: 'text', target: 'node-output-qa', targetPort: 'result', label: 'Direct Feed' },
      ],
    },
  },
];
