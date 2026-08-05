#!/usr/bin/env bash
set -e

# Create required directory hierarchy
mkdir -p src/webview/lib
mkdir -p src/backend/services/vscode/utils

# -----------------------------------------------------------------------------
# 1. Safe Webview Logger Service with Global API Caching
# -----------------------------------------------------------------------------
cat << 'EOF' > src/webview/lib/utils-frontend-log.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface WebviewLogPayload {
  type: 'log';
  level: LogLevel;
  message: string;
  data?: unknown;
}

interface VsCodeApi {
  postMessage(message: unknown): void;
  setState?(state: unknown): void;
  getState?(): unknown;
}

declare global {
  function acquireVsCodeApi(): VsCodeApi;
  interface Window {
    __vscodeApiInstance__?: VsCodeApi;
  }
}

/**
 * Safely acquires and memoizes the VS Code Webview API instance globally.
 * Prevents "An instance of the VS Code API has already been acquired" errors.
 */
export function getVsCodeApi(): VsCodeApi | null {
  if (typeof window !== 'undefined' && window.__vscodeApiInstance__) {
    return window.__vscodeApiInstance__;
  }

  if (typeof acquireVsCodeApi === 'function') {
    try {
      const api = acquireVsCodeApi();
      if (typeof window !== 'undefined') {
        window.__vscodeApiInstance__ = api;
      }
      return api;
    } catch {
      // In case it was already acquired elsewhere prior to this call
      if (typeof window !== 'undefined' && window.__vscodeApiInstance__) {
        return window.__vscodeApiInstance__;
      }
    }
  }

  return null;
}

export class WebviewLoggerService {
  private static instance: WebviewLoggerService;

  private constructor() {}

  public static getInstance(): WebviewLoggerService {
    if (!WebviewLoggerService.instance) {
      WebviewLoggerService.instance = new WebviewLoggerService();
    }
    return WebviewLoggerService.instance;
  }

  public log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[Webview][${level.toUpperCase()}][${timestamp}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, data ?? '');
        break;
      case 'info':
        console.info(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
    }

    this.sendToExtension(level, message, data);
  }

  private sendToExtension(level: LogLevel, message: string, data?: unknown): void {
    const api = getVsCodeApi();
    if (api) {
      const payload: WebviewLogPayload = {
        type: 'log',
        level,
        message,
        data,
      };
      api.postMessage(payload);
    }
  }

  public debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

export const webviewLogger = WebviewLoggerService.getInstance();

// Webview helper function exports
export function logDebug(message: string, data?: unknown): void {
  webviewLogger.debug(message, data);
}

export function logInfo(message: string, data?: unknown): void {
  webviewLogger.info(message, data);
}

export function logWarn(message: string, data?: unknown): void {
  webviewLogger.warn(message, data);
}

export function logError(message: string, data?: unknown): void {
  webviewLogger.error(message, data);
}
EOF

# -----------------------------------------------------------------------------
# 2. Backend Logger Adapter
# -----------------------------------------------------------------------------
cat << 'EOF' > src/backend/services/vscode/utils/utils-backend-log.ts
import * as vscode from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface WebviewLogPayload {
  type: 'log';
  level: LogLevel;
  message: string;
  data?: unknown;
}

export function formatMessage(message: string, data?: unknown): string {
  if (data === undefined) {
    return message;
  }
  if (data instanceof Error) {
    return `${message}\n  Error: ${data.message}\n  Stack: ${data.stack ?? 'N/A'}`;
  }
  if (typeof data === 'object') {
    try {
      return `${message}\n  Data: ${JSON.stringify(data, null, 2)}`;
    } catch {
      return `${message}\n  Data: [Unserializable Object]`;
    }
  }
  return `${message}\n  Data: ${String(data)}`;
}

export class BackendLoggerAdapter {
  private static instance: BackendLoggerAdapter;
  private outputChannel: vscode.OutputChannel;
  private isDebugEnabled: boolean = true;

  private constructor(channelName: string = 'RAG Graph Explorer') {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  public static getInstance(channelName?: string): BackendLoggerAdapter {
    if (!BackendLoggerAdapter.instance) {
      BackendLoggerAdapter.instance = new BackendLoggerAdapter(channelName);
    }
    return BackendLoggerAdapter.instance;
  }

  public showChannel(): void {
    this.outputChannel.show(true);
  }

  public log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const formattedLevel = level.toUpperCase().padEnd(5);
    const formattedBody = formatMessage(message, data);
    const line = `[${timestamp}] [${formattedLevel}] ${formattedBody}`;

    this.outputChannel.appendLine(line);
  }

  public debug(message: string, data?: unknown): void {
    if (this.isDebugEnabled) {
      this.log('debug', message, data);
    }
  }

  public info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  public handleWebviewMessage(message: unknown): boolean {
    if (
      typeof message === 'object' &&
      message !== null &&
      (message as WebviewLogPayload).type === 'log'
    ) {
      const payload = message as WebviewLogPayload;
      const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      const level = validLevels.includes(payload.level) ? payload.level : 'info';
      this.log(level, `[Webview] ${payload.message}`, payload.data);
      return true;
    }
    return false;
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }
}

export const backendLogger = BackendLoggerAdapter.getInstance();

export function logDebug(message: string, data?: unknown): void {
  backendLogger.debug(message, data);
}

export function logInfo(message: string, data?: unknown): void {
  backendLogger.info(message, data);
}

export function logWarn(message: string, data?: unknown): void {
  backendLogger.warn(message, data);
}

export function logError(message: string, data?: unknown): void {
  backendLogger.error(message, data);
}
EOF

# Compile check
npm run compile

echo "✅ fix(webview): Memoized acquireVsCodeApi globally to resolve duplicate acquisition errors in WebviewLoggerService!"
