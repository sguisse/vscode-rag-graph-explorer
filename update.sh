#!/usr/bin/env bash
set -e

DELEGATE_DIR="./backend/src/services/llm-chat/delegate"
TARGET_FILE="$DELEGATE_DIR/copilot.delegate.ts"
OLD_FILE="$DELEGATE_DIR/copilot-provider.delegate.ts"

echo "🚀 Mise à jour du delegate GitHub Copilot dans $TARGET_FILE..."

mkdir -p "$DELEGATE_DIR"

# Supprime l'ancien fichier pour éviter les conflits d'importation
if [ -f "$OLD_FILE" ]; then
  echo "🧹 Nettoyage de l'ancien fichier $OLD_FILE..."
  rm -f "$OLD_FILE"
fi

cat << 'EOF' > "$TARGET_FILE"
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

export class CopilotDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.COPILOT;
  private static clientInstance: CopilotClient | null = null;
  private static isStarted = false;
  private static startPromise: Promise<void> | null = null;

  public constructor() {}

  /**
   * Localise le binaire exécutable natif du CLI Copilot compatible avec l'Extension Host VS Code
   */
  private resolveNativeCliPath(): string | undefined {
    if (process.env.COPILOT_CLI_PATH && fs.existsSync(process.env.COPILOT_CLI_PATH)) {
      return process.env.COPILOT_CLI_PATH;
    }

    const platform = process.platform;
    const arch = process.arch;

    let pkgName = '';
    let binName = 'copilot';

    if (platform === 'darwin') {
      pkgName = arch === 'arm64' ? '@github/copilot-darwin-arm64' : '@github/copilot-darwin-x64';
    } else if (platform === 'linux') {
      pkgName = arch === 'arm64' ? '@github/copilot-linux-arm64' : '@github/copilot-linux-x64';
    } else if (platform === 'win32') {
      pkgName = arch === 'arm64' ? '@github/copilot-win32-arm64' : '@github/copilot-win32-x64';
      binName = 'copilot.exe';
    }

    if (pkgName) {
      // 1. Résolution standard CommonJS
      try {
        const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
        const binPath = path.join(path.dirname(pkgJsonPath), binName);
        if (fs.existsSync(binPath)) {
          return binPath;
        }
      } catch {
        // Fallback silencieux si 'require.resolve' échoue dans le bundle
      }

      // 2. Fallback pour bundle VS Code (esbuild/webpack) : balayage des répertoires node_modules
      const possibleRoots = [
        process.cwd(),
        path.join(__dirname, '..', '..', '..', '..', '..'),
        path.join(__dirname, '..', '..', '..'),
      ];

      for (const root of possibleRoots) {
        const candidate = path.join(root, 'node_modules', pkgName, binName);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }

    return undefined;
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
    return models.map((m: any) => ({
      id: m.id || m.name,
      name: m.name || m.id,
      provider: this.provider,
      contextWindow: m.contextWindow ?? 128000,
      description: m.description || 'Modèle administré via GitHub Copilot SDK',
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
        error: error?.message || 'Erreur lors de la réponse Copilot',
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
      const errorDetails = error?.message || 'Erreur lors du streaming Copilot';
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
        details: `Service Copilot opérationnel (${models.length} modèles détectés)`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        details: `Erreur HealthCheck Copilot: ${error?.message}`,
      };
    }
  }
}
EOF

echo "✅ Mise à jour terminée avec succès !"
