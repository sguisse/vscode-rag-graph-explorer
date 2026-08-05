import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { VsCodeSettings } from './backend/services/vscode/domain/model/VsCodeSettings';
import { logInfo, logError, initializeBackendLogger } from './backend/services/vscode/utils/utils-backend-log';
import { getAppName, initializeDefaultServices, initializeVsCodeSettings } from '@/services/WebviewInitializerService';
import { handleWebviewMessage } from '@/services/WebviewMessagingService';

const EXTENTION_BASE_CONFIG_NAME = 'tokenRazor';

export function activate(context: vscode.ExtensionContext) {
  try {
    const appName = getAppName(context);
    initializeBackendLogger();
    initializeDefaultServices();
    initializeVsCodeSettings(context);
    logInfo(`Extension ${EXTENTION_BASE_CONFIG_NAME} activating...`);

    const disposable = vscode.commands.registerCommand(
      `${EXTENTION_BASE_CONFIG_NAME}.openTool`,
      () => openToolCommand(context)
    );
    context.subscriptions.push(disposable);

    logInfo(`Extension ${EXTENTION_BASE_CONFIG_NAME} activation complete.`);
  } catch (err) {
    logError(`Activation error: ${err}`, err);
  }
}

function openToolCommand(context: vscode.ExtensionContext): void {
  const packageData = context.extension.packageJSON;
  const panel = vscode.window.createWebviewPanel(
    EXTENTION_BASE_CONFIG_NAME,
    packageData.displayName,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'dist')),
        vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))
      ],
      portMapping: [{ webviewPort: 5173, hostPort: 5173 }]
    }
  );

  if (VsCodeSettings.get('pinApplication') !== false) {
    vscode.commands.executeCommand('workbench.action.pinEditor');
  }

  panel.webview.html = getWebviewContent(context, panel.webview);

  const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.uri.scheme !== 'file') return;
    const relativePath = vscode.workspace.asRelativePath(document.uri);
    logInfo(`File saved: ${relativePath}. Triggering delta scan.`);
  });
  context.subscriptions.push(saveListener);

  panel.onDidDispose(() => {
    logInfo('Webview panel disposed.');
    saveListener.dispose();
  });

  // Centralized webview message routing
  panel.webview.onDidReceiveMessage((event) => {
    handleWebviewMessage(event, panel, context);
  });

  panel.webview.postMessage({ command: 'ready' });
}


function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
  const isDev = context.extensionMode === vscode.ExtensionMode.Development;

  const distDir = path.join(context.extensionPath, 'dist', 'webview');
  let htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    const nestedPath = path.join(distDir, 'src', 'webview', 'index.html');
    if (fs.existsSync(nestedPath)) {
      htmlPath = nestedPath;
    }
  }

  if (isDev) {
    const devServerUrl = 'http://127.0.0.1:5173';

    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ws://127.0.0.1:5173 http://127.0.0.1:5173 https: http: vscode-webview: vscode-resource:; img-src http://127.0.0.1:5173 ${webview.cspSource} vscode-webview: vscode-resource: https: http: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173 vscode-webview: vscode-resource:; style-src 'unsafe-inline' http://127.0.0.1:5173 vscode-webview: vscode-resource: https: http:; font-src http://127.0.0.1:5173 vscode-webview: vscode-resource: https: http: data:;">`;

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
      <script type="module" src="${devServerUrl}/src/webview/index.tsx"></script>
    </body>
    </html>`;
  }

  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const nonce = getNonce();
    const assetBaseDir = path.dirname(htmlPath);

    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: http: data: blob:; script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-inline'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource} https: http: data:; connect-src ${webview.cspSource} https: http:;">`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n    ${cspMeta}`);
    } else {
      html = cspMeta + html;
    }

    html = html.replace(/<script /g, `<script nonce="${nonce}" `);

    html = html.replace(/(src|href)="([^"]+)"/g, (match, attr, srcPath) => {
      if (srcPath.startsWith('http://') || srcPath.startsWith('https://') || srcPath.startsWith('data:')) {
        return match;
      }
      const cleanPath = srcPath.replace(/^[\/\.]+/g, '');
      const fileUri = vscode.Uri.file(path.join(assetBaseDir, cleanPath));
      const webviewUri = webview.asWebviewUri(fileUri);
      return `${attr}="${webviewUri}"`;
    });

    return html;
  }

  return `<!DOCTYPE html>
  <html>
    <body style="color: white; font-family: sans-serif; padding: 20px;">
      <h2>🪒 Token Razor</h2>
      <p>Webview bundle not found at ${htmlPath}. Please run <code>npm run compile</code>.</p>
    </body>
  </html>`;
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
