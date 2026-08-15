import { LlmProvider } from '../types/llm-provider.enum';

export interface IChatResponseDto {
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

export interface IChatStreamChunkDto {
  sessionId: string;
  delta: string;
  done: boolean;
  error?: string;
}

export interface ILlmHealthResultDto {
  status: 'ok' | 'error';
  details?: string;
}
