import { CopilotClient, approveAll } from '@github/copilot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
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
import { getCurrentExtensionContext, getWorkspaceRoot } from '../../../utils/utils-vscode';
import { vsCodeSettingsManager } from '../../../managers/VsCodeSettings.manager';
import { log, logError, logInfo } from '../../../utils/utils-log';

export class CopilotDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.COPILOT;
  private static clientInstance: CopilotClient | null = null;
  private static isStarted = false;
  private static startPromise: Promise<void> | null = null;
  private static cliBinaryPath: string | null = null;

  public constructor() {
    this.resolveNativeCliPath();
  }

  private resolveNativeCliPath(): string | undefined {
    log("CopilotDelegate", `resolveNativeCliPath start ...`);
    if (!CopilotDelegate.cliBinaryPath) {
      const extentionContext = getCurrentExtensionContext();
      const isWin = process.platform === 'win32';
      const binName = isWin ? 'copilot.exe' : 'copilot-runtime';
      const isArm64 = process.arch === 'arm64';
      const arch = isArm64 ? 'arm64' : 'x64';
      const platform = process.platform;
      const platformTarget = `${platform}-${arch}`;

      // 1. First search in the local workspace tools directory (.token-razor)
      const workspaceRoot = getWorkspaceRoot();
      const backendWorkspacePath = vsCodeSettingsManager.getSettings().backendWorkspacePath || '.token-razor';
      const localToolPath = path.join(
        workspaceRoot,
        backendWorkspacePath,
        'tools',
        'node',
        'node_modules', '@github', `copilot-sdk-${platformTarget}`, 'prebuilds', platformTarget, binName
      );

      let foundPath: string | undefined;

      if (fs.existsSync(localToolPath)) {
        foundPath = localToolPath;
      } else {
        // 2. Second try : search in the extension's node_modules directory (works only in dev mode !!!)
        const nodeModulesPath = extentionContext ? extentionContext.asAbsolutePath(
          path.join('node_modules', '@github', `copilot-sdk-${platformTarget}`, 'prebuilds', platformTarget, binName)
        ) : undefined;

        if (nodeModulesPath && fs.existsSync(nodeModulesPath)) {
          foundPath = nodeModulesPath;
      }
      }

      if (foundPath) {
        CopilotDelegate.cliBinaryPath = foundPath;
        process.env.COPILOT_CLI_PATH = foundPath;
        logInfo(`[CopilotDelegate] Resolved Copilot SDK binary path: ${foundPath}`);



      } else {
        logError(`[CopilotDelegate] Copilot SDK binary not found in local workspace tools (.token-razor) or extension (local dev) node_modules.`);
      }
    }

      const sdkPath = CopilotDelegate.cliBinaryPath;
      if (sdkPath) {
        try {
          const versionOutput = cp.execFileSync(sdkPath, ['-version'], { encoding: 'utf-8' }).trim();
          logInfo(`[CopilotDelegate] Copilot SDK version output: ${versionOutput}`);
        } catch (err: any) {
          logError(`[CopilotDelegate] Failed to execute Copilot SDK version check: ${err?.message || err}`);
        }
      } else {
        logError(`[CopilotDelegate] Copilot SDK binary not found at target path: ${sdkPath}`);
      }

      logInfo(`[CopilotDelegate] Copilot SDK binary path: ${CopilotDelegate.cliBinaryPath || 'not found'}`);
      return CopilotDelegate.cliBinaryPath || undefined;
    }

private get client(): CopilotClient {
    //if (!CopilotDelegate.clientInstance) {
      const cliPath = this.resolveNativeCliPath();

      if (cliPath) {
        process.env.COPILOT_CLI_PATH = cliPath;
      }

      // 1. Récupération d'un token explicite si défini dans l'environnement
      const token = process.env.COPILOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.GITHUB_COPILOT_TOKEN;

      // 2. Configuration des options d'authentification
      const options: Record<string, any> = token
        ? { gitHubToken: token }
        : { useLoggedInUser: true }; // Force le SDK à utiliser ta session CLI (copilot auth)

      if (cliPath) {
        options.cliPath = cliPath;
      }

      // Initialisation avec les bonnes options
      CopilotDelegate.clientInstance = new CopilotClient(options as any);
    //}
    return CopilotDelegate.clientInstance;
  }

  private async ensureStarted(): Promise<void> {
    if (CopilotDelegate.isStarted) {
      return;
    }

    if (!CopilotDelegate.startPromise) {
      CopilotDelegate.startPromise = (async () => {
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout starting Copilot SDK (10s)')),
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
    const model = config?.model || 'mai-code-1.1-flash';
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
