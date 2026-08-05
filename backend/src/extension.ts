import * as vscode from 'vscode';
import { RpcProtocol } from '../../shared/rpc';
import { OrchestratorService } from './services/orchestrator.service';

const EXTENSION_BASE_CONFIG_NAME = 'tokenRazor';

export function activate(context: vscode.ExtensionContext) {
    const orchestrator = new OrchestratorService(context.extensionUri);
    context.subscriptions.push(orchestrator);

    const openTool = () => {
        const packageData = context.extension.packageJSON;
        const panel = vscode.window.createWebviewPanel(
            EXTENSION_BASE_CONFIG_NAME,
            packageData.displayName || 'Token Razor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'dist-webview'),
                    vscode.Uri.joinPath(context.extensionUri, 'assets')
                ],
                portMapping: [{ webviewPort: 5173, extensionHostPort: 5173 }]
            }
        );

        // Option A: Custom SVG or PNG files in your extension folder
        panel.iconPath = {
            light: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png'),
            dark: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png')
        };

        const rpc = new RpcProtocol((msg) => panel.webview.postMessage(msg));
        rpc.register('runPythonAnalysis', orchestrator.runPythonAnalysis.bind(orchestrator));
        rpc.register('logMessage', orchestrator.logMessage.bind(orchestrator));

        panel.webview.onDidReceiveMessage((msg) => rpc.receive(msg), undefined, context.subscriptions);

        const isDev = context.extensionMode === vscode.ExtensionMode.Development;

        if (isDev) {
            const devServerUrl = 'http://127.0.0.1:5173';
            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ws://127.0.0.1:5173 http://127.0.0.1:5173 https: http: vscode-webview: vscode-resource:; img-src http://127.0.0.1:5173 ${panel.webview.cspSource} vscode-webview: vscode-resource: https: http: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173 vscode-webview: vscode-resource:; style-src 'unsafe-inline' http://127.0.0.1:5173 vscode-webview: vscode-resource: https: http:; font-src http://127.0.0.1:5173 vscode-webview: vscode-resource: https: http: data:;">`;

            panel.webview.html = `<!DOCTYPE html>
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
            const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist-webview', 'assets', 'index.js'));
            const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist-webview', 'assets', 'index.css'));
            const nonce = getNonce();

            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https: http: data: blob:; script-src 'nonce-${nonce}' ${panel.webview.cspSource} 'unsafe-inline'; style-src 'unsafe-inline' ${panel.webview.cspSource}; font-src ${panel.webview.cspSource} https: http: data:; connect-src ${panel.webview.cspSource} https: http:;">`;

            panel.webview.html = `<!DOCTYPE html>
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
    };

    context.subscriptions.push(
        vscode.commands.registerCommand(`${EXTENSION_BASE_CONFIG_NAME}.openTool`, openTool)
    );
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
