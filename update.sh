#!/usr/bin/env bash
set -e

# Fix Webview Image/Icon Loading Issues:
# 1. Configured Vite `server.origin: 'http://127.0.0.1:5173'` so Vite Dev Server prefixes all asset imports
#    with the absolute URL instead of relative paths (preventing vscode-webview:// 403 Forbidden errors).
# 2. Increased `assetsInlineLimit` in Vite build config to automatically convert production images into Base64 Data URIs.
# 3. Updated `src/extension.ts` CSP (`img-src`) and `localResourceRoots` to allow loading local assets in both Dev and Prod modes.

mkdir -p src/webview

cat << 'EOF' > vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@/backend': resolve(__dirname, 'src/backend'),
      '@/common': resolve(__dirname, 'src/common'),
      '@': resolve(__dirname, 'src/webview')
    }
  },
  base: command === 'serve' ? 'http://127.0.0.1:5173/' : './',
  build: {
    outDir: 'dist/webview',
    emptyOutDir: true,
    // Inline images up to 10MB as Base64 Data URIs for standalone production webviews
    assetsInlineLimit: 10485760,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/webview/index.html')
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
    // CRITICAL FOR VS CODE WEBVIEWS: Force Vite dev server to prefix all asset imports
    // with http://127.0.0.1:5173 so the webview doesn't try to fetch them from vscode-webview:// (403 Forbidden)
    origin: 'http://127.0.0.1:5173',
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws'
    }
  }
}));
EOF

cat << 'EOF' > src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { VsCodeSettings } from './common/VsCodeSettings';
import { initializeDefaultServices, initializeVsCodeSettings } from './webview/services/WebviewInitializerService';
import { logInfo } from './common/utils/utils-log';
import { handleWebviewMessage } from './webview/services/WebviewMessagingService';

const EXTENTION_BASE_CONFIG_NAME = 'tokenRazor';

export function activate(context: vscode.ExtensionContext) {
    initializeVsCodeSettings(context);
    initializeDefaultServices(context);

    const disposable = vscode.commands.registerCommand(`${EXTENTION_BASE_CONFIG_NAME}.openTool`, () => openToolCommand(context));

    context.subscriptions.push(disposable);
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
        portMapping: [
          { webviewPort: 5173, hostPort: 5173 }
        ]
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

    panel.webview.onDidReceiveMessage(async (message) => {
        await handleWebviewMessage(message, panel, context);
    });
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
EOF

if [ -f "package.json" ]; then
    npm run compile
fi

echo "✅ fix: Configured Vite server.origin and Base64 inlining to resolve Webview image/icon loading!"
