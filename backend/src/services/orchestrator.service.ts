import * as vscode from 'vscode';
import { IExtensionServices } from '../../../shared/services.interface';
import { PythonService } from './python.service';

export class OrchestratorService implements IExtensionServices, vscode.Disposable {
    private logChannel: vscode.LogOutputChannel;
    private pythonService: PythonService;

    constructor(extensionUri: vscode.Uri) {
        this.logChannel = vscode.window.createOutputChannel('Token Razor Backend Logs', { log: true });
        this.pythonService = new PythonService(extensionUri);
    }

    private formatLogHeader(level: string): string {
        const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
        return `[${timestamp}] [${level.toUpperCase()}]`;
    }

    public async logMessage(level: 'info' | 'warn' | 'error', text: string, details?: any): Promise<void> {
        const header = this.formatLogHeader(level);
        let logLine = `${header} ${text}`;
        if (details !== undefined && details !== null) {
            logLine += typeof details === 'object' ? `\nData:\n${JSON.stringify(details, null, 2)}` : ` | Details: ${details}`;
        }
        if (level === 'warn') this.logChannel.warn(logLine);
        else if (level === 'error') this.logChannel.error(logLine);
        else this.logChannel.info(logLine);
    }

    public async runPythonAnalysis(userId: string): Promise<string> {
        await this.logMessage('info', 'Executing Python script...', { userId });
        return await this.pythonService.executeScript('mon_script.py', ['--user', userId], async (data, isError) => {
            if (data.trim()) await this.logMessage(isError ? 'error' : 'info', `[Python Process] ${data.trim()}`);
        });
    }

    public dispose() {
        this.logChannel.dispose();
    }
}
