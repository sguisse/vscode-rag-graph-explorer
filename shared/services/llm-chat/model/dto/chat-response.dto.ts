import { LlmProvider } from '../../types/llm-provider.enum';

export interface ChatResponseDto {
  sessionId: string;
  messageId: string;
  provider: LlmProvider;
  model: string;
  content: string;
  done: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  executionTimeMs?: number;
  error?: string;
}

export interface ChatStreamChunkDto {
  sessionId: string;
  delta: string;
  done: boolean;
  error?: string;
}

export interface LlmHealthResultDto {
  status: 'ok' | 'error';
  details?: string;
}
