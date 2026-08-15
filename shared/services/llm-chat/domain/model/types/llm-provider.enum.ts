export enum LlmProvider {
  OLLAMA = 'ollama',
  GEMINI = 'gemini',
  COPILOT = 'copilot',
}

export type LlmRole = 'system' | 'user' | 'assistant';

export interface ILlmModelInfo {
  id: string;
  name: string;
  provider: LlmProvider;
  contextWindow?: number;
  description?: string;
}
