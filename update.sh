#!/bin/bash

# 1. Overwrite src/webview/components/Header.tsx to add the extension version tooltip and the requested ID
cat << 'EOF' > src/webview/components/Header.tsx
import React from 'react';
import { GraphNode } from '../types';
import { GraphService } from '../services/GraphService';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onGraphLoaded: (data: any) => void;
    nodes: GraphNode[];
    selectedNodeIds: Set<string>;
    version?: string;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onGraphLoaded, nodes, selectedNodeIds, version }) => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await GraphService.loadGraphDataFromFile(file);
            onGraphLoaded(data);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Invalid graph.json file.');
        }
    };

    return (
        <header className="z-40 relative flex flex-shrink-0 justify-between items-center bg-[var(--vscode-editor-background)] shadow-[0_2px_8px_var(--vscode-widget-shadow)] px-4 border-[var(--vscode-panel-border)] border-b h-12">

            {/* INJECTED ID AND TOOLTIP HERE */}
            <div id="extension-identity" className="flex items-center gap-3 cursor-default" data-tooltip={`Version ${version || '1.0.0'}`}>
                <div className="flex justify-center items-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-inner rounded-md w-7 h-7 font-bold text-white text-sm">G</div>
                <div>
                    <span className="block font-bold text-sm leading-tight tracking-wide">Graph RAG</span>
                    <span className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-widest">Expert Node Navigator</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className="hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1.5 rounded-md text-[var(--vscode-foreground)] transition-colors duration-200">
                    <span className={`codicon ${theme === 'dark' ? 'codicon-sun' : 'codicon-moon'}`}></span>
                </button>

                <div className="bg-[var(--vscode-panel-border)] mx-1 w-[1px] h-5" />

                <label className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 hover:from-blue-500 to-blue-500 hover:to-blue-400 shadow-md hover:shadow-lg px-3 py-1.5 rounded-md text-white text-xs transition-all duration-200 cursor-pointer">
                    <span className="codicon codicon-file-symlink-file"></span> Load graph.json
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
        </header>
    );
};
EOF

# 2. Overwrite src/webview/App.tsx to pass down the dynamic extensionVersion
cat << 'EOF' > src/webview/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ExplorationFilters } from './components/ExplorationFilters';
import { TabsNavigation } from './components/TabsNavigation';
import { ExplorerTab } from './components/ExplorerTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { ConfigurationTab } from './components/ConfigurationTab';
import { TerminalTab } from './components/TerminalTab';
import { GraphNode, GraphEdge } from './types';
import { GraphService } from './services/GraphService';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
(window as any).vscodeApi = vscode;

