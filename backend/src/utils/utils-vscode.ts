import * as vscode from 'vscode';

export function getAppName(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.name;
}
