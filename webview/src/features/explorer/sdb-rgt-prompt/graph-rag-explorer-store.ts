import { create } from 'zustand';

export interface GraphRagExplorerConfig {
  backendConfigPath: string;
  defaultClient: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  systemPromptPrefix: string;
  autoApplyChanges: boolean;
  saveHistoryLocally: boolean;
}

export interface PromptFields {
  predefined: string;
  mode: 'role' | 'agent';
  roleOrAgent: string;
  selectedAgent: string;
  tone: string;
  context: string;
  expected: string;
  output: string;
  samples: string;
}

interface GraphRagExplorerState {
  config: GraphRagExplorerConfig;
  promptFields: PromptFields;
  updateConfig: (partial: Partial<GraphRagExplorerConfig>) => void;
  updatePromptFields: (partial: Partial<PromptFields>) => void;
  resetPromptFields: () => void;
  getFullPrompt: () => string;
}

const INITIAL_PROMPT_FIELDS: PromptFields = {
  predefined: 'custom',
  mode: 'role',
  roleOrAgent: 'Senior React & TypeScript Architect',
  selectedAgent: 'CodeRefactoringAgent',
  tone: 'Concise, surgical, highly technical',
  context: 'Optimizing codebase dependencies and AST context for LLM prompt engineering.',
  expected: 'Clean, production-ready React component with Tailwind CSS styling.',
  output: 'Single self-contained file with full implementation.',
  samples: 'Include full imports and type declarations without truncation.',
};

export const useGraphRagExplorerStore = create<GraphRagExplorerState>((set, get) => ({
  config: {
    backendConfigPath: '.token-razor/config/explorer-config.json',
    defaultClient: 'Ollama',
    defaultModel: 'llama3:latest',
    maxTokens: 4096,
    temperature: 0.2,
    systemPromptPrefix: 'You are an expert senior software architect.',
    autoApplyChanges: false,
    saveHistoryLocally: true,
  },
  promptFields: INITIAL_PROMPT_FIELDS,
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  updatePromptFields: (partial) =>
    set((state) => ({ promptFields: { ...state.promptFields, ...partial } })),
  resetPromptFields: () => set({ promptFields: INITIAL_PROMPT_FIELDS }),
  getFullPrompt: () => {
    const { promptFields, config } = get();
    const roleHeader =
      promptFields.mode === 'agent'
        ? `[AGENT]: ${promptFields.selectedAgent} (${promptFields.roleOrAgent})`
        : `[ROLE]: ${promptFields.roleOrAgent}`;

    return `${config.systemPromptPrefix}

${roleHeader}

[TONE]
${promptFields.tone}

[CONTEXT]
${promptFields.context}

[EXPECTED]
${promptFields.expected}

[OUTPUT FORMAT]
${promptFields.output}

[SAMPLES / EXAMPLES]
${promptFields.samples}`;
  },
}));