export const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [status, setStatus] = React.useState<'ready' | 'building' | 'error'>('ready');
    const [progress, setProgress] = React.useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const [activeTab, setActiveTab] = useState<string>('explorer');

    const [config, setConfig] = useState<any>({
        EntitiesTypesList: ['file', 'class', 'method', 'document'],
        regexFilterEnabled: false,
        TreeFilterEnabled: true,
        geminiApiKey: '',
        tooltipDelay: 2000,
        graphLegendEnabled: true,
        callersDepth: 1,
        calleesDepth: 1,
        extensionVersion: '1.0.0'
    });

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [logs, setLogs] = useState<Array<{ level: 'debug' | 'info' | 'warn' | 'error'; message: string; timestamp: string }>>([]);

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchMode, setSearchMode] = useState<string>('contains');
    const [searchText, setSearchText] = useState<string>('');
    const [isRegexEnabled, setIsRegexEnabled] = useState<boolean>(false);
    const [applyOnTree, setApplyOnTree] = useState<boolean>(true);
    const [applyOnGraph, setApplyOnGraph] = useState<boolean>(false);

    const activeFilters = useMemo(() => ({
        selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph
    }), [selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === 'setConfig') {
                setConfig(message.config);
                setIsRegexEnabled(message.config.regexFilterEnabled);
                setApplyOnTree(message.config.TreeFilterEnabled);
            } else if (message.command === 'updateGraphData') {
                handleGraphLoad(message.payload);
            } else if (message.command === 'blastRadiusReport') {
                window.dispatchEvent(new CustomEvent('blastRadiusReport', { detail: message.payload }));
            } else if (message.command === 'logTrace') {
                setLogs(prev => [...prev, message.payload]);

                const logMessage = message.payload.message || '';
                const progressMatch = logMessage.match(/Progression de l'analyse parallèle\s*:\s*(\d+)\/(\d+)/);
                if (progressMatch) {
                    setProgress({
                        current: parseInt(progressMatch[1], 10),
                        total: parseInt(progressMatch[2], 10)
                    });
                }
            } else if (message.command === 'updateStatus') {
                setStatus(message.payload);
                if (message.payload === 'building') {
                    setProgress({ current: 0, total: 0 });
                }
            }
        };

        window.addEventListener('message', handleMessage);
        vscode.postMessage({ command: 'ready' });

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    }, [theme]);

    useEffect(() => {
        const tooltipEl = document.getElementById('global-cursor-tooltip');
        let tooltipTimeout: NodeJS.Timeout | null = null;
        let activeTarget: Element | null = null;

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
                            let targetTop = e.clientY - 20;
                            tooltipEl.style.top = `${targetTop}px`;
                            tooltipEl.style.left = `${e.clientX + 15}px`;
                        }
                    }, config.tooltipDelay ?? 2000);
                } else if (tooltipEl && tooltipEl.style.display === 'block') {
                    tooltipEl.style.top = `${e.clientY - 20}px`;
                    tooltipEl.style.left = `${e.clientX + 15}px`;
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
        const { nodes: parsedNodes, edges: parsedEdges } = GraphService.buildGraph(data);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setSelectedNodeIds(new Set());
    };

    return (
        <div className="flex flex-col bg-[var(--vscode-editor-background)] w-screen h-screen overflow-hidden text-[var(--vscode-foreground)]">
            <Header
                theme={theme}
                toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                onGraphLoaded={handleGraphLoad}
                nodes={nodes}
                selectedNodeIds={selectedNodeIds}
                version={config.extensionVersion}
            />

            <main className="flex flex-col flex-1 min-h-0">
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

                <div className="relative flex-1 min-h-0">
                    <div className={activeTab === 'explorer' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ExplorerTab
                            nodes={nodes}
                            edges={edges}
                            selectedNodeIds={selectedNodeIds}
                            setSelectedNodeIds={setSelectedNodeIds}
                            filters={activeFilters}
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
                    <div className={activeTab === 'terminal' ? 'absolute inset-0 flex' : 'hidden'}>
                        <TerminalTab logs={logs} clearLogs={() => setLogs([])} />
                    </div>
                    <div className={activeTab === 'config' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ConfigurationTab config={config} />
                    </div>
                </div>
            </main>

            <Footer
                status={status}
                progress={progress}
                onKill={() => vscode.postMessage({ command: 'killAnalysis' })}
            />
        </div>
    );
};
EOF

# 3. Overwrite src/extension.ts to push the package.json version via the configuration payload
cat << 'EOF' > src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let activeChildProcess: any = null;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('graphRagExplorer.openTool', () => {
        const panel = vscode.window.createWebviewPanel(
            'graphRagExplorer', 'Graph RAG Explorer', vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
            }
        );

        const graphConfig = vscode.workspace.getConfiguration('graphRagExplorer');
        if (graphConfig.get('pinFilesExporter') !== false) {
            vscode.commands.executeCommand('workbench.action.pinEditor');
        }

        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

        const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.uri.scheme !== 'file') return;
            const relativePath = vscode.workspace.asRelativePath(document.uri);
            runPythonScan(context, panel, "delta", relativePath);
        });
        context.subscriptions.push(saveListener);

        panel.onDidDispose(() => {
            saveListener.dispose();
            if (activeChildProcess) {
                try { activeChildProcess.kill('SIGKILL'); } catch(e){}
                activeChildProcess = null;
            }
        });

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'ready') {
                sendConfig(panel, context);
                runPythonScan(context, panel, "deep");
            } else if (message.command === 'forceRefreshScan') {
                runPythonScan(context, panel, "deep");
            } else if (message.command === 'killAnalysis') {
                if (activeChildProcess) {
                    try { activeChildProcess.kill('SIGKILL'); } catch (err) {}
                    activeChildProcess = null;
                }
                panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
                panel.webview.postMessage({
                    command: "logTrace",
                    payload: { level: "warn", message: "❌ Active background analysis runtime process terminated immediately via user interface override request capsule.", timestamp: new Date().toLocaleTimeString() }
                });
            } else if (message.command === 'nodeSelected' && message.id) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const radiusPath = path.join(workspaceFolders[0].uri.fsPath, ".graph-rag-explorer", "code-graph", "blast_radius.json");
                    if (fs.existsSync(radiusPath)) {
                        try {
                            const report = JSON.parse(fs.readFileSync(radiusPath, "utf-8"));
                            panel.webview.postMessage({ command: 'blastRadiusReport', payload: report });
                        } catch(e){}
                    }
                }
                sendConfig(panel, context);
            } else if (message.command === 'publishToSharedList' && message.paths) {
                const filesExporterExt = vscode.extensions.getExtension('sguisse.files-exporter');
                if (filesExporterExt) {
                    if (!filesExporterExt.isActive) await filesExporterExt.activate();
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    const absolutePaths = message.paths.map((p: string) => {
                        if (path.isAbsolute(p)) return p;
                        return workspaceFolders && workspaceFolders.length > 0 ? path.join(workspaceFolders[0].uri.fsPath, p) : p;
                    });
                    if (filesExporterExt.exports && filesExporterExt.exports.appendExternalPaths) {
                        filesExporterExt.exports.appendExternalPaths(absolutePaths);
                        vscode.window.showInformationMessage(`${absolutePaths.length} absolute file(s) published successfully.`);
                    }
                }
            } else if (message.command === 'showNotification') {
                if (message.type === 'warn') vscode.window.showWarningMessage(message.text);
                else vscode.window.showInformationMessage(message.text);
            } else if (message.command === 'revealFile' && message.path) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const fullPath = path.isAbsolute(message.path) ? message.path : path.join(workspaceFolders[0].uri.fsPath, message.path);
                    if (!fs.existsSync(fullPath)) return;
                    const fileUri = vscode.Uri.file(fullPath);
                    if (message.openEditor !== false) {
                        vscode.workspace.openTextDocument(fileUri).then(doc => {
                            vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One, preserveFocus: true, preview: true });
                            vscode.commands.executeCommand('revealInExplorer', fileUri);
                        }, () => vscode.commands.executeCommand('revealInExplorer', fileUri));
                    } else {
                        vscode.commands.executeCommand('revealInExplorer', fileUri);
                    }
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}

