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

import customModelsData from './copilot-models-custom.json';

type ForceResolveMode = 'COPILOT_CLI' | 'DEVELOPMENT_NODE_MODULE' | 'PLUGIN_INSTALL_LOCATION' | null;

// Configuration constant to force a specific path strategy or standard workflow (null)
const FORCE_RESOLVE_NATIVE_CLI: ForceResolveMode = null;

export class CopilotDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.COPILOT;
  private static clientInstance: CopilotClient | null = null;
  private static isStarted = false;
  private static startPromise: Promise<void> | null = null;
  private static cliBinaryPath: string | null = null;

  public constructor() {
    //this.resolveNativeCliPath();
  }

  /**
   * Main orchestrator for CLI binary path resolution.
   */
  private resolveNativeCliPath(): string | undefined {
    log('CopilotDelegate', `resolveNativeCliPath start ...`);

    if (CopilotDelegate.cliBinaryPath) {
      log('CopilotDelegate', `resolveNativeCliPath cached path found: ${CopilotDelegate.cliBinaryPath}`);
      return CopilotDelegate.cliBinaryPath;
    }

    log('CopilotDelegate', `resolveNativeCliPath starting (Force Mode: ${FORCE_RESOLVE_NATIVE_CLI ?? 'None'})...`);

    const foundPath = FORCE_RESOLVE_NATIVE_CLI
      ? this.resolvePathByStrategy(FORCE_RESOLVE_NATIVE_CLI)
      : this.resolveWithStandardWorkflow();

    if (foundPath) {
      CopilotDelegate.cliBinaryPath = foundPath;
      process.env.COPILOT_CLI_PATH = foundPath;
      logInfo(`[CopilotDelegate] Resolved Copilot SDK binary path: ${foundPath}`);
      this.verifyCliBinary(foundPath);
    } else {
      logError(`[CopilotDelegate] Copilot SDK binary not found under current resolution settings.`);
    }

    return CopilotDelegate.cliBinaryPath || undefined;
  }

  /**
   * Standard resolution workflow priority:
   * 1. System CLI (installed globally on host machine)
   * 2. Local dev node_modules (/node_modules/@github)
   * 3. Local workspace tools (.token-razor/...)
   */
  private resolveWithStandardWorkflow(): string | undefined {
    log('CopilotDelegate', `resolveWithStandardWorkflow ...`);
    return (
      this.resolveSystemCliPath() ||
      this.resolveDevNodeModulesPath() ||
      this.resolvePluginInstallPath()
    );
  }

  /**
   * Direct strategy dispatcher for explicit FORCE_RESOLVE_NATIVE_CLI override execution.
   */
  private resolvePathByStrategy(mode: ForceResolveMode): string | undefined {
    log('CopilotDelegate', `resolvePathByStrategy with mode: ${mode} ...`);

    switch (mode) {
      case 'COPILOT_CLI':
        return this.resolveSystemCliPath();
      case 'DEVELOPMENT_NODE_MODULE':
        return this.resolveDevNodeModulesPath();
      case 'PLUGIN_INSTALL_LOCATION':
        return this.resolvePluginInstallPath();
      default:
        return undefined;
    }
  }

  /**
   * Strategy 1: Search for Copilot CLI installed on local machine (PATH environment variable)
   */
  private resolveSystemCliPath(): string | undefined {
    const isWin = process.platform === 'win32';
    const checkCommand = isWin ? 'where copilot' : 'which copilot';

    try {
      const systemPath = cp.execSync(checkCommand, { encoding: 'utf-8' }).trim().split('\n')[0];
      if (systemPath && fs.existsSync(systemPath)) {
        logInfo(`[CopilotDelegate] System CLI found at: ${systemPath}`);
        return systemPath;
      }
    } catch {
      // CLI not found in system PATH
    }
    return undefined;
  }

  /**
   * Strategy 2: Search in extension node_modules directory (/node_modules/@github)
   */
  private resolveDevNodeModulesPath(): string | undefined {
    const extensionContext = getCurrentExtensionContext();
    if (!extensionContext) return undefined;

    const platformTarget = this.getPlatformTarget();
    const binNames = this.getPossibleBinNames();

    for (const binName of binNames) {
      const devPath = extensionContext.asAbsolutePath(
        path.join('node_modules', '@github', `copilot-sdk-${platformTarget}`, 'prebuilds', platformTarget, binName)
      );
      if (fs.existsSync(devPath)) {
        return devPath;
      }
    }

    return undefined;
  }

  /**
   * Strategy 3: Search in local workspace tools directory (.token-razor/...)
   */
  private resolvePluginInstallPath(): string | undefined {
    const workspaceRoot = getWorkspaceRoot();
    const backendWorkspacePath = vsCodeSettingsManager.getSettings().backendWorkspacePath || '.token-razor';
    const platformTarget = this.getPlatformTarget();
    const binNames = this.getPossibleBinNames();

    for (const binName of binNames) {
      const pluginPath = path.join(
        workspaceRoot,
        backendWorkspacePath,
        'tools',
        'node',
        'node_modules',
        '@github',
        `copilot-sdk-${platformTarget}`,
        'prebuilds',
        platformTarget,
        binName
      );

      if (fs.existsSync(pluginPath)) {
        return pluginPath;
      }
    }

    return undefined;
  }

  /**
   * Returns candidates for binary executable name depending on target OS.
   */
  private getPossibleBinNames(): string[] {
    return process.platform === 'win32'
      ? ['copilot.exe', 'copilot']
      : ['copilot-runtime', 'copilot'];
  }

  /**
   * Platform target specifier (e.g., darwin-arm64, linux-x64, win32-x64).
   */
  private getPlatformTarget(): string {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    return `${process.platform}-${arch}`;
  }

  /**
   * Helper to verify binary functionality.
   */
  private verifyCliBinary(binPath: string): void {
    try {
      const versionOutput = cp.execFileSync(binPath, ['-version'], { encoding: 'utf-8' }).trim();
      logInfo(`[CopilotDelegate] Copilot SDK version output: ${versionOutput}`);
    } catch (err: any) {
      logError(`[CopilotDelegate] Failed to execute Copilot SDK version check: ${err?.message || err}`);
    }
  }

  /**
   * Safely loads custom model overrides from copilot-models-custom.json if present.
   * If the file does not exist or fails to parse, custom models are skipped.
   */
  private loadCustomModels(): Partial<ILlmModelInfo>[] {
    try {
        logInfo(`[CopilotDelegate] '${customModelsData.length}' Custom models JSON loaded.`);
        return customModelsData as Partial<ILlmModelInfo>[];
    } catch (error: any) {
        logInfo(`[CopilotDelegate] Custom models JSON not loaded or unparseable: ${error?.message || error}`);
    }
    return [];
    }

  private get client(): CopilotClient {
    if (!CopilotDelegate.clientInstance) {
      const cliPath = this.resolveNativeCliPath();

      if (cliPath) {
        process.env.COPILOT_CLI_PATH = cliPath;
      }

      const token = process.env.COPILOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.GITHUB_COPILOT_TOKEN;

      const options: Record<string, any> = token
        ? { gitHubToken: token }
        : { useLoggedInUser: true };

      if (cliPath) {
        options.cliPath = cliPath;
      }

      CopilotDelegate.clientInstance = new CopilotClient(options as any);
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
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout starting Copilot SDK (10s)')), 10000)
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

  /**
   * Lists available LLM models from the SDK and merges optional custom models from JSON if available.
   */
  async listModels(config?: LlmConfigVO): Promise<ILlmModelInfo[]> {
    let fetchedModels: ILlmModelInfo[] = [];

    try {
      await this.ensureStarted();
      const rawModels: any[] = await this.client.listModels();
      logInfo(`CopilotDelegate.listModels totalFound from SDK: ${rawModels.length}`, rawModels);

      fetchedModels = rawModels.map((m: any) => ({
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
    } catch (error: any) {
      logError(`[CopilotDelegate] Error fetching models from Copilot SDK: ${error?.message || error}`);
    }

    // Dynamic resolution of custom models (skipped gracefully if file does not exist)
    const customModels = this.loadCustomModels();

    if (customModels.length > 0) {
      const existingModelIds = new Set(fetchedModels.map((m) => m.id.toLowerCase()));

      for (const fallback of customModels) {
        if (fallback.id && !existingModelIds.has(fallback.id.toLowerCase())) {
          fetchedModels.push({
            id: fallback.id,
            name: fallback.name || fallback.id,
            provider: this.provider,
            contextWindow: fallback.contextWindow ?? 128000,
            description: fallback.description || 'Custom user-defined Copilot model',
            capabilities: {
              family: 'custom',
              ...(fallback.capabilities || {}),
            },
            policy: fallback.policy,
            billing: fallback.billing,
            supportedReasoningEfforts: fallback.supportedReasoningEfforts,
            modelPickerCategory: fallback.modelPickerCategory,
            modelPickerPriceCategory: fallback.modelPickerPriceCategory,
          });
          existingModelIds.add(fallback.id.toLowerCase());
          logInfo(`[CopilotDelegate] Custom model added: ${fallback.id}`);
        }
      }
    } else {
      logInfo(`[CopilotDelegate] No custom models found or loaded.`);
    }

    return fetchedModels;
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
