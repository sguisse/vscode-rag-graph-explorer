// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { ILLMChatServicePort } from '@/shared/services/llm-chat/domain/port-out/llm-chat-service.port';

class LLMChatApiService extends AbstractApiService implements ILLMChatServicePort {
    constructor() {
        super();
    }


    chat(): Promise<void> {
        throw new Error('Method not implemented.');
    }


}

export const llmChatApiService = new LLMChatApiService();
