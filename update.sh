#!/usr/bin/env bash
set -e

# Create required directories
mkdir -p shared/services/llm-chat/domain/model/value-objects

# 1. Create value-object for LLM Model with full Copilot metadata interfaces
cat << 'EOF' > shared/services/llm-chat/domain/model/value-objects/llm-model.vo.ts
import { LlmProvider } from '../types/llm-provider.enum';

export interface ILlmModelVisionLimits {
  max_prompt_image_size?: number;
  max_prompt_images?: number;
  supported_media_types?: string[];
}

export interface ILlmModelLimits {
  max_context_window_tokens?: number;
  max_non_streaming_output_tokens?: number;
  max_output_tokens?: number;
  max_prompt_tokens?: number;
  vision?: ILlmModelVisionLimits;
}

export interface ILlmModelSupports {
  adaptive_thinking?: string;
  max_thinking_budget?: number;
  min_thinking_budget?: number;
  parallel_tool_calls?: boolean;
  reasoning_effort?: string[];
  streaming?: boolean;
  structured_outputs?: boolean;
  tool_calls?: boolean;
  vision?: boolean;
  reasoningEffort?: boolean;
}

export interface ILlmModelCapabilities {
  family?: string;
  limits?: ILlmModelLimits;
  object?: string;
  supports?: ILlmModelSupports;
  tokenizer?: string;
  type?: string;
}

export interface ILlmModelPolicy {
  state?: string;
  terms?: string;
}

export interface ILlmLongContextTokenPriceConfig {
  inputPrice?: number;
  outputPrice?: number;
  cachePrice?: number;
  cacheReadPrice?: number;
  cacheWritePrice?: number;
  contextMax?: number;
  maxPromptTokens?: number;
}

export interface ILlmTokenPrices {
  inputPrice?: number;
  outputPrice?: number;
  cachePrice?: number;
  cacheReadPrice?: number;
  cacheWritePrice?: number;
  batchSize?: number;
  contextMax?: number;
  maxPromptTokens?: number;
  longContext?: ILlmLongContextTokenPriceConfig;
}

export interface ILlmModelPromo {
  id?: string;
  discountPercent?: number;
  endsAt?: string;
  message?: string;
}

export interface ILlmModelBilling {
  discountPercent?: number;
  tokenPrices?: ILlmTokenPrices;
  promo?: ILlmModelPromo;
}

export interface ILlmModelInfo {
  id: string;
  name: string;
  provider: LlmProvider;
  contextWindow?: number;
  description?: string;
  capabilities?: ILlmModelCapabilities;
  policy?: ILlmModelPolicy;
  billing?: ILlmModelBilling;
  supportedReasoningEfforts?: string[];
  modelPickerCategory?: string;
  modelPickerPriceCategory?: string;
}
EOF

# 2. Update llm-provider.enum.ts to remove externalized ILlmModelInfo
cat << 'EOF' > shared/services/llm-chat/domain/model/types/llm-provider.enum.ts
export enum LlmProvider {
  OLLAMA = 'ollama',
  GEMINI = 'gemini',
  COPILOT = 'copilot',
}

export type LlmRole = 'system' | 'user' | 'assistant';
EOF

# 3. Update shared/services/llm-chat/index.ts to re-export llm-model.vo
cat << 'EOF' > shared/services/llm-chat/index.ts
export * from './domain/model/types/llm-provider.enum';
export * from './domain/model/types/chat-message.type';
export * from './domain/model/value-objects/llm-config.vo';
export * from './domain/model/value-objects/llm-model.vo';
export * from './domain/model/value-objects/chat-prompt.vo';
export * from './domain/model/entities/chat-session.entity';
export * from './domain/model/dto/chat-request.dto';
export * from './domain/model/dto/chat-response.dto';
export * from './domain/mapper/chat-message.mapper';
export * from './domain/port-out/llm-chat-service.port';
EOF

# 4. Update llm-chat-service.port.ts imports
cat << 'EOF' > shared/services/llm-chat/domain/port-out/llm-chat-service.port.ts
import { IChatRequestDto } from '../model/dto/chat-request.dto';
import { IChatResponseDto, IChatStreamChunkDto, ILlmHealthResultDto } from '../model/dto/chat-response.dto';
import { LlmProvider } from '../model/types/llm-provider.enum';
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
EOF

# 5. Update copilot.delegate.ts to map extended Copilot fields
cat << 'EOF' > backend/src/services/llm-chat/delegate/copilot.delegate.ts
import { CopilotClient, approveAll } from '@github/copilot-sdk';
import * as path from 'path';
import * as fs from 'fs';
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
import { getCurrentExtensionContext } from '../../../utils/utils-vscode';
import { logInfo } from '../../../utils/utils-log';

