import {
  LlmProvider,
  LlmModelInfo,
  LlmConfigVO,
  ChatPromptVO,
  ChatResponseDto,
  ChatStreamChunkDto,
  LlmHealthResultDto,
} from '../../../../../shared/services/llm-chat';

export interface LlmProviderDelegate {
  readonly provider: LlmProvider;

  executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<ChatResponseDto>;

  streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: ChatStreamChunkDto) => void
  ): Promise<ChatResponseDto>;

  listModels(config?: LlmConfigVO): Promise<LlmModelInfo[]>;

  healthCheck(baseUrl?: string): Promise<LlmHealthResultDto>;
}