function syncCoreScripts(context: vscode.ExtensionContext, workspaceRoot: string): boolean {
    const targetDir = path.join(workspaceRoot, ".graph-rag-explorer", "scripts");
    const versionFilePath = path.join(targetDir, "version.json");
    const currentVersion = context.extension.packageJSON.version;
    const graphConfig = vscode.workspace.getConfiguration("graphRagExplorer");
    let needsSync = graphConfig.get("forceScriptSync") === true || !fs.existsSync(targetDir) || !fs.existsSync(versionFilePath);

    if (!needsSync && fs.existsSync(versionFilePath)) {
        try {
            if (JSON.parse(fs.readFileSync(versionFilePath, "utf-8")).version !== currentVersion) needsSync = true;
        } catch (e) { needsSync = true; }
    }
    if (needsSync) {
        try {
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            const sourceDir = path.join(context.extensionPath, "scripts", "core");
            if (fs.existsSync(sourceDir)) {
                fs.readdirSync(sourceDir).forEach(file => {
                    const srcFile = path.join(sourceDir, file);
                    if (fs.statSync(srcFile).isFile()) fs.copyFileSync(srcFile, path.join(targetDir, file));
                });
            }
            fs.writeFileSync(versionFilePath, JSON.stringify({ version: currentVersion }), "utf-8");
        } catch (err) { return false; }
    }
    return true;
}

