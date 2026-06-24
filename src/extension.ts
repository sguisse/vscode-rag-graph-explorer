import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('graphRagExplorer.openTool', () => {
        const panel = vscode.window.createWebviewPanel(
            'graphRagExplorer',
            'Graph RAG Explorer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
            }
        );

        // Dynamically evaluate pinning rule based on user configuration settings
        const graphConfig = vscode.workspace.getConfiguration('graphRagExplorer');
        if (graphConfig.get('pinFilesExporter') !== false) {
            vscode.commands.executeCommand('workbench.action.pinEditor');
        }

        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'ready') {
                sendConfig(panel);
            } else if (message.command === 'publishToSharedList' && message.paths) {
                const filesExporterExt = vscode.extensions.getExtension('sguisse.files-exporter');
                if (filesExporterExt) {
                    if (!filesExporterExt.isActive) {
                        await filesExporterExt.activate();
                    }

                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    const absolutePaths = message.paths.map((p: string) => {
                        if (path.isAbsolute(p)) return p;
                        return workspaceFolders && workspaceFolders.length > 0
                            ? path.join(workspaceFolders[0].uri.fsPath, p)
                            : p;
                    });

                    if (filesExporterExt.exports && filesExporterExt.exports.appendExternalPaths) {
                        filesExporterExt.exports.appendExternalPaths(absolutePaths);
                        vscode.window.showInformationMessage(`${absolutePaths.length} absolute file(s) successfully published to Files Exporter!`);
                    } else {
                        vscode.window.showErrorMessage("Files Exporter API 'appendExternalPaths' is not available.");
                    }
                } else {
                    vscode.window.showErrorMessage("Files Exporter extension ('sguisse.files-exporter') is not installed.");
                }
            } else if (message.command === 'showNotification') {
                if (message.type === 'warn') {
                    vscode.window.showWarningMessage(message.text);
                } else {
                    vscode.window.showInformationMessage(message.text);
                }
            } else if (message.command === 'revealFile' && message.path) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const fullPath = path.isAbsolute(message.path)
                        ? message.path
                        : path.join(workspaceFolders[0].uri.fsPath, message.path);
                    const fileUri = vscode.Uri.file(fullPath);
                    vscode.workspace.openTextDocument(fileUri).then(doc => {
                        vscode.window.showTextDocument(doc, {
                            viewColumn: vscode.ViewColumn.One,
                            preserveFocus: true,
                            preview: true
                        });
                        vscode.commands.executeCommand('revealInExplorer', fileUri);
                    }, () => {});
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function sendConfig(panel: vscode.WebviewPanel) {
    const config = vscode.workspace.getConfiguration('graphRagExplorer');
    panel.webview.postMessage({
        command: 'setConfig',
        config: {
            EntitiesTypesList: config.get('EntitiesTypesList'),
            regexFilterEnabled: config.get('regexFilterEnabled'),
            TreeFilterEnabled: config.get('TreeFilterEnabled'),
            geminiApiKey: config.get('geminiApiKey'),
            tooltipDelay: config.get('tooltipDelay') ?? 2000,
            pinFilesExporter: config.get('pinFilesExporter') ?? true,
            graphLegendEnabled: config.get('graphLegendEnabled') ?? true,
            callersDepth: config.get('callersDepth') ?? 1,
            calleesDepth: config.get('calleesDepth') ?? 1
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
        <title>Graph RAG Explorer</title>
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
            #global-cursor-tooltip { position: fixed; background-color: #000000; color: #ffffff; border: 1px solid #454545; box-shadow: 0px 5px 12px rgba(0, 0, 0, 0.6); padding: 6px 10px; border-radius: 4px; font-family: var(--vscode-font-family, sans-serif); font-size: 11px; font-weight: normal; z-index: 999999; pointer-events: none; display: none; width: max-content; max-width: 200px; white-space: normal; word-wrap: break-word; height: auto; }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
        </style>
    </head>
    <body class="h-full overflow-hidden select-none">
        <div id="root" class="h-full flex flex-col"></div>
        <div id="global-cursor-tooltip"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

export function deactivate() {}
