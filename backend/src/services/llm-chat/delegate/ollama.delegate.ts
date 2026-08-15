import { ILlmProviderDelegate } from './llm-provider.delegate.interface';
import {
  LlmProvider,
  ILlmModelInfo,
  LlmConfigVO,
  ChatPromptVO,
  IChatResponseDto,
  IChatStreamChunkDto,
  ILlmHealthResultDto,
} from '../../../../../shared/services/llm-chat';
import { log } from '../../../utils/utils-log';
import { TokenComputationAdapter } from '../token-computation.adapter';

const ORIGIN = 'OllamaDelegate';

export class OllamaDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.OLLAMA;

  public async executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    log(ORIGIN, 'Executing synchronous chat request to Ollama HTTP daemon', { baseUrl, model: config.model });

    const messages = prompt.getFormattedHistory().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payload = {
      model: config.model,
      messages,
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
    };

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP error ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      const content = data.message?.content || '';
      const executionTimeMs = Date.now() - startTime;

      const promptTokens = data.prompt_eval_count ?? TokenComputationAdapter.countPromptTokens(messages as any);
      const completionTokens = data.eval_count ?? TokenComputationAdapter.countTokens(content);
      const totalTokens = promptTokens + completionTokens;

      log(ORIGIN, 'Ollama chat response received successfully', {
        sessionId,
        executionTimeMs,
        formattedTime: TokenComputationAdapter.formatExecutionTime(executionTimeMs),
        promptTokens,
        completionTokens,
      });

      return {
        sessionId,
        messageId: `ollama-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content,
        done: true,
        promptTokens,
        completionTokens,
        totalTokens,
        executionTimeMs,
      };
    } catch (error: any) {
      log(ORIGIN, 'Ollama execution failed', { sessionId, error: error?.message });
      return {
        sessionId,
        messageId: `ollama-err-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message || 'Failed to execute Ollama chat',
      };
    }
  }

  public async streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    log(ORIGIN, 'Initiating chat stream to Ollama HTTP daemon', { baseUrl, model: config.model });

    const messages = prompt.getFormattedHistory().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payload = {
      model: config.model,
      messages,
      stream: true,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
    };

    let fullContent = '';

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Ollama stream error ${response.status}: ${await response.text()}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const delta = parsed.message?.content || '';
            fullContent += delta;

            onChunk({
              sessionId,
              delta,
              done: parsed.done || false,
            });
          } catch {
            // ignore non-JSON stream chunks
          }
        }
      }

      const executionTimeMs = Date.now() - startTime;
      const promptTokens = TokenComputationAdapter.countPromptTokens(messages as any);
      const completionTokens = TokenComputationAdapter.countTokens(fullContent);

      log(ORIGIN, 'Ollama streaming finished', { sessionId, totalChars: fullContent.length, promptTokens, completionTokens });

      return {
        sessionId,
        messageId: `ollama-stream-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content: fullContent,
        done: true,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        executionTimeMs,
      };
    } catch (error: any) {
      log(ORIGIN, 'Ollama streaming error', { sessionId, error: error?.message });
      onChunk({
        sessionId,
        delta: '',
        done: true,
        error: error?.message || 'Ollama streaming failed',
      });

      return {
        sessionId,
        messageId: `ollama-stream-err-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content: fullContent,
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message,
      };
    }
  }

  public async listModels(config?: LlmConfigVO): Promise<ILlmModelInfo[]> {
    const baseUrl = config?.baseUrl || 'http://localhost:11434';
    log(ORIGIN, 'Fetching list of models from Ollama daemon', { baseUrl });
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: Array<{ name: string; details?: { family?: string } }> };
      const models: ILlmModelInfo[] = (data.models || []).map((m) => ({
        id: m.name,
        name: m.name,
        provider: this.provider,
        description: `Ollama model: ${m.details?.family || 'local'}`,
      }));

      log(ORIGIN, 'Found Ollama models via API', {
        count: models.length,
        models: models.map((m) => ({ id: m.id, name: m.name })),
      });
      return models;
    } catch (err: any) {
      log(ORIGIN, 'Failed to fetch Ollama models from API, returning fallbacks', { error: err?.message });
      const fallbackModels: ILlmModelInfo[] = [
        { id: 'deepseek-coder:6.7b', name: 'deepseek-coder:6.7b', provider: this.provider },
        { id: 'llama3:8b', name: 'llama3:8b', provider: this.provider },
      ];
      log(ORIGIN, 'Found fallback Ollama models', {
        count: fallbackModels.length,
        models: fallbackModels.map((m) => ({ id: m.id, name: m.name })),
      });
      return fallbackModels;
    }
  }

  public async healthCheck(baseUrl?: string): Promise<ILlmHealthResultDto> {
    const url = baseUrl || 'http://localhost:11434';
    log(ORIGIN, 'Checking health of Ollama daemon', { url });
    try {
      const res = await fetch(`${url}/api/tags`);
      return res.ok ? { status: 'ok' } : { status: 'error', details: `HTTP ${res.status}` };
    } catch (err: any) {
      return { status: 'error', details: err?.message || 'Ollama connection failed' };
    }
  }
}
