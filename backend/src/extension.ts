import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RpcProtocol } from '../../shared/rpc/rpc-protocol';
import { logError, logInfo, logWarn } from './utils/utils-log';
import { registerServices } from './config/service-registrator.gen';
import { registerRpcMethods } from './config/rpc-method-registrator.gen';
import { vsCodeSettingsManager } from './managers/VsCodeSettings.manager';
import { getAppDisplayNameFromPackageJson, getAppNormalizedNameFromPackageJson, getWorkspaceRoot } from './utils/utils-vscode';
import { workspaceInstallationManager } from './managers/WorkspaceInstallation.manager';
import { pythonScriptExecutionManager } from './managers/PythonScriptExecution.manager';

export let EXTENSION_BASE_CONFIG_NAME: string;
export let currentWebviewPanel: vscode.WebviewPanel | undefined = undefined;
export let currentExtensionContext: vscode.ExtensionContext | undefined = undefined;
let activeChildProcess: any = null;

export function activate(extentionContext: vscode.ExtensionContext) {
    currentExtensionContext = extentionContext;
    EXTENSION_BASE_CONFIG_NAME = getAppNormalizedNameFromPackageJson(extentionContext);
    vsCodeSettingsManager.init(EXTENSION_BASE_CONFIG_NAME);
    registerServices(extentionContext);

    workspaceInstallationManager.syncScripts(extentionContext);

    const openTool = () => {
        if (currentWebviewPanel) {
            currentWebviewPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        pythonScriptExecutionManager.killAll();
        vsCodeSettingsManager.init(EXTENSION_BASE_CONFIG_NAME);
        workspaceInstallationManager.syncScripts(extentionContext);

        const webviewPanel: vscode.WebviewPanel = createWebviewPanel(extentionContext);
        currentWebviewPanel = webviewPanel;

        managePanelRendering(webviewPanel, extentionContext);
        manageBackendServices(webviewPanel, extentionContext);
        const saveListener = manageSaveFileInVsCodeEditor(webviewPanel, extentionContext);
        manageDisposedWebviewPanel(webviewPanel, saveListener);

        webviewPanel.webview.html = getWebviewContent(webviewPanel, extentionContext);

        // Set custom context to TRUE when the panel is created
        vscode.commands.executeCommand('setContext', 'tokenRazor.isToolOpened', true);

        runPythonScan("deep");
    };

    const addFromExplorer = (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        let paths: string[] = [];
        if (uris && uris.length > 0) {
            paths = uris.map((u) => u.fsPath);
        } else if (uri) {
            paths = [uri.fsPath];
        } else if (vscode.window.activeTextEditor) {
            paths = [vscode.window.activeTextEditor.document.uri.fsPath];
        }

        const selectedPath = paths.join('\n');
        logInfo(`Add from explorer command triggered for path(s):\n${selectedPath}`);

        if (!currentWebviewPanel) {
            openTool();
        } else {
            currentWebviewPanel.reveal(vscode.ViewColumn.One);
        }

        if (currentWebviewPanel && selectedPath) {
            currentWebviewPanel.webview.postMessage({
                command: 'selectedPath',
                payload: selectedPath
            });
        }
    };

    const disposableOpen = vscode.commands.registerCommand(`${EXTENSION_BASE_CONFIG_NAME}.openTool`, openTool);
    extentionContext.subscriptions.push(disposableOpen);

    const primaryCmd = `${EXTENSION_BASE_CONFIG_NAME}.graphRagExplorer.addFromExplorer`;
    const disposableAdd = vscode.commands.registerCommand(primaryCmd, addFromExplorer);
    extentionContext.subscriptions.push(disposableAdd);

    if (primaryCmd !== 'tokenRazor.graphRagExplorer.addFromExplorer') {
        const disposableAddFallback = vscode.commands.registerCommand('tokenRazor.graphRagExplorer.addFromExplorer', addFromExplorer);
        extentionContext.subscriptions.push(disposableAddFallback);
    }

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
            localResourceRoots: [context.extensionUri],
            portMapping: [{ webviewPort: 5173, extensionHostPort: 5173 }]
        }
    );
    return panel;
}

function managePanelRendering(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    pinPanelIfEnabled();

    panel.iconPath = {
        light: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png'),
        dark: vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png')
    };
}

function pinPanelIfEnabled() {
    if (vsCodeSettingsManager.getSettings().pinApplication !== false) {
        logInfo(`pinApplication = ${vsCodeSettingsManager.getSettings().pinApplication}`);
        vscode.commands.executeCommand('workbench.action.pinEditor');
    }
}

