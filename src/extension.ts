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
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
            }
        );

        // Force VS Code to lock and pin the active webview panel tab inside the current group
        vscode.commands.executeCommand('workbench.action.pinEditor');

        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'ready') {
                sendConfig(panel);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function sendConfig(panel: vscode.WebviewPanel) {
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

function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist', 'webview.js')));

    return `<!DOCTYPE html>
    <html lang="en" class="h-full">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RAG Graph Explorer</title>
        <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>tailwind.config = { darkMode: 'class' }</script>
        <style>
            body {
                padding: 0; margin: 0;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                font-family: var(--vscode-font-family);
            }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
        </style>
    </head>
    <body class="h-full overflow-hidden select-none">
        <div id="root" class="h-full flex flex-col"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

export function deactivate() {}
