#!/bin/bash

# Ensure target environment directories exist
mkdir -p src src/webview/components

# 1. Update package.json to append the new configuration properties with their default specifications
cat << 'EOF' > package.json
{
  "name": "graph-rag-explorer",
  "license": "MIT",
  "displayName": "Graph RAG Explorer",
  "description": "Expert Node Navigator and Architecture Explorer via RAG and Gemini",
  "version": "1.0.0",
  "publisher": "sguisse",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "graphRagExplorer.openTool",
        "title": "Graph RAG Explorer --> 🕸️ Open UI"
      }
    ],
    "menus": {
      "editor/title": [
        {
          "command": "graphRagExplorer.openTool",
          "group": "navigation"
        }
      ],
      "explorer/context": [
        {
          "command": "graphRagExplorer.openTool",
          "group": "navigation@0"
        }
      ]
    },
    "configuration": {
      "title": "🕸️Graph RAG Explorer",
      "properties": {
        "graphRagExplorer.EntitiesTypesList": {
          "type": "array",
          "description": "List of predefined entity types for the graph exploration.",
          "items": {
            "type": "string"
          },
          "default": [
            "file",
            "class",
            "method",
            "document"
          ]
        },
        "graphRagExplorer.regexFilterEnabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Regex matching in the filter bar by default."
        },
        "graphRagExplorer.TreeFilterEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Apply search filters on the Tree View by default."
        },
        "graphRagExplorer.geminiApiKey": {
          "type": "string",
          "default": "",
          "description": "API Key for Gemini Assistant analysis."
        },
        "graphRagExplorer.tooltipDelay": {
          "type": "number",
          "default": 2000,
          "description": "Delay in milliseconds before showing the custom tooltips on hover."
        },
        "graphRagExplorer.pinFilesExporter": {
          "type": "boolean",
          "default": true,
          "description": "Automatically pin the Graph RAG Explorer UI tab when opened to prevent it from being overwritten or closed as a preview tab."
        },
        "graphRagExplorer.graphLegendEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Display the visual topological legend by default upon launch."
        },
        "graphRagExplorer.defaultCallersDepth": {
          "type": "number",
          "default": 1,
          "description": "Default callers upstream lookup relationship parsing depth."
        },
        "graphRagExplorer.defaultCalleesDepth": {
          "type": "number",
          "default": 1,
          "description": "Default callees downstream lookup relationship parsing depth."
        }
      }
    }
  },
  "scripts": {
    "compile": "webpack",
    "watch": "webpack --watch",
    "package": "webpack --mode production",
    "vscode:prepublish": "npm run package"
  },
  "devDependencies": {
    "@types/mocha": "^10.0.10",
    "@types/node": "^18.19.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/vscode": "^1.80.0",
    "css-loader": "^6.8.1",
    "style-loader": "^3.3.3",
    "ts-loader": "^9.4.3",
    "typescript": "^5.1.3",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.4"
  },
  "dependencies": {
    "@primer/octicons-react": "^19.28.1",
    "@vscode/vsce": "^3.9.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vis-network": "^9.1.6"
  }
}
EOF

# 2. Update src/extension.ts to capture and stream the new workspace options down to the Webview bridge
cat << 'EOF' > src/extension.ts
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
            defaultCallersDepth: config.get('defaultCallersDepth') ?? 1,
            defaultCalleesDepth: config.get('defaultCalleesDepth') ?? 1
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
EOF

# 3. Patch src/webview/App.tsx to intercept the new options and feed them into the default states of ExplorerTab hooks
cat << 'EOF' > src/webview/App.tsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExplorationFilters } from './components/ExplorationFilters';
import { TabsNavigation } from './components/TabsNavigation';
import { ExplorerTab } from './components/ExplorerTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { ConfigurationTab } from './components/ConfigurationTab';
import { GraphNode, GraphEdge } from './types';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
(window as any).vscodeApi = vscode;

