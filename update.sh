#!/usr/bin/env bash
set -e

# Target file directory
TARGET_DIR="backend/src/services/llm-chat/delegate/copilot"

# Create directory if it does not exist
mkdir -p "$TARGET_DIR"

# Write full updated content to copilot.delegate.ts
cat << 'EOF' > backend/src/services/llm-chat/delegate/copilot/copilot.delegate.ts
import { CopilotClient, approveAll } from '@github/copilot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { ILlmProviderDelegate } from '../llm-provider.delegate.interface';
import {
  LlmProvider,
  ILlmModelInfo,
  LlmConfigVO,
  ChatPromptVO,
  IChatResponseDto,
  IChatStreamChunkDto,
  ILlmHealthResultDto,
} from '../../../../../../shared/services/llm-chat';
import { getCurrentExtensionContext, getWorkspaceRoot } from '../../../../utils/utils-vscode';
import { vsCodeSettingsManager } from '../../../../managers/VsCodeSettings.manager';
import { log, logError, logInfo } from '../../../../utils/utils-log';

import { CopilotAccountInfo } from './copilot-account-info.model';

type ForceResolveMode = 'COPILOT_CLI' | 'DEVELOPMENT_NODE_MODULE' | 'PLUGIN_INSTALL_LOCATION' | null;

// Configuration constant to force a specific path strategy or standard workflow (null)
const FORCE_RESOLVE_NATIVE_CLI: ForceResolveMode = null;

