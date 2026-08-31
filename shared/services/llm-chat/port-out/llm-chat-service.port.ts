import { IChatRequestDto } from '../model/dto/chat-request.dto';
import { IChatResponseDto, IChatStreamChunkDto, ILlmHealthResultDto } from '../model/dto/chat-response.dto';
import { LlmProvider } from '../types/llm-provider.enum';
import { ILlmModelInfo } from '../model/value-objects/llm-model.vo';

export interface ILlmChatServicePort {
  executeChat(request: IChatRequestDto): Promise<IChatResponseDto>;
  streamChat(
    request: IChatRequestDto,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto>;
  listAvailableModels(provider?: LlmProvider): Promise<ILlmModelInfo[]>;
  healthCheck(provider: LlmProvider, baseUrl?: string): Promise<ILlmHealthResultDto>;
  readFileContent(filePath: string): Promise<string>;
}
