#!/usr/bin/env bash
set -e

# Ensure required directories exist
mkdir -p webview
mkdir -p backend/src
mkdir -p webview/src
mkdir -p webview/src/services

# 1. Update webview/vite.config.ts with Private Network Access & CORS headers
cat << 'EOF' > webview/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@assets': path.resolve(import.meta.dirname, '../assets'),
      '@/shared': path.resolve(import.meta.dirname, '../shared'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true',
    },
    origin: 'http://127.0.0.1:5173',
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws',
    },
  },
  build: {
    outDir: '../dist-webview',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  }
});
EOF

# 2. Update backend/src/extension.ts to allow Vite HMR and local server endpoints in CSP
cat << 'EOF' > backend/src/extension.ts
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
            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ws://127.0.0.1:5173 http://127.0.0.1:5173 ws://localhost:5173 http://localhost:5173 https: http: vscode-webview: vscode-resource:; img-src http://127.0.0.1:5173 http://localhost:5173 ${panel.webview.cspSource} vscode-webview: vscode-resource: https: http: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173 http://localhost:5173 vscode-webview: vscode-resource:; style-src 'unsafe-inline' http://127.0.0.1:5173 http://localhost:5173 vscode-webview: vscode-resource: https: http:; font-src http://127.0.0.1:5173 http://localhost:5173 vscode-webview: vscode-resource: https: http: data:;">`;

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
EOF

# 3. Update webview/src/services/api.service.ts for safe VS Code API acquisition
cat << 'EOF' > webview/src/services/api.service.ts
import { RpcProtocol } from '@/shared/rpc';
import { IExtensionServices } from '@/shared/services.interface';

function getVsCodeApi() {
    if (!(window as any)._vscodeApi) {
        if (typeof acquireVsCodeApi === 'function') {
            (window as any)._vscodeApi = acquireVsCodeApi();
        } else if ((window as any).vscodeApi) {
            (window as any)._vscodeApi = (window as any).vscodeApi;
        }
    }
    return (window as any)._vscodeApi;
}

class ApiService implements IExtensionServices {
    private rpc: RpcProtocol;

    constructor() {
        const vscodeApi = getVsCodeApi();
        this.rpc = new RpcProtocol((msg) => {
            if (vscodeApi) {
                vscodeApi.postMessage(msg);
            } else {
                console.warn('[ApiService] VS Code API unavailable for message:', msg);
            }
        });

        window.addEventListener('message', (event) => {
            this.rpc.receive(event.data);
        });
    }

    public async runPythonAnalysis(userId: string): Promise<string> {
        return await this.rpc.call('runPythonAnalysis', userId);
    }

    public async logMessage(level: 'info' | 'warn' | 'error', text: string, details?: any): Promise<void> {
        return await this.rpc.call('logMessage', level, text, details);
    }
}

export const apiService = new ApiService();
EOF

# 4. Update webview/src/App.tsx to safely log message after mount
cat << 'EOF' > webview/src/App.tsx
import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { apiService } from '@/services/api.service';

export default function App() {
  useEffect(() => {
    apiService.logMessage('info', 'App.tsx loaded', { timestamp: new Date().toISOString() }).catch((error) => {
      console.error('Failed to log message:', error);
    });
  }, []);

  const contextStore = typeof useAppContextStore === 'function' ? useAppContextStore() : ({} as any);
  const layoutStore = typeof useLayoutStore === 'function' ? useLayoutStore() : ({} as any);

  const activeFeature = contextStore.activeFeature || 'feature-home';
  const setActiveFeature = contextStore.setActiveFeature;
  const isDarkMode = contextStore.isDarkMode;
  const setIsDarkMode = contextStore.setIsDarkMode;
  const notification = contextStore.notification;
  const containers = layoutStore.containers || [];

  return (
    <>
      {(activeFeature === 'feature-home') && HomeFeature && <HomeFeature />}
      {(activeFeature === 'feature-graph-rag-explorer') && ExplorerFeature && <ExplorerFeature />}
      {(activeFeature === 'feature-layout-demo') && LayoutDemoFeature && <LayoutDemoFeature />}
      {(activeFeature === 'feature-rules') && RulesFeature && <RulesFeature />}
      {(activeFeature === 'feature-help') && HelpFeature && <HelpFeature />}

      {AppLayout && (
        <AppLayout
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          notification={notification}
          layoutContainers={containers}
        />
      )}
    </>
  );
}
EOF

npm run compile
echo "✅ fix: Added Private Network Access headers to Vite dev server, updated Webview CSP rules, and fixed VS Code API acquisition!"
