import * as vscode from 'vscode';

export interface ILoggerService extends vscode.Disposable {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    appendLine(message: string): void;
    show?(preserveFocus?: boolean): void;
}
