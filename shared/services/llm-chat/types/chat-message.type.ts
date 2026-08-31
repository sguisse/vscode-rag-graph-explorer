import { LlmProvider, LlmRole } from './llm-provider.enum';

export interface IChatMessage {
  id: string;
  role: LlmRole;
  content: string;
  timestamp: number;
  provider?: LlmProvider;
  model?: string;
  fileCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  executionTimeMs?: number;
  metadata?: Record<string, unknown>;
}
