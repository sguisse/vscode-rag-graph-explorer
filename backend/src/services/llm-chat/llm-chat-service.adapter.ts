import * as fs from 'fs';
import * as path from 'path';
import {
  ILlmChatServicePort,
  IChatRequestDto,
  IChatResponseDto,
  IChatStreamChunkDto,
  ILlmModelInfo,
  ILlmHealthResultDto,
  LlmProvider,
  LlmConfigVO,
  ChatPromptVO,
  ChatMessageMapper,
  ChatSessionEntity,
} from '../../../../shared/services/llm-chat';
import { LlmDelegateFactory } from './factory/llm-delegate.factory';
import { log } from '../../utils/utils-log';

const ORIGIN = 'LlmChatServiceAdapter';

export class LlmChatServiceAdapter implements ILlmChatServicePort {
  private sessions: Map<string, ChatSessionEntity> = new Map();

  public async executeChat(request: IChatRequestDto): Promise<IChatResponseDto> {
    const sessionId = request.sessionId || `session-${Date.now()}`;
    log(ORIGIN, 'Incoming Chat Execution Request', { sessionId, provider: request.provider, model: request.model, contextFilesCount: request.fileContexts?.length || 0 });

    const config = new LlmConfigVO({
      provider: request.provider,
      model: request.model || '',
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      baseUrl: request.baseUrl,
      apiKey: request.apiKey,
    });

    const messages = ChatMessageMapper.toDomainList(request.messages);
    const prompt = new ChatPromptVO(messages, request.systemPrompt);

    let session = this.sessions.get(sessionId);
    if (!session) {
      log(ORIGIN, 'Initializing new chat session entity', { sessionId });
      session = new ChatSessionEntity(sessionId, config, messages);
      this.sessions.set(sessionId, session);
    } else {
      log(ORIGIN, 'Updating existing session config', { sessionId });
      session.updateConfig(config);
    }

    const delegate = LlmDelegateFactory.getDelegate(request.provider);
    log(ORIGIN, 'Delegating chat execution to provider delegate', { provider: request.provider });

    const response = await delegate.executeChat(sessionId, prompt, config);

    if (!response.error && response.content) {
      log(ORIGIN, 'Successfully generated chat response. Persisting assistant message.', {
        sessionId,
        messageId: response.messageId,
        executionTimeMs: response.executionTimeMs,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
      });
      session.addMessage({
        id: response.messageId,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        provider: response.provider,
        model: response.model,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        executionTimeMs: response.executionTimeMs,
      });
    } else {
      log(ORIGIN, 'Chat execution completed with error or empty content', { sessionId, error: response.error });
    }

    return response;
  }

  public async streamChat(
    request: IChatRequestDto,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto> {
    const sessionId = request.sessionId || `session-${Date.now()}`;
    log(ORIGIN, 'Incoming Chat Streaming Request', { sessionId, provider: request.provider, model: request.model });

    const config = new LlmConfigVO({
      provider: request.provider,
      model: request.model || '',
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      baseUrl: request.baseUrl,
      apiKey: request.apiKey,
    });

    const messages = ChatMessageMapper.toDomainList(request.messages);
    const prompt = new ChatPromptVO(messages, request.systemPrompt);

    const delegate = LlmDelegateFactory.getDelegate(request.provider);
    return delegate.streamChat(sessionId, prompt, config, (chunk) => {
      log(ORIGIN, 'Streaming chunk received', { sessionId, done: chunk.done, error: chunk.error });
      onChunk(chunk);
    });
  }

  public async listAvailableModels(provider?: LlmProvider): Promise<ILlmModelInfo[]> {
    log(ORIGIN, 'Listing available LLM models', { provider: provider || 'all' });
    if (provider) {
      const delegate = LlmDelegateFactory.getDelegate(provider);
      const models = await delegate.listModels();
      log(ORIGIN, 'Found models for single provider', {
        provider,
        totalFound: models.length,
        models: models.map((m) => ({ id: m.id, name: m.name, provider: m.provider })),
      });
      return models;
    }

    const providers = [LlmProvider.OLLAMA, LlmProvider.GEMINI, LlmProvider.COPILOT];
    const results = await Promise.all(
      providers.map(async (p) => {
        try {
          const delegate = LlmDelegateFactory.getDelegate(p);
          return await delegate.listModels();
        } catch (err: any) {
          log(ORIGIN, 'Failed to list models for provider', { provider: p, error: err?.message });
          return [];
        }
      })
    );

    const allModels = results.flat();
    log(ORIGIN, 'Found models across all providers', {
      totalFound: allModels.length,
      models: allModels.map((m) => ({ id: m.id, name: m.name, provider: m.provider })),
    });

    return allModels;
  }

  public async healthCheck(
    provider: LlmProvider,
    baseUrl?: string
  ): Promise<ILlmHealthResultDto> {
    log(ORIGIN, 'Performing provider health check', { provider, baseUrl });
    const delegate = LlmDelegateFactory.getDelegate(provider);
    return delegate.healthCheck(baseUrl);
  }

  public async readFileContent(filePath: string): Promise<string> {
    log(ORIGIN, 'Reading file content', { filePath });
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

      if (fs.existsSync(resolvedPath)) {
        const content = await fs.promises.readFile(resolvedPath, 'utf-8');
        log(ORIGIN, 'File read successfully', { filePath, chars: content.length });
        return content;
      }
      log(ORIGIN, 'File not found on disk', { filePath, resolvedPath });
      return `// File not found: ${filePath}`;
    } catch (err: any) {
      log(ORIGIN, 'Error reading file content', { filePath, error: err?.message });
      return `// Error reading file ${filePath}: ${err?.message}`;
    }
  }
}
