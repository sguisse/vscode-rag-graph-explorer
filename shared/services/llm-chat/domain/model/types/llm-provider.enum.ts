export enum LlmProvider {
  OLLAMA = 'ollama',
  GEMINI = 'gemini',
  COPILOT = 'copilot',
}

export type LlmRole = 'system' | 'user' | 'assistant';
