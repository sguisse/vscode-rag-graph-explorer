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
const ORIGIN = 'CopilotDelegate';

export class CopilotDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.COPILOT;

  public async executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const formattedHistory = prompt.getFormattedHistory();
    const lastUserMsg = prompt.getLastUserMessage()?.content || '';
    const cliParams = process.env.JQA_LLM_CLI_PARAMS || `--model ${config.model}`;
    const sanitizedPrompt = lastUserMsg.replace(/"/g, '\\"');

    log(ORIGIN, 'Executing Copilot chat via CLI process', { sessionId, model: config.model });

    try {
      const { stdout, stderr } = await execAsync(`copilot ${cliParams} -p "${sanitizedPrompt}"`, {
        timeout: config.timeoutMs,
      });

      if (stderr && !stdout) {
        throw new Error(`Copilot CLI error: ${stderr}`);
      }

      const executionTimeMs = Date.now() - startTime;
      const promptTokens = TokenComputationAdapter.countPromptTokens(formattedHistory as any);
      const completionTokens = TokenComputationAdapter.countTokens(stdout);

      log(ORIGIN, 'Copilot execution succeeded', { sessionId, chars: stdout.length, promptTokens, completionTokens });

      return {
        sessionId,
        messageId: `copilot-${Date.now()}`,
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
      log(ORIGIN, 'Copilot execution failed', { sessionId, error: error?.message });
      return {
        sessionId,
        messageId: `copilot-err-${Date.now()}`,
        provider: this.provider,
        model: config.model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message || 'Copilot execution failed',
      };
    }
  }

  public async streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto> {
    log(ORIGIN, 'Streaming Copilot chat response', { sessionId });
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
    log(ORIGIN, 'Listing Copilot models');
    const models: ILlmModelInfo[] = [
      { id: 'gpt-4o', name: 'GitHub Copilot (GPT-4o)', provider: this.provider },
      { id: 'claude-3.5-sonnet', name: 'GitHub Copilot (Claude 3.5)', provider: this.provider },
    ];
    log(ORIGIN, 'Found Copilot models', {
      count: models.length,
      models: models.map((m) => ({ id: m.id, name: m.name })),
    });
    return models;
  }

  public async healthCheck(): Promise<ILlmHealthResultDto> {
    log(ORIGIN, 'Checking Copilot CLI availability');
    try {
      await execAsync('copilot --version');
      return { status: 'ok', details: 'Copilot CLI operational' };
    } catch {
      return { status: 'error', details: 'Copilot CLI tool not found in PATH' };
    }
  }
}
