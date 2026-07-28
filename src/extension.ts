import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('graphRagExplorer.openTool', () => {
    const panel = vscode.window.createWebviewPanel(
      'graphRagExplorer',
      '🕸️ Graph RAG Explorer',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))],
        portMapping: [
          { webviewPort: 5173, hostPort: 5173 }
        ]
      }
    );

    panel.webview.html = getWebviewContent(context, panel.webview);
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
  const isDev = context.extensionMode === vscode.ExtensionMode.Development;

  if (isDev) {
    const devServerUrl = 'http://127.0.0.1:5173';

    // Explicitly allow data: and devServerUrl for images in the CSP
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} ${devServerUrl} https: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' ${devServerUrl}; style-src 'unsafe-inline' ${devServerUrl}; connect-src ${devServerUrl} ws://127.0.0.1:5173; font-src ${webview.cspSource} ${devServerUrl} https: data:;">`;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      ${cspMeta}
      <script type="module">
        import RefreshRuntime from '${devServerUrl}/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <script type="module" src="${devServerUrl}/@vite/client"></script>
    </head>
    <body style="margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background-color: transparent;">
      <div id="root"></div>
      <script type="module" src="${devServerUrl}/index.tsx"></script>
    </body>
    </html>`;
  }

  // --- Production build logic ---
  const distDir = path.join(context.extensionPath, 'dist', 'webview');
  let htmlPath = path.join(distDir, 'index.html');
  let assetBaseDir = distDir;

  if (!fs.existsSync(htmlPath)) {
    const nestedPath = path.join(distDir, 'src', 'webview', 'index.html');
    if (fs.existsSync(nestedPath)) {
      htmlPath = nestedPath;
      assetBaseDir = path.join(distDir, 'src', 'webview');
    }
  }

  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const nonce = getNonce();

    // Ensure data: is allowed in production for Base64 inlined images
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data: blob:; script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-eval'; style-src ${webview.cspSource} 'unsafe-inline' https:; font-src ${webview.cspSource} https: data:;">`;

    let inlineCss = '';
    const assetsDir = path.join(assetBaseDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
      for (const cssFile of cssFiles) {
        const fullCssPath = path.join(assetsDir, cssFile);
        let rawCss = fs.readFileSync(fullCssPath, 'utf8');

        rawCss = rawCss.replace(/url\((["']?)([^"')]+)\1\)/g, (m, quote, urlPath) => {
          if (urlPath.startsWith('data:') || urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return m;
          }
          const cleanUrl = urlPath.replace(/^[\/\.]+/g, '');
          const fileUri = vscode.Uri.file(path.join(assetsDir, cleanUrl));
          const wUri = webview.asWebviewUri(fileUri);
          return `url("${wUri}")`;
        });

        inlineCss += `\n<style>\n${rawCss}\n</style>\n`;
      }
    }

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n    ${cspMeta}\n${inlineCss}`);
    } else {
      html = cspMeta + inlineCss + html;
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
      <h2>🕸️ Graph RAG Explorer</h2>
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
