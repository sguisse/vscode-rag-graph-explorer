import type * as VSCodeType from 'vscode';
import { ILoggerServicePort } from '../domain/port-out/logger-service.port';

// Safely attempt to require the 'vscode' module (Extension Host / Backend context)
let vscodeModule: typeof VSCodeType | undefined;
try {
  vscodeModule = require('vscode');
} catch {
  vscodeModule = undefined;
}

export class LoggerAdapter implements ILoggerServicePort {
  private readonly channelName: string;
  private outputChannel?: VSCodeType.OutputChannel | VSCodeType.LogOutputChannel;
  private readonly isVsCodeBackend: boolean;

  constructor(channelName: string) {
    this.channelName = channelName;

    if (vscodeModule?.window?.createOutputChannel) {
      this.isVsCodeBackend = true;
      try {
        // Modern VS Code LogOutputChannel (1.74+)
        this.outputChannel = vscodeModule.window.createOutputChannel(this.channelName, { log: true });
      } catch {
        // Fallback for older VS Code versions
        this.outputChannel = vscodeModule.window.createOutputChannel(this.channelName);
      }
      this.appendLine(`[INFO] Output channel "${this.channelName}" initialized.`);
    } else {
      this.isVsCodeBackend = false;
    }
  }

  /**
   * Logs locally to DevTools console and forwards IPC message to VS Code Extension Host
   */
  private postIPC(level: string, message: string) {

    // Local DevTools Console Log
    switch (level) {
        case 'DEBUG':
            console.debug(message);
            break;
        case 'INFO':
            console.info(message);
            break;
        case 'WARN':
            console.warn(message);
            break;
        case 'ERROR':
            console.error(message);
            break;
        default:
            console.log(message);
            break;
    }

    // Forward IPC log to VS Code Extension Host
    if (typeof window !== 'undefined' && (window as any).vscodeApi?.postMessage) {
      (window as any).vscodeApi.postMessage({
        command: 'log',
        payload: {
          channel: this.channelName,
          level,
          message: message
        }
      });
    }
  }

  private formatBackendMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ' ' + args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
        : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      if ('info' in this.outputChannel && typeof this.outputChannel.info === 'function') {
        this.outputChannel.info(message, ...args);
      } else {
        this.outputChannel.appendLine(this.formatBackendMessage('INFO', message, ...args));
      }
    } else {
      this.postIPC('INFO', this.formatBackendMessage('INFO', message, ...args));
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      if ('warn' in this.outputChannel && typeof this.outputChannel.warn === 'function') {
        this.outputChannel.warn(message, ...args);
      } else {
        this.outputChannel.appendLine(this.formatBackendMessage('WARN', message, ...args));
      }
    } else {
      this.postIPC('WARN', this.formatBackendMessage('WARN', message, ...args));
    }
  }

  public error(message: string, ...args: unknown[]): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      if ('error' in this.outputChannel && typeof this.outputChannel.error === 'function') {
        this.outputChannel.error(message, ...args);
      } else {
        this.outputChannel.appendLine(this.formatBackendMessage('ERROR', message, ...args));
      }
    } else {
      this.postIPC('ERROR', this.formatBackendMessage('ERROR', message, ...args));
    }
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      if ('debug' in this.outputChannel && typeof this.outputChannel.debug === 'function') {
        this.outputChannel.debug(message, ...args);
      } else {
        this.outputChannel.appendLine(this.formatBackendMessage('DEBUG', message, ...args));
      }
    } else {
      this.postIPC('DEBUG', this.formatBackendMessage('DEBUG', message, ...args));
    }
  }

  public show(): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      this.outputChannel.show(true);
    } else if (typeof window !== 'undefined' && (window as any).vscodeApi?.postMessage) {
      (window as any).vscodeApi.postMessage({
        command: 'showLogChannel',
        payload: { channel: this.channelName }
      });
    }
  }

  public appendLine(message: string): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      this.outputChannel.appendLine(message);
    } else {
      this.postIPC('INFO', this.formatBackendMessage('INFO', message));
    }
  }

  public dispose(): void {
    if (this.isVsCodeBackend && this.outputChannel) {
      this.outputChannel.dispose();
      this.outputChannel = undefined;
    }
  }
}
