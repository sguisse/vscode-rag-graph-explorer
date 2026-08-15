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
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ORIGIN = 'GeminiDelegate';

export class GeminiDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.GEMINI;

  public async executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

    if (apiKey) {
      log(ORIGIN, 'Executing Gemini chat via REST API', { sessionId, model: config.model });
      return this.executeViaRestApi(sessionId, prompt, config, apiKey, startTime);
    }

    log(ORIGIN, 'Executing Gemini chat via CLI fallback', { sessionId, model: config.model });
    return this.executeViaCli(sessionId, prompt, config, startTime);
  }

  private async executeViaRestApi(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    apiKey: string,
    startTime: number
  ): Promise<IChatResponseDto> {
    const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com';
    const model = config.model || 'gemini-1.5-pro';
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const formattedHistory = prompt.getFormattedHistory();
    const contents = formattedHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as any;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const executionTimeMs = Date.now() - startTime;

      const promptTokens = data.usageMetadata?.promptTokenCount ?? TokenComputationAdapter.countPromptTokens(formattedHistory as any);
      const completionTokens = data.usageMetadata?.candidatesTokenCount ?? TokenComputationAdapter.countTokens(content);

      log(ORIGIN, 'Gemini REST API execution succeeded', { sessionId, chars: content.length, promptTokens, completionTokens });

      return {
        sessionId,
        messageId: `gemini-${Date.now()}`,
        provider: this.provider,
        model,
        content,
        done: true,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        executionTimeMs,
      };
    } catch (error: any) {
      log(ORIGIN, 'Gemini REST API execution failed', { sessionId, error: error?.message });
      return {
        sessionId,
        messageId: `gemini-err-${Date.now()}`,
        provider: this.provider,
        model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message || 'Gemini REST API execution failed',
      };
    }
  }

  private async executeViaCli(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    startTime: number
  ): Promise<IChatResponseDto> {
    const formattedHistory = prompt.getFormattedHistory();
    const lastUserMsg = prompt.getLastUserMessage()?.content || '';
    const cliCmd = process.env.JQA_LLM_CLI_CMD || 'gemini';
    const sanitizedPrompt = lastUserMsg.replace(/"/g, '\\"');

    try {
      const { stdout, stderr } = await execAsync(`${cliCmd} -p "${sanitizedPrompt}"`, {
        timeout: config.timeoutMs,
      });

      if (stderr && !stdout) {
        throw new Error(`Gemini CLI error: ${stderr}`);
      }

      const executionTimeMs = Date.now() - startTime;
      const promptTokens = TokenComputationAdapter.countPromptTokens(formattedHistory as any);
      const completionTokens = TokenComputationAdapter.countTokens(stdout);

      log(ORIGIN, 'Gemini CLI execution succeeded', { sessionId, chars: stdout.length, promptTokens, completionTokens });

      return {
        sessionId,
        messageId: `gemini-cli-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content: stdout.trim(),
        done: true,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        executionTimeMs,
      };
    } catch (error: any) {
      log(ORIGIN, 'Gemini CLI execution failed', { sessionId, error: error?.message });
      return {
        sessionId,
        messageId: `gemini-cli-err-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message || 'Gemini CLI execution failed',
      };
    }
  }

  public async streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto> {
    log(ORIGIN, 'Streaming Gemini chat response', { sessionId });
    const result = await this.executeChat(sessionId, prompt, config);
    onChunk({
      sessionId,
      delta: result.content,
      done: true,
      error: result.error,
    });
    return result;
  }

  public async listModels(): Promise<ILlmModelInfo[]> {
    log(ORIGIN, 'Listing Gemini models');
    const models: ILlmModelInfo[] = [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: this.provider },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: this.provider },
    ];
    log(ORIGIN, 'Found Gemini models', {
      count: models.length,
      models: models.map((m) => ({ id: m.id, name: m.name })),
    });
    return models;
  }

  public async healthCheck(): Promise<ILlmHealthResultDto> {
    log(ORIGIN, 'Checking Gemini provider health');
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) return { status: 'ok', details: 'API Key configured' };
    try {
      await execAsync('gemini --version');
      return { status: 'ok', details: 'Gemini CLI installed' };
    } catch {
      return { status: 'error', details: 'Neither GEMINI_API_KEY nor gemini CLI available' };
    }
  }
}
