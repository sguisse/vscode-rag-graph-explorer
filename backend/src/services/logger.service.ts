import * as vscode from 'vscode';
import { ILoggerService } from '../../../shared/services/logger-service.interface';
import { getAppName } from '../utils/utils-vscode';
import { LogLevel } from '../../../shared/services/vscode/domain/model/types';

export class LoggerService implements ILoggerService, vscode.Disposable {
    private logChannel: vscode.LogOutputChannel;

    constructor(context: vscode.ExtensionContext) {
        const appName = getAppName(context);
        this.logChannel = vscode.window.createOutputChannel(`${appName}`, { log: true });
    }

    private formatLogHeader(level: LogLevel): string {
        const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
        return `[${timestamp}] [${level.toUpperCase()}]`;
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        const header = this.formatLogHeader(level);
        let logLine = `${header} ${message}`;
        if (details !== undefined && details !== null) {
            logLine += typeof details === 'object' ? `\nData:\n${JSON.stringify(details, null, 2)}` : ` | Details: ${details}`;
        }
        if (level === 'INFO') this.logChannel.info(logLine);
        else if (level === 'WARN') this.logChannel.warn(logLine);
        else if (level === 'ERROR') this.logChannel.error(logLine);
        else this.logChannel.debug(logLine);
    }

    public dispose() {
        this.logChannel.dispose();
    }
}
