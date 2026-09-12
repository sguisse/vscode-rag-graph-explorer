import {
  LlmProvider,
  LlmModelInfo,
  LlmConfigVO,
  ChatPromptVO,
  IChatResponseDto,
  IChatStreamChunkDto,
  ILlmHealthResultDto,
} from '../../../../../shared/services/llm-chat';

export interface ILlmProviderDelegate {
  readonly provider: LlmProvider;

  executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<IChatResponseDto>;

  streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto>;

  listModels(config?: LlmConfigVO): Promise<LlmModelInfo[]>;

  healthCheck(baseUrl?: string): Promise<ILlmHealthResultDto>;
}
