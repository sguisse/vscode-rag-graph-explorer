import * as vscode from 'vscode';
import { LogLevel } from '../../../shared/services/vscode/types';
import { getAppNameFromPackageJson } from './utils-vscode';

export let logChannel: vscode.LogOutputChannel;

function getLogChannel() {
    if (!logChannel) {
        const appName = getAppNameFromPackageJson();
        logChannel = vscode.window.createOutputChannel(`${appName}`, { log: true });
        logChannel.show();
    }
    return logChannel;
}

function formatLogHeader(level: LogLevel): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const logHeader = `[${timestamp}] [${level.toUpperCase()}]`;
    return '';
}

export function logMessage(level: LogLevel, message: string, details?: any) {
        const header = formatLogHeader(level);
        let logLine = `${header} ${message}`;
        if (details !== undefined && details !== null) {
            logLine += typeof details === 'object' ? `\nData:\n${JSON.stringify(details, null, 2)}` : ` | Details: ${details}`;
        }
        if (level === 'INFO') getLogChannel().info(logLine);
        else if (level === 'WARN') getLogChannel().warn(logLine);
        else if (level === 'ERROR') getLogChannel().error(logLine);
        else getLogChannel().debug(logLine);
}

export function logDebug(message: string, details?: any): void {
  logMessage('DEBUG', message, details);
}

export function logInfo(message: string, details?: any): void {
  logMessage('INFO', message, details);
}

export function logWarn(message: string, details?: any): void {
  logMessage('WARN', message, details);
}

export function logError(message: string, details?: any): void {
  logMessage('ERROR', message, details);
}

type ScriptLineLevel = 'debug' | 'info' | 'warn' | 'error';

function detectScriptLineLevel(line: string, fallback: ScriptLineLevel): ScriptLineLevel {
  if (line.includes('🪲') || line.includes('[DEBUG]')) return 'debug';
  if (line.includes('⚠️') || line.includes('[WARN]')) return 'warn';
  if (line.includes('❌') || line.includes('[ERROR]')) return 'error';
  if (line.includes('ℹ️') || line.includes('[INFO]') || line.includes('✅')) return 'info';
  return fallback;
}

/** Logs one line of a script output as "[origin] line", at the level indicated by its markers (or the fallback level). */
export function logScriptLine(origin: string, line: string, fallback: ScriptLineLevel = 'info'): void {
  const message = `[${origin}] ${line}`;
  const channel = getLogChannel();
  switch (detectScriptLineLevel(line, fallback)) {
    case 'debug': channel.debug(message); break;
    case 'warn': channel.warn(message); break;
    case 'error': channel.error(message); break;
    default: channel.info(message);
  }
}

export function log(origin: string, message: string, details?: any): void {
  getLogChannel().appendLine(`[${origin}] ${message}`);
  if (details !== undefined && details !== null) {
      const detailsString = typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details);
      getLogChannel().appendLine(detailsString);
  }
}