export class CopilotDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.COPILOT;
  private static clientInstance: CopilotClient | null = null;
  private static isStarted = false;
  private static startPromise: Promise<void> | null = null;
  private static cliBinaryPath: string | null = null;

  public constructor() {
    this.resolveNativeCliPath();
  }

  /**
   * Locates the native Copilot CLI executable binary compatible with the Host VS Code Extension
   */
  private resolveNativeCliPath(): string | undefined {
    if (!CopilotDelegate.cliBinaryPath) {
      const extentionContext = getCurrentExtensionContext();
      const isArm64 = process.arch === 'arm64';
      const platform = process.platform;

      // Guaranteed absolute path from the extension installation directory
      const cliBinaryPath = extentionContext.asAbsolutePath(
        path.join('node_modules', `@github/copilot-${platform}-${isArm64 ? 'arm64' : 'x64'}`, 'copilot')
      );

      CopilotDelegate.cliBinaryPath = cliBinaryPath;
      process.env.COPILOT_CLI_PATH = cliBinaryPath;
    }

    return CopilotDelegate.cliBinaryPath;
  }

  private get client(): CopilotClient {
    if (!CopilotDelegate.clientInstance) {
      const cliPath = this.resolveNativeCliPath();
      CopilotDelegate.clientInstance = new CopilotClient(cliPath ? { cliPath } : undefined);
    }
    return CopilotDelegate.clientInstance;
  }

  private async ensureStarted(): Promise<void> {
    if (CopilotDelegate.isStarted) {
      return;
    }

    if (!CopilotDelegate.startPromise) {
      CopilotDelegate.startPromise = (async () => {
        try {
          // Guard Timeout de 10s pour éviter un blocage indéfini dans VS Code
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Délai dépassé lors du démarrage du CLI Copilot (10s)')),
              10000
            )
          );

          await Promise.race([this.client.start(), timeout]);
          CopilotDelegate.isStarted = true;
        } catch (error) {
          CopilotDelegate.startPromise = null;
          throw error;
        }
      })();
    }

    return CopilotDelegate.startPromise;
  }

  async listModels(config?: LlmConfigVO): Promise<ILlmModelInfo[]> {
    await this.ensureStarted();
    const models = await this.client.listModels();
    logInfo(`CopilotDelegate.listModels totalFound: ${models.length}`, models);
    return models.map((m: any) => ({
      id: m.id || m.name,
      name: m.name || m.id,
      provider: this.provider,
      contextWindow: m.capabilities?.limits?.max_context_window_tokens ?? m.contextWindow ?? 128000,
      description: m.description || 'Model administered via GitHub Copilot SDK',
      capabilities: m.capabilities,
      policy: m.policy,
      billing: m.billing,
      supportedReasoningEfforts: m.supportedReasoningEfforts,
      modelPickerCategory: m.modelPickerCategory,
      modelPickerPriceCategory: m.modelPickerPriceCategory,
    }));
  }

  async executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const model = config?.model || 'mai-code-1-flash-picker';
    const lastUserMsg = prompt.getLastUserMessage()?.content || '';

    try {
      await this.ensureStarted();
      const session = await this.client.createSession({
        sessionId,
        model,
        onPermissionRequest: approveAll,
      });

      let content = '';

      const done = new Promise<void>((resolve, reject) => {
        session.on('assistant.message', (event: any) => {
          if (event?.data?.content) {
            content = event.data.content;
          }
        });

        session.on('session.idle', () => {
          resolve();
        });

        session.on('error' as any, (err: any) => {
          reject(err);
        });
      });

      await session.send({ prompt: lastUserMsg });
      await done;

      return {
        sessionId,
        messageId: `msg-${Date.now()}`,
        provider: this.provider,
        model,
        content,
        done: true,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        sessionId,
        messageId: `msg-err-${Date.now()}`,
        provider: this.provider,
        model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message || 'Error while receiving Copilot response',
      };
    }
  }

  async streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const model = config?.model || 'mai-code-1-flash-picker';
    const lastUserMsg = prompt.getLastUserMessage()?.content || '';

    try {
      await this.ensureStarted();
      const session = await this.client.createSession({
        sessionId,
        model,
        onPermissionRequest: approveAll,
      });

      let fullContent = '';

      const done = new Promise<void>((resolve, reject) => {
        session.on('assistant.message_delta', (event: any) => {
          const delta = event?.data?.deltaContent || '';
          fullContent += delta;
          onChunk({ sessionId, delta, done: false });
        });

        session.on('session.idle', () => {
          resolve();
        });

        session.on('error' as any, (err: any) => {
          reject(err);
        });
      });

      await session.send({ prompt: lastUserMsg });
      await done;

      onChunk({ sessionId, delta: '', done: true });

      return {
        sessionId,
        messageId: `msg-${Date.now()}`,
        provider: this.provider,
        model,
        content: fullContent,
        done: true,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      const errorDetails = error?.message || 'Error while streaming Copilot';
      onChunk({ sessionId, delta: '', done: true, error: errorDetails });

      return {
        sessionId,
        messageId: `msg-err-${Date.now()}`,
        provider: this.provider,
        model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: errorDetails,
      };
    }
  }

  async healthCheck(baseUrl?: string): Promise<ILlmHealthResultDto> {
    try {
      await this.ensureStarted();
      const models = await this.listModels();
      return {
        status: 'ok',
        details: `Copilot service operational (${models.length} models detected)`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        details: `Copilot HealthCheck error: ${error?.message}`,
      };
    }
  }
}
EOF

echo "✅ feat: Externalized ILlmModelInfo into llm-model.vo.ts and added full Copilot metadata interfaces!"
npm run compile || true
