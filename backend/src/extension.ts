import * as vscode from 'vscode';
import { RpcProtocol } from '../../shared/rpc/rpc-protocol';
import { logInfo } from './utils/utils-log';
import { registerServices } from './config/registry/service-registrator';
import { registerRpcMethods } from './config/rpc/rpc-method-registrator';
import { VsCodeSettingsManager } from './services/vscode/core/VsCodeSettingsManager';

const EXTENSION_BASE_CONFIG_NAME = 'tokenRazor';

export function activate(context: vscode.ExtensionContext) {
    VsCodeSettingsManager.init(EXTENSION_BASE_CONFIG_NAME);
    registerServices(context);

    const openTool = () => {
        const packageData = context.extension.packageJSON;
        const panel = vscode.window.createWebviewPanel(
            EXTENSION_BASE_CONFIG_NAME,
            packageData.displayName,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                // FIX: Grant webview access to the entire extension workspace
                // so Vite dev server can load /node_modules/ fonts and /assets/ images
                localResourceRoots: [context.extensionUri],
                // Essential for Vite dev server proxying inside webview
                portMapping: [{ webviewPort: 5173, extensionHostPort: 5173 }]
            }
        );

        if (VsCodeSettingsManager.get('pinFilesExporter') !== false) {
            vscode.commands.executeCommand('workbench.action.pinEditor');
        }

        panel.iconPath = {
            light: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png'),
            dark: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png')
        };

        const rpc = new RpcProtocol((msg) => panel.webview.postMessage(msg));
        registerRpcMethods(rpc);

        panel.webview.onDidReceiveMessage((msg) => rpc.receive(msg), undefined, context.subscriptions);

        panel.webview.html = getWebviewContent(panel, context);
    };

    const disposable = vscode.commands.registerCommand(`${EXTENSION_BASE_CONFIG_NAME}.openTool`, openTool)
    context.subscriptions.push(disposable);

    logInfo('Extension activated successfully.');
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) : string {
    const isDev = context.extensionMode === vscode.ExtensionMode.Development;

    if (isDev) {
        logInfo('Extension launch in Development mode !!');

        const devServerUrl = 'http://localhost:5173';
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ws://localhost:5173 http://localhost:5173 https: http: vscode-webview: vscode-resource:; img-src http://localhost:5173 ${panel.webview.cspSource} vscode-webview: vscode-resource: https: http: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' http://localhost:5173 vscode-webview: vscode-resource:; style-src 'unsafe-inline' http://localhost:5173 vscode-webview: vscode-resource: https: http:; font-src http://localhost:5173 ${panel.webview.cspSource} vscode-webview: vscode-resource: https: http: data:;">`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${cspMeta}
  <script type="module">
    import RefreshRuntime from '${devServerUrl}/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
  </script>
  <script type="module" src="${devServerUrl}/@vite/client"></script>
</head>
<body style="margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background-color: transparent;">
  <div id="root"></div>
  <script type="module" src="${devServerUrl}/src/index.tsx"></script>
</body>
</html>`;
    } else {
        logInfo('Extension launch in Production mode !!');

        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist-webview', 'assets', 'index.js'));
        const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist-webview', 'assets', 'index.css'));
        const nonce = getNonce();

        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https: http: data: blob:; script-src 'nonce-${nonce}' ${panel.webview.cspSource} 'unsafe-inline'; style-src 'unsafe-inline' ${panel.webview.cspSource}; font-src ${panel.webview.cspSource} https: http: data:; connect-src ${panel.webview.cspSource} https: http:;">`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${cspMeta}
  <link rel="stylesheet" href="${styleUri}">
</head>
<body style="margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background-color: transparent;">
  <div id="root"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() {}
