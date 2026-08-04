#!/usr/bin/env bash
set -e

echo "🔧 Fixing Extension Host 10s activation timeout and wiring 'tokenRazor' Output Channel..."

# 1. Create required directories
mkdir -p src/backend/services/vscode/infrastructure
mkdir -p src/backend/services/vscode/utils
mkdir -p src/webview/services
mkdir -p src/webview/mocks
mkdir -p src/webview/store
mkdir -p src/webview

# 2. Update logger adapter with clean standard require for Node Extension Host
cat << 'EOF' > src/backend/services/vscode/infrastructure/logger-service.adpter.ts
import type * as VSCodeType from 'vscode';
import { ILoggerServicePort } from '../domain/port-out/logger-service.port';

let vscodeModule: typeof VSCodeType | undefined;
try {
  vscodeModule = require('vscode');
} catch {
  vscodeModule = undefined;
}

export class LoggerAdapter implements ILoggerServicePort {
  private outputChannel?: VSCodeType.OutputChannel;

  constructor(channelName: string = 'tokenRazor') {
    try {
      if (vscodeModule?.window?.createOutputChannel) {
        this.outputChannel = vscodeModule.window.createOutputChannel(channelName);
        this.outputChannel.appendLine(`[${new Date().toISOString()}] [INFO] Output channel "${channelName}" initialized.`);
      }
    } catch (e) {
      console.error('[LoggerAdapter] Failed to create output channel:', e);
    }
  }

  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ' ' + args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
        : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  public info(message: string, ...args: unknown[]): void {
    const formatted = this.formatMessage('INFO', message, ...args);
    if (this.outputChannel) {
      this.outputChannel.appendLine(formatted);
    } else {
      console.log(formatted);
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    const formatted = this.formatMessage('WARN', message, ...args);
    if (this.outputChannel) {
      this.outputChannel.appendLine(formatted);
    } else {
      console.warn(formatted);
    }
  }

  public error(message: string, ...args: unknown[]): void {
    const formatted = this.formatMessage('ERROR', message, ...args);
    if (this.outputChannel) {
      this.outputChannel.appendLine(formatted);
    } else {
      console.error(formatted);
    }
  }

  public debug(message: string, ...args: unknown[]): void {
    const formatted = this.formatMessage('DEBUG', message, ...args);
    if (this.outputChannel) {
      this.outputChannel.appendLine(formatted);
    } else {
      console.debug(formatted);
    }
  }

  public show(): void {
    if (this.outputChannel) {
      this.outputChannel.show(true);
    }
  }

  public appendLine(message: string): void {
    if (this.outputChannel) {
      this.outputChannel.appendLine(message);
    } else {
      console.debug(message);
    }
  }

  public dispose(): void {
    if (this.outputChannel) {
      this.outputChannel.dispose();
    }
  }
}
EOF

# 3. Update WebviewLoggerAdapter to lazily forward logs via IPC to the Extension Host
cat << 'EOF' > src/webview/services/WebviewLoggerAdapter.ts
import type { ILoggerServicePort } from '@/backend/services/vscode/domain/port-out/logger-service.port';

function getVsCodeApi() {
  if (typeof window === 'undefined') return null;
  if ((window as any).vscodeApi) return (window as any).vscodeApi;
  if (typeof (window as any).acquireVsCodeApi === 'function') {
    try {
      const api = (window as any).acquireVsCodeApi();
      (window as any).vscodeApi = api;
      return api;
    } catch {
      return (window as any).vscodeApi || null;
    }
  }
  return null;
}

export class WebviewLoggerAdapter implements ILoggerServicePort {
  private postIPC(level: string, message: string, ...args: unknown[]) {
    const formattedArgs =
      args.length > 0
        ? ' ' + args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
        : '';
    const fullMessage = `${message}${formattedArgs}`;

    console.log(`[Webview ${level}]`, fullMessage);

    try {
      const api = getVsCodeApi();
      if (api?.postMessage) {
        api.postMessage({
          command: 'log',
          payload: { level, message: fullMessage }
        });
      }
    } catch {
      // Safe fallback when running outside VS Code webview iframe
    }
  }

