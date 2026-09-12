import { ChatRequestDto } from '../model/dto/chat-request.dto';
import { ChatResponseDto, ChatStreamChunkDto, LlmHealthResultDto } from '../model/dto/chat-response.dto';
import { LlmProvider } from '../types/llm-provider.enum';
import { LlmModelInfo } from '../model/value-objects/llm-model.vo';

export interface ILlmChatServicePort {
  executeChat(request: ChatRequestDto): Promise<ChatResponseDto>;
  streamChat(
    request: ChatRequestDto,
    onChunk: (chunk: ChatStreamChunkDto) => void
  ): Promise<ChatResponseDto>;
  listAvailableModels(provider?: LlmProvider): Promise<LlmModelInfo[]>;
  healthCheck(provider: LlmProvider, baseUrl?: string): Promise<LlmHealthResultDto>;
  readFileContent(filePath: string): Promise<string>;
}
