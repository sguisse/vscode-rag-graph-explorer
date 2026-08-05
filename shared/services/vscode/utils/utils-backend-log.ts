import * as vscode from 'vscode';

let outputChannel: vscode.LogOutputChannel | undefined;

export function initializeBackendLogger(): void {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('token-razor', { log: true });
  }
}

function formatData(data?: unknown[] | Error): string {
  if (data === undefined) return '';
  if (data instanceof Error) return `\n  Error: ${data.message}\n  Stack: ${data.stack ?? 'N/A'}`;
  if (typeof data === 'object') {
    try {
      return `\n  Data: ${JSON.stringify(data, null, 2)}`;
    } catch {
      return '\n  Data: [Unserializable Object]';
    }
  }
  return `\n  Data: ${String(data)}`;
}

export function logDebug(message: string, data?: unknown[] | Error): void {
  outputChannel?.debug(`${message}${formatData(data)}`);
}

export function logInfo(message: string, data?: unknown[] | Error): void {
  outputChannel?.info(`${message}${formatData(data)}`);
}

export function logWarn(message: string, data?: unknown[] | Error): void {
  outputChannel?.warn(`${message}${formatData(data)}`);
}

export function logError(message: string, data?: unknown[] | Error): void {
  outputChannel?.error(`${message}${formatData(data)}`);
}

export function showLogChannel(): void {
  outputChannel?.show(true);
}
