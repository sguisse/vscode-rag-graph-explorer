import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('ragGraphExplorer.openTool', () => {
        const panel = vscode.window.createWebviewPanel(
            'ragGraphExplorer',
            'RAG Graph Explorer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        const htmlPath = path.join(context.extensionPath, 'media', 'webview.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Setup base URI for local assets if needed by the UI toolkit
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media')));
        htmlContent = htmlContent.replace(/{{webviewUri}}/g, webviewUri.toString());

        panel.webview.html = htmlContent;

        // Configuration Sync
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'ready') {
                const config = vscode.workspace.getConfiguration('ragGraphExplorer');
                panel.webview.postMessage({
                    command: 'setConfig',
                    config: {
                        EntitiesTypesList: config.get('EntitiesTypesList'),
                        regexFilterEnabled: config.get('regexFilterEnabled'),
                        TreeFilterEnabled: config.get('TreeFilterEnabled'),
                        geminiApiKey: config.get('geminiApiKey')
                    }
                });
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