  public info(message: string, ...args: unknown[]): void {
    this.postIPC('INFO', message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.postIPC('WARN', message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.postIPC('ERROR', message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.postIPC('DEBUG', message, ...args);
  }

  public show(): void {}

  public appendLine(message: string): void {
    this.postIPC('INFO', message);
  }

  public dispose(): void {}
}
EOF

# 4. Update utils-log.ts for safe logger resolution
cat << 'EOF' > src/backend/services/vscode/utils/utils-log.ts
import { useBackendServiceStore } from '@/store/useBackendServiceStore';

function getLogger() {
  try {
    return useBackendServiceStore.getState().getBackendService('logger');
  } catch {
    return null;
  }
}

export function logInfo(message: string, ...args: unknown[]): void {
  const logger = getLogger();
  if (logger) {
    logger.info(message, ...args);
  } else {
    console.log(`[INFO] ${message}`, ...args);
  }
}

export function logWarn(message: string, ...args: unknown[]): void {
  const logger = getLogger();
  if (logger) {
    logger.warn(message, ...args);
  } else {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

export function logError(message: string, ...args: unknown[]): void {
  const logger = getLogger();
  if (logger) {
    logger.error(message, ...args);
  } else {
    console.error(`[ERROR] ${message}`, ...args);
  }
}
EOF

# 5. Update WebviewMessagingService.ts to handle 'log' command over IPC
cat << 'EOF' > src/webview/services/WebviewMessagingService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logError, logInfo, logWarn } from '@/backend/services/vscode/utils/utils-log';
import { sendConfig } from './WebviewInitializerService';

export async function handleWebviewMessage(
    message: any,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
): Promise<void> {
    switch (message.command) {
        case 'log':
            handleLogMessage(message);
            break;

        case 'ready':
            handleReady(panel, context);
            break;

        case 'forceRefreshScan':
            handleForceRefreshScan(message, panel, context);
            break;

        case 'killAnalysis':
            handleKillAnalysis(panel);
            break;

        case 'openExternal':
            await handleOpenExternal(message);
            break;

        case 'revealFile':
            await handleRevealFile(message);
            break;
    }
}

function handleLogMessage(message: any): void {
    const { level, message: logMsg } = message.payload || {};
    const formatted = `[Webview] ${logMsg || ''}`;

    switch (level) {
        case 'WARN':
            logWarn(formatted);
            break;
        case 'ERROR':
            logError(formatted);
            break;
        case 'DEBUG':
            logInfo(`[DEBUG] ${formatted}`);
            break;
        default:
            logInfo(formatted);
            break;
    }
}

function handleReady(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
    console.info('Webview ready. Sending configuration and launching deep scan.');
    sendConfig(panel, context);
}

function handleForceRefreshScan(
    message: any,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
): void {
    const mode = message.mode || "deep";
    let targetFile = "";
    logInfo(`Force refresh scan requested. Mode: ${mode}`);

    if (mode === "delta") {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.scheme === 'file') {
            targetFile = vscode.workspace.asRelativePath(activeEditor.document.uri);
        } else {
            vscode.window.showWarningMessage("Delta Reload parsing rules require an active text file window context.");
            logWarn('Delta Reload aborted: No active text file window context found.');
            panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            return;
        }
    }
}

function handleKillAnalysis(panel: vscode.WebviewPanel): void {
    logInfo('Manual analysis termination requested by user.');
    panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
}

async function handleOpenExternal(message: any): Promise<void> {
    if (!message.url) return;

    try {
        logInfo(`Opening external URL: ${message.url}`);
        await vscode.env.openExternal(vscode.Uri.parse(message.url));
    } catch (err) {
        logError(`Failed to open external URL: ${message.url}`);
        vscode.window.showErrorMessage(`Failed to open external link: ${message.url}`);
    }
}

async function handleRevealFile(message: any): Promise<void> {
    if (!message.path) return;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceRoot = workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].uri.fsPath
        : '';
    const fullPath = path.isAbsolute(message.path)
        ? message.path
        : path.join(workspaceRoot, message.path);

    if (fs.existsSync(fullPath)) {
        try {
            logInfo(`Revealing file: ${message.path}`);
            const doc = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(doc, {
                viewColumn: message.openEditor ? vscode.ViewColumn.One : undefined,
                preserveFocus: !message.openEditor
            });
        } catch (err) {
            logError(`Error opening text document: ${err}`);
        }
    }
}
EOF

# 6. Update WebviewInitializerService.ts to register 'tokenRazor' Output Channel logger
cat << 'EOF' > src/webview/services/WebviewInitializerService.ts
import { useBackendServiceStore } from '@/store/useBackendServiceStore';

import * as vscode from 'vscode';
import { CodebaseAdapter } from '@/backend/services/codebase/infrastructure/codebase-service.adapter-mock';
import { VsCodeSettings } from '@/backend/services/vscode/domain/model/VsCodeSettings';
import { logInfo } from '@/backend/services/vscode/utils/utils-log';
import { LoggerAdapter } from '@/backend/services/vscode/infrastructure/logger-service.adpter';

function getAppName(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.displayName || packageData.name || 'tokenRazor';
}

export function initializeVsCodeSettings(context: vscode.ExtensionContext): void {
    VsCodeSettings.init(getAppName(context));
}

export function initializeDefaultServices(context: vscode.ExtensionContext): void {
    const appName = 'tokenRazor';
    const register = useBackendServiceStore.getState().registerService;
    register('codebaseService', new CodebaseAdapter());
    register('logger', new LoggerAdapter(appName));
    logInfo(`[WebviewInitializerService] Default services initialized for ${appName}.`);
}

export function sendConfig(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
    const host = VsCodeSettings.get<string>('neo4j.host', 'localhost');
    const portHttp = VsCodeSettings.get<number>('neo4j.port.http', 7474);
    const neo4jUrl = `http://${host}:${portHttp}/browser/preview/`;

    panel.webview.postMessage({
        command: 'setConfig',
        config: {
            entitiesTypesList: VsCodeSettings.get('entitiesTypesList'),
            regexFilterEnabled: VsCodeSettings.get('regexFilterEnabled'),
            treeFilterEnabled: VsCodeSettings.get('treeFilterEnabled'),
            geminiApiKey: VsCodeSettings.get('geminiApiKey'),
            tooltipDelay: VsCodeSettings.get('tooltipDelay', 2000),
            extensionVersion: context.extension.packageJSON.version,
            neo4jUrl: neo4jUrl
        }
    });
}
EOF

# 7. Update useBackendServiceStore.ts for environment-aware logger instantiation
cat << 'EOF' > src/webview/store/useBackendServiceStore.ts
import { create } from 'zustand';
import type { BackendServices } from '@/backend/config/registry/services.types';
import { CodebaseAdapter } from '@/backend/services/codebase/infrastructure/codebase-service.adapter-mock';
import { LoggerAdapter } from '@/backend/services/vscode/infrastructure/logger-service.adpter';
import { WebviewLoggerAdapter } from '@/webview/services/WebviewLoggerAdapter';

const isBrowserEnvironment = typeof window !== 'undefined';

export interface BackendServiceState {
  services: Partial<BackendServices>;
  registerService: <K extends keyof BackendServices>(key: K, service: BackendServices[K]) => void;
  getBackendService: <K extends keyof BackendServices>(key: K) => BackendServices[K];
}

export const useBackendServiceStore = create<BackendServiceState>((set, get) => ({
  services: {
    codebaseService: new CodebaseAdapter(),
    logger: isBrowserEnvironment
      ? new WebviewLoggerAdapter()
      : new LoggerAdapter('tokenRazor'),
  },
  registerService: (key, service) =>
    set((state) => ({
      services: { ...state.services, [key]: service },
    })),
  getBackendService: <K extends keyof BackendServices>(key: K): BackendServices[K] => {
    const service = get().services[key];
    if (!service) {
      throw new Error(`[BackendServiceStore] Service "${String(key)}" has not been registered.`);
    }
    return service as BackendServices[K];
  },
}));
EOF

# 8. Update src/extension.ts wrapped in safe try/catch activation
cat << 'EOF' > src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { VsCodeSettings } from './backend/services/vscode/domain/model/VsCodeSettings';
import { initializeDefaultServices, initializeVsCodeSettings } from './webview/services/WebviewInitializerService';
import { logInfo, logError } from './backend/services/vscode/utils/utils-log';
import { handleWebviewMessage } from './webview/services/WebviewMessagingService';

const EXTENTION_BASE_CONFIG_NAME = 'tokenRazor';

export function activate(context: vscode.ExtensionContext) {
    try {
        initializeDefaultServices(context);
        initializeVsCodeSettings(context);
        logInfo('Extension tokenRazor activating...');

        const disposable = vscode.commands.registerCommand(`${EXTENTION_BASE_CONFIG_NAME}.openTool`, () => openToolCommand(context));
        context.subscriptions.push(disposable);

        logInfo('Extension tokenRazor activation complete.');
    } catch (err) {
        console.error('[tokenRazor] Error during extension activation:', err);
        logError(`Activation error: ${err}`);
    }
}

function openToolCommand(context: vscode.ExtensionContext): void {
    const packageData = context.extension.packageJSON;
    const panel = vscode.window.createWebviewPanel(
      EXTENTION_BASE_CONFIG_NAME,
      packageData.displayName || packageData.name || 'Token Razor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'dist')),
          vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))
        ],
        portMapping: [
          { webviewPort: 5173, hostPort: 5173 }
        ]
      }
    );

    if (VsCodeSettings.get('pinApplication') !== false) {
        vscode.commands.executeCommand('workbench.action.pinEditor');
    }

    panel.webview.html = getWebviewContent(context, panel.webview);

    const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.uri.scheme !== 'file') return;
        const relativePath = vscode.workspace.asRelativePath(document.uri);
        logInfo(`File saved: ${relativePath}. Triggering delta scan.`);
    });
    context.subscriptions.push(saveListener);

    panel.onDidDispose(() => {
        logInfo('Webview panel disposed.');
        saveListener.dispose();
    });

    panel.webview.onDidReceiveMessage(async (message) => {
        logInfo('Webview message received:', message);
        await handleWebviewMessage(message, panel, context);
    });

    panel.webview.postMessage({ command: "ready" });
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
  const isDev = context.extensionMode === vscode.ExtensionMode.Development;

  const distDir = path.join(context.extensionPath, 'dist', 'webview');
  let htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    const nestedPath = path.join(distDir, 'src', 'webview', 'index.html');
    if (fs.existsSync(nestedPath)) {
      htmlPath = nestedPath;
    }
  }

  if (isDev) {
    const devServerUrl = 'http://127.0.0.1:5173';

    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ws://127.0.0.1:5173 http://127.0.0.1:5173 https: http: vscode-webview: vscode-resource:; img-src http://127.0.0.1:5173 ${webview.cspSource} vscode-webview: vscode-resource: https: http: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173 vscode-webview: vscode-resource:; style-src 'unsafe-inline' http://127.0.0.1:5173 vscode-webview: vscode-resource: https: http:; font-src http://127.0.0.1:5173 vscode-webview: vscode-resource: https: http: data:;">`;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      ${cspMeta}
      <script type="module">
        import RefreshRuntime from '${devServerUrl}/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
      </script>
      <script type="module" src="${devServerUrl}/@vite/client"></script>
    </head>
    <body style="margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background-color: transparent;">
      <div id="root"></div>
      <script type="module" src="${devServerUrl}/src/webview/index.tsx"></script>
    </body>
    </html>`;
  }

  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const nonce = getNonce();
    const assetBaseDir = path.dirname(htmlPath);

    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: http: data: blob:; script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-inline'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource} https: http: data:; connect-src ${webview.cspSource} https: http:;">`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n    ${cspMeta}`);
    } else {
      html = cspMeta + html;
    }

    html = html.replace(/<script /g, `<script nonce="${nonce}" `);

    html = html.replace(/(src|href)="([^"]+)"/g, (match, attr, srcPath) => {
      if (srcPath.startsWith('http://') || srcPath.startsWith('https://') || srcPath.startsWith('data:')) {
        return match;
      }
      const cleanPath = srcPath.replace(/^[\/\.]+/g, '');
      const fileUri = vscode.Uri.file(path.join(assetBaseDir, cleanPath));
      const webviewUri = webview.asWebviewUri(fileUri);
      return `${attr}="${webviewUri}"`;
    });

    return html;
  }

  return `<!DOCTYPE html>
  <html>
    <body style="color: white; font-family: sans-serif; padding: 20px;">
      <h2>🪒 Token Razor</h2>
      <p>Webview bundle not found at ${htmlPath}. Please run <code>npm run compile</code>.</p>
    </body>
  </html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
EOF

# 9. Create webview entry HTML
cat << 'EOF' > src/webview/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Token Razor</title>
  </head>
  <body style="margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background-color: transparent;">
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
EOF

# 10. Recompile extension host and webview client
npm run compile

echo "✅ fix: Resolved Extension Host activation timeout and registered 'tokenRazor' Output Channel with Webview IPC log forwarding!"