const LOG_FULL_MODELS_LIST_INFO = true; // Set to true to log the full list of models retrieved from Copilot SDK or REST API

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
   * Main orchestrator for CLI binary path resolution.
   */
  private resolveNativeCliPath(): string | undefined {
    log('CopilotDelegate', `resolveNativeCliPath start (Force Mode: ${FORCE_RESOLVE_NATIVE_CLI ?? 'None'})...`);

    // Return cached path if already resolved, only if no force mode is specified
    if (CopilotDelegate.cliBinaryPath && FORCE_RESOLVE_NATIVE_CLI === null) {
      log('CopilotDelegate', `resolveNativeCliPath cached path found: ${CopilotDelegate.cliBinaryPath}`);
      return CopilotDelegate.cliBinaryPath;
    }

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
   * Safely loads custom model overrides from optional locations:
   * 1. VS Code Extension absolute installation path
   * 2. Active Workspace tools folder (.token-razor/copilot-models-custom.json)
   */
  private loadCustomModels(): Partial<ILlmModelInfo>[] {
    const candidatePaths: string[] = [];

    // 1. VS Code Extension absolute path (if running inside extension context)
    const extensionContext = getCurrentExtensionContext();
    if (extensionContext) {
      candidatePaths.push(
        extensionContext.asAbsolutePath(
          path.join('backend', 'src', 'services', 'llm-chat', 'delegate', 'copilot-models-custom.json')
        ),
        extensionContext.asAbsolutePath('copilot-models-custom.json')
      );
    }

    // 2. Local workspace config path (.token-razor/copilot-models-custom.json)
    try {
      const workspaceRoot = getWorkspaceRoot();
      if (workspaceRoot) {
        candidatePaths.push(path.join(workspaceRoot, '.token-razor', 'config', 'llm', 'copilot', 'copilot-models-custom.json'));
      }
    } catch {
      // Workspace root not available
    }

    // 3. Runtime directory fallback (__dirname)
    candidatePaths.push(path.join(__dirname, 'copilot-models-custom.json'));

    for (const customJsonPath of candidatePaths) {
      try {
        if (fs.existsSync(customJsonPath)) {
          const fileContent = fs.readFileSync(customJsonPath, 'utf-8');
          const parsedModels: Partial<ILlmModelInfo>[] = JSON.parse(fileContent);
          logInfo(`[CopilotDelegate] '${parsedModels.length}' Custom models JSON loaded from: ${customJsonPath}`);
          return parsedModels;
        }
      } catch (error: any) {
        logInfo(`[CopilotDelegate] Failed parsing custom models at ${customJsonPath}: ${error?.message || error}`);
      }
    }

    logInfo(`[CopilotDelegate] No custom models found or loaded.`);
    return [];
  }

  private getGithubCopilotToken(): string | undefined {
    // Include GITHUB_COPILOT_TOKEN_RAZOR in the resolution chain
    const token =
      process.env.GITHUB_COPILOT_TOKEN_RAZOR ||
      process.env.COPILOT_GITHUB_TOKEN ||
      process.env.GITHUB_TOKEN ||
      process.env.GITHUB_COPILOT_TOKEN;
    return token;
  }

  private get client(): CopilotClient {
    if (!CopilotDelegate.clientInstance) {
      const cliPath = this.resolveNativeCliPath();

      if (cliPath) {
        process.env.COPILOT_CLI_PATH = cliPath;
      }

      const token = this.getGithubCopilotToken();
      if (token) {
        this.getGitHubUserAccountInfo(token)
          .then((accountInfo) => {
            logInfo(`[CopilotDelegate] Authenticated GitHub account: ${accountInfo.login} (${accountInfo.copilot_plan || 'Copilot'})`);
          })
          .catch((err) => {
            logError(`[CopilotDelegate] Could not retrieve account info: ${err?.message || err}`);
          });
      }

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

  /**
   * Fetches profile details and Copilot quota metadata for the currently authenticated GitHub account.
   */
  public async getGitHubUserAccountInfo(token: string): Promise<CopilotAccountInfo> {
    if (!token) {
      throw new Error('No GitHub Copilot token found. Please ensure you are logged in and have a valid token.');
    }

    const response = await fetch('https://api.github.com/copilot_internal/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'GithubCopilot/1.155.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub Copilot API Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as CopilotAccountInfo;
    logInfo(`[CopilotDelegate] Authenticated user: ${data.login} (${data.copilot_plan || 'Copilot'})`);

    return data;
  }

  /**
   * Dedicated Method 1: Fetches available models via the direct REST API endpoint.
   * Adapts base URL dynamically using AccountInfo endpoints if available.
   */
  public async fetchModelsFromRestApi(token: string, baseUrl?: string): Promise<ILlmModelInfo[]> {
    const targetHost = baseUrl || 'https://api.business.githubcopilot.com';
    const url = `${targetHost}/models`;
    logInfo(`[CopilotDelegate] Querying REST API for models: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Copilot-Integration-Id': 'vscode-chat',
        'User-Agent': 'GithubCopilot/1.155.0',
      },
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Copilot REST API error ${response.status}: ${errorMsg}`);
    }

    const body = (await response.json()) as { data?: any[] };
    const rawModels = body.data || [];

    logInfo(`[CopilotDelegate] Successfully retrieved ${rawModels.length} models via REST API.`);

    return this.mapRawModelsToModelInfo(rawModels, 'Model administered via GitHub Copilot REST API');
  }

  /**
   * Dedicated Method 2: Fetches available models via the Copilot SDK client instance.
   */
  public async fetchModelsFromSdk(): Promise<ILlmModelInfo[]> {
    await this.ensureStarted();
    const rawModels: any[] = await this.client.listModels();
    logInfo(`[CopilotDelegate] Total models found from SDK: ${rawModels.length}`, rawModels);

    return this.mapRawModelsToModelInfo(rawModels, 'Model administered via GitHub Copilot SDK');
  }

  /**
   * Helper method to map raw model objects from REST API, SDK, or Custom JSON into standard ILlmModelInfo interfaces.
   */
  private mapRawModelsToModelInfo(
    rawModels: any[],
    defaultDescription: string = 'Model administered via GitHub Copilot'
  ): ILlmModelInfo[] {
    return rawModels.map((m: any) => {
      // If policy or policy.state does not exist, initialize policy with state set to 'disabled'
      const isStateEnabled = m.policy?.state && String(m.policy.state).toLowerCase() === 'enabled';
      const policy = {
        ...(m.policy || {}),
        state: isStateEnabled ? 'enabled' : 'disabled',
      };

      const model = {
        id: m.id || m.name,
        name: m.name || m.id,
        provider: this.provider,
        contextWindow: m.capabilities?.limits?.max_context_window_tokens ?? m.contextWindow ?? 128000,
        description: m.description || defaultDescription,
        capabilities: m.capabilities || { family: 'custom' },
        policy,
        billing: m.billing,
        supportedReasoningEfforts: m.supportedReasoningEfforts,
        modelPickerCategory: m.modelPickerCategory,
        modelPickerPriceCategory: m.modelPickerPriceCategory,
      };

      if (LOG_FULL_MODELS_LIST_INFO) {
        logInfo(`[CopilotDelegate] Model mapped: ${model.id} - ${model.name} | Details: ${JSON.stringify(model)}`);
      }
      return model;
    });
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
   * Lists available LLM models from REST API or SDK, merging optional custom models from JSON if available.
   */
  async listModels(config?: LlmConfigVO): Promise<ILlmModelInfo[]> {
    let fetchedModels: ILlmModelInfo[] = [];
    const token = this.getGithubCopilotToken();

    // Strategy 1: Attempt direct REST API with dynamic URL resolution from AccountInfo
    if (token) {
      try {
        let baseUrl: string | undefined;
        try {
          const accountInfo = await this.getGitHubUserAccountInfo(token);
          baseUrl = accountInfo.endpoints?.api;
        } catch (accountErr: any) {
          logError(`[CopilotDelegate] Failed to resolve account endpoint URL, using default: ${accountErr?.message || accountErr}`);
        }

        fetchedModels = await this.fetchModelsFromRestApi(token, baseUrl);
      } catch (restErr: any) {
        logError(`[CopilotDelegate] Direct REST API fetch failed, falling back to SDK: ${restErr?.message || restErr}`);
      }
    }

    // Strategy 2: Fallback to Copilot SDK client if direct REST API returned no models
    if (fetchedModels.length === 0) {
      try {
        fetchedModels = await this.fetchModelsFromSdk();
      } catch (sdkErr: any) {
        logError(`[CopilotDelegate] Error fetching models from Copilot SDK: ${sdkErr?.message || sdkErr}`);
      }
    }

    // Dynamic resolution of custom models (skipped gracefully if file does not exist)
    const customModels = this.loadCustomModels();

    if (customModels.length > 0) {
      const existingModelIds = new Set(fetchedModels.map((m) => m.id.toLowerCase()));

      // 1. Filter out invalid or duplicate models
      const newCustomModels = customModels.filter((fallback) => {
        if (!fallback.id || existingModelIds.has(fallback.id.toLowerCase())) {
          return false;
        }
        existingModelIds.add(fallback.id.toLowerCase());
        logInfo(`[CopilotDelegate] Custom model added: ${fallback.id}`);
        return true;
      });

      // 2. Reuse mapper helper for new custom models
      if (newCustomModels.length > 0) {
        const mappedCustomModels = this.mapRawModelsToModelInfo(
          newCustomModels,
          'Custom user-defined Copilot model'
        );
        fetchedModels.push(...mappedCustomModels);
      }
    } else {
      logInfo(`[CopilotDelegate] No custom models found or loaded.`);
    }

    // Sort models by name ASC (case-insensitive)
    fetchedModels.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );

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
EOF

echo "✅ fix: Initialize policy with disabled state when policy or policy.state is missing"
npm run compile
