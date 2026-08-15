import { LlmProvider, LlmRole } from '../types/llm-provider.enum';

export interface IFileContextDto {
  path: string;
  content?: string;
}

export interface IChatMessageDto {
  id?: string;
  role: LlmRole;
  content: string;
  timestamp?: number;
  provider?: LlmProvider;
  model?: string;
  fileCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  executionTimeMs?: number;
}

export interface IChatRequestDto {
  sessionId?: string;
  provider: LlmProvider;
  model?: string;
  messages: IChatMessageDto[];
  systemPrompt?: string;
  fileContexts?: IFileContextDto[];
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  apiKey?: string;
  stream?: boolean;
}