function manageBackendServices(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    const rpc = new RpcProtocol((msg) => panel.webview.postMessage(msg));
    registerRpcMethods(rpc);

    panel.webview.onDidReceiveMessage((msg) => rpc.receive(msg), undefined, context.subscriptions);
}

function manageDisposedWebviewPanel(panel: vscode.WebviewPanel, saveListener: vscode.Disposable) {
    panel.onDidDispose(() => {
        logInfo('Webview panel disposed.');
        saveListener.dispose();
        pythonScriptExecutionManager.killAll();
        currentWebviewPanel = undefined;
        vscode.commands.executeCommand('setContext', 'tokenRazor.isToolOpened', false);
    });
}

function manageSaveFileInVsCodeEditor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): vscode.Disposable {
    const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.uri.scheme !== 'file') return;
        const relativePath = vscode.workspace.asRelativePath(document.uri);
        logInfo(`File saved: ${relativePath}. Triggering delta scan.`);
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
  <script type="module" src="${devServerUrl}/src/index.tsx"></script>
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

function runPythonScan(mode: string, targetFile: string = "") {
    logInfo('runPythonScan Start ...');
    const workspaceRoot = getWorkspaceRoot();
    const backendScriptsPath: string = vsCodeSettingsManager.getSettings().backendWorkspacePath;
    const targetDir4Scripts = path.join(workspaceRoot, backendScriptsPath, "scripts");
    const runnerScript = path.join(targetDir4Scripts, "graph_rag_explorer", "main.py");

    if (!fs.existsSync(runnerScript)) {
        logError(`[PythonScan] Target script not found at path: ${runnerScript}`);
        return;
    }

    const parseLogLine = (line: string, fallbackLevel: 'debug' | 'info' | 'warn' | 'error') => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        let level = fallbackLevel;
        if (cleanLine.includes("🪲") || cleanLine.includes("[DEBUG]")) level = "debug";
        else if (cleanLine.includes("⚠️") || cleanLine.includes("[WARN]")) level = "warn";
        else if (cleanLine.includes("❌") || cleanLine.includes("[ERROR]")) level = "error";
        else if (cleanLine.includes("ℹ️") || cleanLine.includes("[INFO]") || cleanLine.includes("✅")) level = "info";

        if (level === "error") logError(`[Python] ${cleanLine}`);
        else if (level === "warn") logWarn(`[Python] ${cleanLine}`);
        else logInfo(`[Python] ${cleanLine}`);
    };

    const payloadConfig = vsCodeSettingsManager.toJson();
    if (!payloadConfig[EXTENSION_BASE_CONFIG_NAME]) {
        payloadConfig[EXTENSION_BASE_CONFIG_NAME] = {};
    }
    payloadConfig[EXTENSION_BASE_CONFIG_NAME]["workspaceRoot"] = workspaceRoot;

    if (activeChildProcess?.pid) {
        pythonScriptExecutionManager.killPid(activeChildProcess.pid);
    }

    let stderrBuffer = '';

    const child = pythonScriptExecutionManager.executeScript(
        runnerScript,
        [],
        { cwd: workspaceRoot }
    );
    activeChildProcess = child;

    child.stdin?.write(JSON.stringify(payloadConfig));
    child.stdin?.end();

    child.stdout?.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "info")));
    child.stderr?.on("data", (data: any) => {
        const str = data.toString();
        stderrBuffer += str;
        str.split("\n").forEach((l: string) => parseLogLine(l, "error"));
    });

    child.on("close", (code: number | null, signal: string | null) => {
        if (activeChildProcess === child) activeChildProcess = null;
        if (code === 0) {
            logInfo('[PythonScan] Python background process completed successfully.');
            const finalUiPayloadPath = path.join(workspaceRoot, backendScriptsPath, "target", "ui_outputs", "graph-ui-payload.json");
            if (fs.existsSync(finalUiPayloadPath)) {
                try {
                    const rawPayload = JSON.parse(fs.readFileSync(finalUiPayloadPath, "utf-8"));
                } catch (err) {
                    logError(`[PythonScan] Failed to parse UI payload JSON structure: ${err}`, err);
                }
            }
        } else if (signal) {
            logWarn(`[PythonScan] Process terminated by signal ${signal}.`);
        } else {
            logError(`[PythonScan] Process exited with non-zero exit code: ${code}. Target script: ${runnerScript}. Stderr context: ${stderrBuffer.trim()}`);
        }
    });

    logInfo('runPythonScan Finished !!!');
}
