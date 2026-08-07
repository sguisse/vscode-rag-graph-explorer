import * as vscode from 'vscode';
import { RpcProtocol } from '../../shared/rpc/rpc-protocol';
import { logInfo } from './utils/utils-log';
import { registerServices } from './config/service-registrator.gen';
import { registerRpcMethods } from './config/rpc-method-registrator.gen';
import { vsCodeSettingsManager } from './managers/VsCodeSettings.manager';
import { AbstractServiceAdapter } from './core/AbstractServiceAdapter';
import { getAppDisplayNameFromPackageJson, getAppNormalizedNameFromPackageJson } from './utils/utils-vscode';
import { workspaceInstallationManager } from './managers/WorkspaceInstallation.manager';
import { pythonScriptExecutionManager } from './managers/PythonScriptExecution.manager';

export let EXTENSION_BASE_CONFIG_NAME = 'to-define';
// To manage only one instance of the tool opened
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    EXTENSION_BASE_CONFIG_NAME = getAppNormalizedNameFromPackageJson(context);
    vsCodeSettingsManager.init(EXTENSION_BASE_CONFIG_NAME);
    // Associates the context with all services
    AbstractServiceAdapter.setContext(context);
    registerServices(context);

    workspaceInstallationManager.syncScripts(context);

    const openTool = () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Clean re-initialization sequence whenever webview is launched
        pythonScriptExecutionManager.killAll();
        vsCodeSettingsManager.init(EXTENSION_BASE_CONFIG_NAME);

        workspaceInstallationManager.syncScripts(context);

        const panel: vscode.WebviewPanel = createWebviewPanel(context);
        currentPanel = panel;

        managePanelRendering(panel, context);
        manageBackendServices(panel, context);
        const saveListener = manageSaveFileInVsCodeEditor(panel, context);
        manageDisposedWebviewPanel(panel, saveListener);

        panel.webview.html = getWebviewContent(panel, context);
    };

    const disposable = vscode.commands.registerCommand(`${EXTENSION_BASE_CONFIG_NAME}.openTool`, openTool);
    context.subscriptions.push(disposable);

    logInfo('Extension activated successfully.');
}

function createWebviewPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
        EXTENSION_BASE_CONFIG_NAME,
        getAppDisplayNameFromPackageJson(context),
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
    return panel;
}

function managePanelRendering(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    if (vsCodeSettingsManager.getSettings().pinApplication !== false) {
        logInfo(`pinApplication = ${vsCodeSettingsManager.getSettings().pinApplication}`);
        vscode.commands.executeCommand('workbench.action.pinEditor');
    }

    panel.iconPath = {
        light: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png'),
        dark: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png')
    };
}

function manageBackendServices(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    // Associates the new active panel with all services
    AbstractServiceAdapter.setWebviewPanel(panel);

    const rpc = new RpcProtocol((msg) => panel.webview.postMessage(msg));
    registerRpcMethods(rpc);

    panel.webview.onDidReceiveMessage((msg) => rpc.receive(msg), undefined, context.subscriptions);
}

function manageDisposedWebviewPanel(panel: vscode.WebviewPanel, saveListener: vscode.Disposable) {
    panel.onDidDispose(() => {
        logInfo('Webview panel disposed.');
        saveListener.dispose();
        pythonScriptExecutionManager.killAll();
        AbstractServiceAdapter.setWebviewPanel(undefined);
        currentPanel = undefined;
    });
}

function manageSaveFileInVsCodeEditor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): vscode.Disposable {
    const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.uri.scheme !== 'file') return;
        const relativePath = vscode.workspace.asRelativePath(document.uri);
        logInfo(`File saved: ${relativePath}. Triggering delta scan.`);
        //runPythonScan(context, panel, "delta", relativePath);
    });
    context.subscriptions.push(saveListener);

    return saveListener;
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): string {
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
