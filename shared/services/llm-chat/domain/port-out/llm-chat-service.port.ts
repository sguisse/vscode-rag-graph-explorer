import { IChatRequestDto } from '../model/dto/chat-request.dto';
import { IChatResponseDto, IChatStreamChunkDto, ILlmHealthResultDto } from '../model/dto/chat-response.dto';
import { ILlmModelInfo, LlmProvider } from '../model/types/llm-provider.enum';

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
