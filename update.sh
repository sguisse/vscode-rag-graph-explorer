#!/usr/bin/env bash
set -e

# Refactor LoggerService constructor parameter names and use channelName property for outputChannel

mkdir -p src/common/services/impl

cat << 'EOF' > src/common/services/impl/LoggerService.ts
import * as vscode from 'vscode';
import { ILoggerService } from '../ILoggerService';
import * as util from 'util';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

let activeLoggerInstance: ILoggerService | null = null;

export function setGlobalLogger(logger: ILoggerService): void {
    activeLoggerInstance = logger;
}

export function getGlobalLogger(): ILoggerService | null {
    return activeLoggerInstance;
}

export class LoggerService implements ILoggerService {
    private outputChannel: vscode.OutputChannel;
    private channelName: string;

    constructor(contextOrChannelName: vscode.ExtensionContext | string, channelName?: string) {
        let context: vscode.ExtensionContext | undefined;
        let resolvedChannelName = 'Token Razor';

        if (typeof contextOrChannelName === 'string') {
            resolvedChannelName = contextOrChannelName;
        } else if (contextOrChannelName && typeof contextOrChannelName === 'object') {
            context = contextOrChannelName as vscode.ExtensionContext;
            if (channelName) {
                resolvedChannelName = channelName;
            }
        }

        this.channelName = resolvedChannelName;
        this.outputChannel = vscode.window.createOutputChannel(this.channelName);

        if (context && context.subscriptions) {
            context.subscriptions.push(this.outputChannel);
        }

        setGlobalLogger(this);
        this.info(`${this.channelName} output channel initialized.`);
    }

    public formatMessage(level: LogLevel, message: string, args: any[]): string {
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

    public formattedMessage(level: LogLevel, message: string, args: any[]): string {
        return this.formatMessage(level, message, args);
    }

    public info(message: string, ...args: any[]): void {
        const formatted = this.formatMessage('info', message, args);
        console.log(formatted);
        this.outputChannel.appendLine(formatted);
    }

    public warn(message: string, ...args: any[]): void {
        const formatted = this.formatMessage('warn', message, args);
        console.warn(formatted);
        this.outputChannel.appendLine(formatted);
    }

    public error(message: string, ...args: any[]): void {
        const formatted = this.formatMessage('error', message, args);
        console.error(formatted);
        this.outputChannel.appendLine(formatted);
    }

    public debug(message: string, ...args: any[]): void {
        const formatted = this.formatMessage('debug', message, args);
        console.debug(formatted);
        this.outputChannel.appendLine(formatted);
    }

    public appendLine(message: string): void {
        console.log(message);
        this.outputChannel.appendLine(message);
    }

    public show(preserveFocus?: boolean): void {
        this.outputChannel.show(preserveFocus);
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
EOF

if [ -f "package.json" ]; then
    npm run compile
fi

echo "✅ refactor: Renamed LoggerService constructor parameters to contextOrChannelName/channelName and updated outputChannel instantiation!"
