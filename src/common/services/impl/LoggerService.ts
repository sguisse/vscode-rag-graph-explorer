import * as vscode from 'vscode';
import { ILoggerService } from '../ILoggerService';
import * as util from 'util';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class LoggerService implements ILoggerService {
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, channelName: string) {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
        context.subscriptions.push(this.outputChannel);
        this.info(`${channelName} output channel initialized.`);
    }

    private formatMessage(level: LogLevel, message: string, args: any[]): string {
        const timestamp = new Date().toLocaleTimeString();
        let formattedText = message;

        if (args && args.length > 0) {
            const processedArgs = args.map(arg => {
                if (arg instanceof Error) {
                    return arg.stack || `${arg.name}: ${arg.message}`;
                }
                return arg;
            });

            let msgTemplate = message;
            if (msgTemplate.includes('{}')) {
                msgTemplate = msgTemplate.replace(/\{\}/g, '%s');
            }

            formattedText = util.format(msgTemplate, ...processedArgs);
        }

        return `[${timestamp}] [${level.toUpperCase()}] ${formattedText}`;
    }

    public info(message: string, ...args: any[]): void {
        this.outputChannel.appendLine(this.formatMessage('info', message, args));
    }

    public warn(message: string, ...args: any[]): void {
        this.outputChannel.appendLine(this.formatMessage('warn', message, args));
    }

    public error(message: string, ...args: any[]): void {
        this.outputChannel.appendLine(this.formatMessage('error', message, args));
    }

    public debug(message: string, ...args: any[]): void {
        this.outputChannel.appendLine(this.formatMessage('debug', message, args));
    }

    public appendLine(message: string): void {
        this.outputChannel.appendLine(message);
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