export const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [activeTab, setActiveTab] = useState<string>('explorer');
    const [config, setConfig] = useState<any>({
        EntitiesTypesList: ['file', 'class', 'method', 'document'],
        regexFilterEnabled: false,
        TreeFilterEnabled: true,
        geminiApiKey: '',
        tooltipDelay: 2000,
        graphLegendEnabled: true,
        defaultCallersDepth: 1,
        defaultCalleesDepth: 1
    });

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchMode, setSearchMode] = useState<string>('contains');
    const [searchText, setSearchText] = useState<string>('');
    const [isRegexEnabled, setIsRegexEnabled] = useState<boolean>(false);
    const [applyOnTree, setApplyOnTree] = useState<boolean>(true);
    const [applyOnGraph, setApplyOnGraph] = useState<boolean>(false);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'setConfig') {
                setConfig(message.command === 'setConfig' ? message.config : message.config);
                setIsRegexEnabled(message.config.regexFilterEnabled);
                setApplyOnTree(message.config.TreeFilterEnabled);
            }
        });
        vscode.postMessage({ command: 'ready' });
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    }, [theme]);

    // Custom Tooltip Tracker Hook synchronized with workspace tooltipDelay configurations
    useEffect(() => {
        const tooltipEl = document.getElementById('global-cursor-tooltip');
        let tooltipTimeout: NodeJS.Timeout | null = null;
        let activeTarget: Element | null = null;

        const positionTooltipAtCursor = (e: MouseEvent, el: HTMLElement) => {
            const mouseX = e.clientX, mouseY = e.clientY, offset = 15;
            const rect = el.getBoundingClientRect();
            let targetTop = mouseY - (rect.height / 2);
            if (targetTop < 5) targetTop = 5;
            if (targetTop + rect.height > window.innerHeight - 5) targetTop = window.innerHeight - rect.height - 5;
            el.style.top = `${targetTop}px`;
            if (mouseX + offset + rect.width > window.innerWidth) el.style.left = `${mouseX - rect.width - offset}px`;
            else el.style.left = `${mouseX + offset}px`;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const target = (e.target as Element).closest('[data-tooltip]');
            if (target) {
                if (activeTarget !== target) {
                    activeTarget = target;
                    if (tooltipTimeout) clearTimeout(tooltipTimeout);
                    if (tooltipEl) tooltipEl.style.display = 'none';
                    tooltipTimeout = setTimeout(() => {
                        if (tooltipEl && activeTarget) {
                            tooltipEl.innerHTML = activeTarget.getAttribute('data-tooltip') || '';
                            tooltipEl.style.display = 'block';
                            positionTooltipAtCursor(e, tooltipEl);
                        }
                    }, config.tooltipDelay ?? 2000);
                } else {
                    if (tooltipEl && tooltipEl.style.display === 'block') positionTooltipAtCursor(e, tooltipEl);
                }
            } else {
                if (activeTarget) {
                    activeTarget = null;
                    if (tooltipTimeout) clearTimeout(tooltipTimeout);
                    if (tooltipEl) tooltipEl.style.display = 'none';
                }
            }
        };

        document.body.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.body.removeEventListener('mousemove', handleMouseMove);
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
        };
    }, [config.tooltipDelay]);

    const handleGraphLoad = (data: { nodes: any[]; links: any[] }) => {
        const parsedNodes: GraphNode[] = (data.nodes || []).map(n => {
            let group = 'class';
            const label = n.label || n.id || '';
            if (label.includes('()')) group = 'method';
            else if (label.match(/\.(ts|js|py|json|md|sh|mjs|html|css)$/i)) group = 'file';
            if (n.file_type === 'document' || n.file_type === 'rationale') group = 'document';
            return { id: String(n.id), label, group, source_file: n.source_file, source_location: n.source_location };
        });

        const parsedEdges: GraphEdge[] = (data.links || []).map(l => ({
            from: String(l.source),
            to: String(l.target),
            type: l.relation || 'relation'
        }));

        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setSelectedNodeIds(new Set());
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden text-[var(--vscode-foreground)] bg-[var(--vscode-editor-background)]">
            <Header
                theme={theme}
                toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                onGraphLoaded={handleGraphLoad}
                nodes={nodes}
                selectedNodeIds={selectedNodeIds}
            />

            <main className="flex-1 flex flex-col min-h-0">
                <ExplorationFilters
                    typesList={config.EntitiesTypesList || ['file', 'class', 'method', 'document']}
                    selectedTypes={selectedTypes}
                    setSelectedTypes={setSelectedTypes}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    isRegexEnabled={isRegexEnabled}
                    setIsRegexEnabled={setIsRegexEnabled}
                    applyOnTree={applyOnTree}
                    setApplyOnTree={setApplyOnTree}
                    applyOnGraph={applyOnGraph}
                    setApplyOnGraph={setApplyOnGraph}
                />

                <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="flex-1 relative min-h-0">
                    <div className={activeTab === 'explorer' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ExplorerTab
                            nodes={nodes}
                            edges={edges}
                            selectedNodeIds={selectedNodeIds}
                            setSelectedNodeIds={setSelectedNodeIds}
                            filters={{ selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph }}
                            config={config}
                        />
                    </div>
                    <div className={activeTab === 'ai' ? 'absolute inset-0 flex' : 'hidden'}>
                        <AIAssistantTab
                            nodes={nodes}
                            edges={edges}
                            selectedNodeIds={selectedNodeIds}
                            apiKey={config.geminiApiKey}
                        />
                    </div>
                    <div className={activeTab === 'config' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ConfigurationTab config={config} />
                    </div>
                </div>
            </main>
        </div>
    );
};
EOF

# 4. Patch ExplorerTab.tsx to use incoming workspace settings properties during component state instantiation hooks
cat << 'EOF' > patch_explorer_tab_config.js
const fs = require('fs');
const filePath = 'src/webview/components/ExplorerTab.tsx';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Update Props interface mapping to receive the global config payload context
    content = content.replace(
        'filters: any;',
        'filters: any;\n    config?: any;'
    );
    content = content.replace(
        'nodes, edges, selectedNodeIds, setSelectedNodeIds, filters\n}) => {',
        'nodes, edges, selectedNodeIds, setSelectedNodeIds, filters, config\n}) => {'
    );

    // Swap static state values with properties values driven directly by workspace settings
    content = content.replace(
        'const [showLegend, setShowLegend] = useState<boolean>(true);',
        'const [showLegend, setShowLegend] = useState<boolean>(config?.graphLegendEnabled ?? true);'
    );
    content = content.replace(
        'const [parentDepth, setParentDepth] = useState<number>(0);',
        'const [parentDepth, setParentDepth] = useState<number>(config?.defaultCallersDepth ?? 1);'
    );
    content = content.replace(
        'const [childDepth, setChildDepth] = useState<number>(0);',
        'const [childDepth, setChildDepth] = useState<number>(config?.defaultCalleesDepth ?? 1);'
    );

    // Add a useEffect handler to listen and re-sync states if config changes dynamically inside the parent layer
    const effectSync = `
    useEffect(() => {
        if (config) {
            setShowLegend(config.graphLegendEnabled ?? true);
            setParentDepth(config.defaultCallersDepth ?? 1);
            setChildDepth(config.defaultCalleesDepth ?? 1);
        }
    }, [config]);`;

    content = content.replace(
        'const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());',
        'const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());' + effectSync
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ ExplorerTab.tsx successfully patched with workspace initialization setting constraints.');
}
EOF

node patch_explorer_tab_config.js
rm patch_explorer_tab_config.js

echo "✅ Script parameters applied! 'graphLegendEnabled', 'defaultCallersDepth', and 'defaultCalleesDepth' settings parameters are fully functional!"
