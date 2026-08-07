import * as vscode from 'vscode';
import { LogLevel } from '../../../../../shared/services/vscode/domain/model/types';

/*
const parseLogLine = (line: string, fallbackLevel: 'debug' | 'info' | 'warn' | 'error') => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        let level = fallbackLevel;
        if (cleanLine.includes("🪲") || cleanLine.includes("[DEBUG]")) level = "debug";
        else if (cleanLine.includes("⚠️") || cleanLine.includes("[WARN]")) level = "warn";
        else if (cleanLine.includes("❌") || cleanLine.includes("[ERROR]")) level = "error";
        else if (cleanLine.includes("ℹ️") || cleanLine.includes("[INFO]") || cleanLine.includes("✅")) level = "info";
*/

function formatLogHeader(level: LogLevel): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const logHeader = `[${timestamp}] [${level.toUpperCase()}]`;
    return '';
}

export function logMessage(logChannel: vscode.LogOutputChannel,  level: LogLevel, message: string, details?: any) {
        const header = formatLogHeader(level);
        let logLine = `${header} ${message}`;
        if (details !== undefined && details !== null) {
            logLine += typeof details === 'object' ? `\nData:\n${JSON.stringify(details, null, 2)}` : ` | Details: ${details}`;
        }
        if (level === 'INFO') logChannel.info(logLine);
        else if (level === 'WARN') logChannel.warn(logLine);
        else if (level === 'ERROR') logChannel.error(logLine);
        else logChannel.debug(logLine);
    }