function runPythonScan(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, mode: string, targetFile: string = "") {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return;

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const graphConfig = vscode.workspace.getConfiguration("graphRagExplorer");
    const outputDir = path.join(workspaceRoot, ".graph-rag-explorer", "code-graph");
    const targetDir = path.join(workspaceRoot, ".graph-rag-explorer", "scripts");

    syncCoreScripts(context, workspaceRoot);
    panel.webview.postMessage({ command: "updateStatus", payload: "building" });

    const parseLogLine = (line: string, fallbackLevel: 'debug' | 'info' | 'warn' | 'error') => {
        let level: 'debug' | 'info' | 'warn' | 'error' = fallbackLevel;
        const cleanLine = line.trim();
        if (!cleanLine) return;

        if (cleanLine.includes("🪲") || cleanLine.includes("[DEBUG]")) level = "debug";
        else if (cleanLine.includes("⚠️") || cleanLine.includes("[WARN]")) level = "warn";
        else if (cleanLine.includes("❌") || cleanLine.includes("[ERROR]") || cleanLine.includes("CRITICAL")) level = "error";
        else if (cleanLine.includes("ℹ️") || cleanLine.includes("[INFO]") || cleanLine.includes("✅") || cleanLine.includes("[SUCCESS]")) level = "info";

        panel.webview.postMessage({
            command: "logTrace",
            payload: { level: level, message: cleanLine, timestamp: new Date().toLocaleTimeString() }
        });
    };

    const cp = require("child_process");
    const runnerScript = path.join(targetDir, "runner.py");
    let args = [runnerScript];
    if (mode === "deep") args.push("--workspace", workspaceRoot, "--output", outputDir);
    else args.push("--workspace", workspaceRoot, "--file", targetFile, "--output", outputDir);

    const payloadConfig = {
        includePathsRegex: graphConfig.get("includePathsRegex") ?? ".*",
        includeExtensionsRegex: graphConfig.get("includeExtensionsRegex") ?? "",
        excludePathsRegex: graphConfig.get("excludePathsRegex") ?? "",
        excludeExtensionsRegex: graphConfig.get("excludeExtensionsRegex") ?? "",
        logFileEnabled: graphConfig.get("logFileEnabled") ?? true,
        logFileMaxSize: graphConfig.get("logFileMaxSize") ?? 5,
        logFileMaxCountRetension: graphConfig.get("logFileMaxCountRetension") ?? 5
    };

    if (activeChildProcess) {
        try { activeChildProcess.kill('SIGKILL'); } catch(e){}
    }

    const child = cp.spawn("python3", args, { cwd: workspaceRoot, env: { ...process.env, PYTHONPATH: targetDir } });
    activeChildProcess = child;

    child.stdin.write(JSON.stringify(payloadConfig));
    child.stdin.end();

    child.stdout.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "info")));
    child.stderr.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "error")));

    child.on("close", (code: number) => {
        if (activeChildProcess === child) {
            activeChildProcess = null;
        }
        if (code === 0) {
            panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            const graphJsonPath = path.join(outputDir, "graph.json");
            if (fs.existsSync(graphJsonPath)) {
                try {
                    panel.webview.postMessage({ command: "updateGraphData", payload: JSON.parse(fs.readFileSync(graphJsonPath, "utf-8")) });
                } catch (err) {}
            }
        } else {
            panel.webview.postMessage({ command: "updateStatus", payload: "error" });
        }
    });
}

function sendConfig(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
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
            calleesDepth: config.get('calleesDepth') ?? 1,
            extensionVersion: context.extension.packageJSON.version
        }
    });
}

function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist', 'webview.js')));
    return `<!DOCTYPE html>
    <html lang="en" class="h-full">
    <head>
        <meta charset="UTF-8"><title>Graph RAG Explorer</title>
        <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { padding: 0; margin: 0; background-color: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
            #global-cursor-tooltip { position: fixed; background-color: #000000; color: #ffffff; border: 1px solid #454545; padding: 6px 10px; border-radius: 4px; font-size: 11px; z-index: 999999; pointer-events: none; display: none; }
        </style>
    </head>
    <body class="h-full overflow-hidden select-none">
        <div id="root" class="h-full flex flex-col"></div><div id="global-cursor-tooltip"></div>
        <script src="${scriptUri}"></script>
    </body></html>`;
}
export function deactivate() {}
EOF

# Build code bundle
npm run compile

echo "✅ feat: Injected 'extension-identity' ID and dynamically populated Version tooltip on the UI header utilizing package.json properties!"
