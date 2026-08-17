// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IChatRequestDto } from '@/shared/services/llm-chat/domain/model/dto/chat-request.dto';
import { IChatResponseDto, IChatStreamChunkDto, ILlmHealthResultDto } from '@/shared/services/llm-chat/domain/model/dto/chat-response.dto';
import { LlmProvider } from '@/shared/services/llm-chat/domain/model/types/llm-provider.enum';
import { ILlmModelInfo } from '@/shared/services/llm-chat/domain/model/value-objects/llm-model.vo';
import { ILlmChatServicePort } from '@/shared/services/llm-chat/domain/port-out/llm-chat-service.port';

class LlmChatApiService extends AbstractApiService implements ILlmChatServicePort {
    constructor() {
        super();
    }

    public async executeChat(request: IChatRequestDto): Promise<IChatResponseDto> {
        return await this.rpc.call(RpcMethodEnum.LLMCHAT_EXECUTE_CHAT, request);
    }

    public async streamChat(request: IChatRequestDto, onChunk: (chunk: IChatStreamChunkDto) => void): Promise<IChatResponseDto> {
        return await this.rpc.call(RpcMethodEnum.LLMCHAT_STREAM_CHAT, request, onChunk);
    }

    public async listAvailableModels(provider?: LlmProvider): Promise<ILlmModelInfo[]> {
        return await this.rpc.call(RpcMethodEnum.LLMCHAT_LIST_AVAILABLE_MODELS, provider);
    }

    public async healthCheck(provider: LlmProvider, baseUrl?: string): Promise<ILlmHealthResultDto> {
        return await this.rpc.call(RpcMethodEnum.LLMCHAT_HEALTH_CHECK, provider, baseUrl);
    }

    public async readFileContent(filePath: string): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.LLMCHAT_READ_FILE_CONTENT, filePath);
    }
}

export const llmChatApiService = new LlmChatApiService();
