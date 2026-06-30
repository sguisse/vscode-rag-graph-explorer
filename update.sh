#!/usr/bin/env bash
# Production-ready patch to update Neo4j setup configuration schema parameters and introduce an interactive console web launcher action button.

mkdir -p src/webview/components/explorer-tab/graph

# 1. Fully rebuild package.json with updated property schemas
cat << 'EOF' > package.json
{
  "name": "graph-rag-explorer",
  "license": "MIT",
  "displayName": "Graph RAG Explorer",
  "description": "Expert Node Navigator and Architecture Explorer via RAG and Gemini",
  "version": "1.5.0",
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
          "description": "Automatically pin the Graph RAG Explorer UI tab when opened."
        },
        "graphRagExplorer.graphLegendEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Display the visual topological legend by default upon launch."
        },
        "graphRagExplorer.callersDepth": {
          "type": "number",
          "default": 1,
          "description": "Default callers upstream lookup relationship parsing depth."
        },
        "graphRagExplorer.calleesDepth": {
          "type": "number",
          "default": 1,
          "description": "Default callees downstream lookup relationship parsing depth."
        },
        "graphRagExplorer.excludePathsRegex": {
          "type": "string",
          "default": ".*/node_modules/.*|.*/target/.*|.*/\\.git/.*|.*/dist/.*|.*/.*-tmp/.*|.*/.*-out/.*|.*/.idea/.*|.*/.vscode/.*|.*/.history/.*|.*/exported-files/.*,/\\.[^/]+",
          "description": "Regex to exclude paths containing specific directories (e.g., node_modules, target, .git, dist, /\\.[^/]+)."
        },
        "graphRagExplorer.forceScriptSync": {
          "type": "boolean",
          "default": false,
          "description": "Force synchronized recreation of local project core scripts."
        },
        "graphRagExplorer.logFileEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable background file logging redirection (.graph-rag-explorer/logs/)"
        },
        "graphRagExplorer.logFileMaxSize": {
          "type": "number",
          "default": 5,
          "description": "Maximum size per log file before rotation triggers (in Megabytes)."
        },
        "graphRagExplorer.logFileMaxCountRetension": {
          "type": "number",
          "default": 5,
          "description": "Maximum number of historical log file nodes to keep before cycling."
        },
        "graphRagExplorer.neo4j.version": {
          "type": "string",
          "default": "5.26.0",
          "description": "The specific community release version of the local sandboxed database engine server."
        },
        "graphRagExplorer.neo4j.host": {
          "type": "string",
          "default": "localhost",
          "description": "Neo4j host."
        },
        "graphRagExplorer.neo4j.port.bolt": {
          "type": "number",
          "default": 7687,
          "description": "Neo4j connection endpoint port used to access db API."
        },
        "graphRagExplorer.neo4j.port.http": {
          "type": "number",
          "default": 7474,
          "description": "Neo4j website client http port"
        },
        "graphRagExplorer.neo4j.uri": {
          "type": "string",
          "default": "bolt://${graphRagExplorer.neo4j.host}:${graphRagExplorer.neo4j.port.bolt}",
          "description": "Neo4j connection endpoint mapping into the embedded jQAssistant server database."
        },
        "graphRagExplorer.neo4j.url": {
          "type": "string",
          "default": "http://${graphRagExplorer.neo4j.host}:${graphRagExplorer.neo4j.port.http}/browser/preview/",
          "description": "Neo4j website client URL."
        },
        "graphRagExplorer.neo4j.username": {
          "type": "string",
          "default": "neo4j",
          "description": "Database account access identifier username."
        },
        "graphRagExplorer.neo4j.password": {
          "type": "string",
          "default": "password",
          "description": "Database secure transaction authorization secret credentials."
        },
        "graphRagExplorer.jqassistant.version": {
          "type": "string",
          "default": "2.9.1",
          "description": "The target production-ready release version of the portable jQAssistant CLI tool."
        },
        "graphRagExplorer.jqassistant.downloadUrl": {
          "type": "string",
          "default": "https://github.com/jQAssistant/jqassistant/releases/download/${version}/jqassistant-commandline-neo4jv5-${version}-distribution.zip",
          "description": "The absolute parameterized GitHub Releases download link for fetching portable jQAssistant distribution packages."
        },
        "graphRagExplorer.jqassistant.xmlReportPath": {
          "type": "string",
          "default": "./target/site/jacoco/jacoco.xml",
          "description": "Workspace matching path targeting local JaCoCo XML metric reports."
        },
        "graphRagExplorer.dependencyCruiser.configFile": {
          "type": "string",
          "default": ".dependency-cruiser.json",
          "description": "Configuration rules path definition for Dependency Cruiser checks."
        },
        "graphRagExplorer.graphify.arguments": {
          "type": "string",
          "default": "--deep-scan",
          "description": "Optional runtime execution flags passed onto the background python graphify engine."
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
    "@types/cytoscape": "^3.25.7",
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
    "cytoscape": "^3.30.0"
  }
}
EOF

# 2. Update extension orchestrator host logic to correctly compute template URL options
cat << 'EOF' > src/extension.ts
//@ts-check
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

let activeChildProcess: any = null;
const SCRIPT_SYNC_IGNORED_NAMES = new Set(["__pycache__", ".python_packages", ".bootstrap.lock"]);

function shouldSkipScriptSyncEntry(fileName: string): boolean {
    return SCRIPT_SYNC_IGNORED_NAMES.has(fileName) || fileName.endsWith(".pyc") || fileName.endsWith(".pyo");
}

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
                const mode = message.mode || "deep";
                let targetFile = "";
                if (mode === "delta") {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
                        targetFile = vscode.workspace.asRelativePath(activeEditor.document.uri);
                    } else {
                        vscode.window.showWarningMessage("Delta Reload parsing rules require an active text file window context.");
                        panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
                        return;
                    }
                }
                runPythonScan(context, panel, mode, targetFile);
            } else if (message.command === 'killAnalysis') {
                if (activeChildProcess) {
                    try { activeChildProcess.kill('SIGKILL'); } catch (err) {}
                    activeChildProcess = null;
                }
                panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            } else if (message.command === 'openExternal') {
                if (message.url) {
                    try {
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    } catch (err) {
                        vscode.window.showErrorMessage(`Failed to open external link: ${message.url}`);
                    }
                }
            } else if (message.command === 'revealFile') {
                if (message.path) {
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    const workspaceRoot = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : '';
                    const fullPath = path.isAbsolute(message.path) ? message.path : path.join(workspaceRoot, message.path);
                    if (fs.existsSync(fullPath)) {
                        try {
                            const doc = await vscode.workspace.openTextDocument(fullPath);
                            await vscode.window.showTextDocument(doc, {
                                viewColumn: message.openEditor ? vscode.ViewColumn.One : undefined,
                                preserveFocus: !message.openEditor
                            });
                        } catch (err) {}
                    }
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}

function copyFolderRecursiveSync(source: string, target: string) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    if (fs.existsSync(source)) {
        const files = fs.readdirSync(source);
        for (const file of files) {
            if (shouldSkipScriptSyncEntry(file)) continue;
            const curSource = path.join(source, file);
            const curTarget = path.join(target, file);
            if (fs.statSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, curTarget);
            } else {
                fs.copyFileSync(curSource, curTarget);
            }
        }
    }
}

function hasOutdatedFiles(source: string, target: string): boolean {
    if (!fs.existsSync(source)) return false;
    if (!fs.existsSync(target)) return true;

    const files = fs.readdirSync(source);
    for (const file of files) {
        if (shouldSkipScriptSyncEntry(file)) continue;
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);
        const sourceStat = fs.statSync(curSource);

        if (sourceStat.isDirectory()) {
            if (hasOutdatedFiles(curSource, curTarget)) return true;
            continue;
        }

        if (!fs.existsSync(curTarget)) return true;
        const targetStat = fs.statSync(curTarget);
        if (!targetStat.isFile() || targetStat.size !== sourceStat.size) return true;
        if (!fs.readFileSync(curSource).equals(fs.readFileSync(curTarget))) return true;
    }
    return false;
}

function syncCoreScripts(context: vscode.ExtensionContext, workspaceRoot: string): boolean {
    const targetDir = path.join(workspaceRoot, ".graph-rag-explorer", "scripts");
    const versionFilePath = path.join(targetDir, "version.json");
    const currentVersion = context.extension.packageJSON.version;
    const sourceDir = path.join(context.extensionPath, "scripts");
    const graphConfig = vscode.workspace.getConfiguration("graphRagExplorer");
    let needsSync = graphConfig.get("forceScriptSync") === true || !fs.existsSync(targetDir) || !fs.existsSync(versionFilePath);

    if (!needsSync && fs.existsSync(versionFilePath)) {
        try {
            if (JSON.parse(fs.readFileSync(versionFilePath, "utf-8")).version !== currentVersion) needsSync = true;
        } catch (e) { needsSync = true; }
    }
    if (!needsSync) {
        needsSync = hasOutdatedFiles(sourceDir, targetDir);
    }
    if (needsSync) {
        try {
            copyFolderRecursiveSync(sourceDir, targetDir);
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
    const targetDir = path.join(workspaceRoot, ".graph-rag-explorer", "scripts");

    syncCoreScripts(context, workspaceRoot);
    panel.webview.postMessage({ command: "updateStatus", payload: "building" });

    const parseLogLine = (line: string, fallbackLevel: 'debug' | 'info' | 'warn' | 'error') => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        let level = fallbackLevel;
        if (cleanLine.includes("🪲") || cleanLine.includes("[DEBUG]")) level = "debug";
        else if (cleanLine.includes("⚠️") || cleanLine.includes("[WARN]")) level = "warn";
        else if (cleanLine.includes("❌") || cleanLine.includes("[ERROR]")) level = "error";
        else if (cleanLine.includes("ℹ️") || cleanLine.includes("[INFO]") || cleanLine.includes("✅")) level = "info";

        panel.webview.postMessage({
            command: "logTrace",
            payload: { level: level, message: cleanLine, timestamp: new Date().toLocaleTimeString() }
        });
    };

    const runnerScript = path.join(targetDir, "main.py");
    let args = [runnerScript];

    const isWindows = process.platform === 'win32';
    const pythonBinary = isWindows ? 'python' : 'python3';

    const payloadConfig = {
        workspaceRoot: workspaceRoot,
        excludePathsRegex: graphConfig.get("excludePathsRegex") ?? "",
        includeExtensions: [".java", ".ts", ".js", ".py", ".md"],
        logFileEnabled: graphConfig.get("logFileEnabled") ?? true,
        logFileMaxSize: graphConfig.get("logFileMaxSize") ?? 5,
        logFileMaxCountRetension: graphConfig.get("logFileMaxCountRetension") ?? 5,
        neo4j: {
            version: graphConfig.get("neo4j.version") ?? "5.26.0",
            host: graphConfig.get("neo4j.host") ?? "localhost",
            portBolt: graphConfig.get("neo4j.port.bolt") ?? 7687,
            portHttp: graphConfig.get("neo4j.port.http") ?? 7474,
            uri: `bolt://${graphConfig.get("neo4j.host") ?? "localhost"}:${graphConfig.get("neo4j.port.bolt") ?? 7687}`,
            username: graphConfig.get("neo4j.username") ?? "neo4j",
            password: graphConfig.get("neo4j.password") ?? "password"
        },
        jqassistant: {
            xmlReportPath: graphConfig.get("jqassistant.xmlReportPath") ?? "./target/jqassistant/report/jacoco/jacoco.xml"
        },
        dependencyCruiser: {
            configFile: graphConfig.get("dependencyCruiser.configFile") ?? ".dependency-cruiser.json"
        },
        graphify: {
            arguments: graphConfig.get("graphify.arguments") ?? "--deep-scan"
        }
    };

    if (activeChildProcess) {
        try { activeChildProcess.kill('SIGKILL'); } catch(e){}
    }

    const child = childProcess.spawn(pythonBinary, args, { cwd: workspaceRoot });
    activeChildProcess = child;

    child.stdin.write(JSON.stringify(payloadConfig));
    child.stdin.end();

    child.stdout.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "info")));
    child.stderr.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "error")));

    child.on("close", (code: number) => {
        if (activeChildProcess === child) activeChildProcess = null;
        if (code === 0) {
            panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            const finalUiPayloadPath = path.join(workspaceRoot, ".graph-rag-explorer", "target", "ui_outputs", "graph-ui-payload.json");
            if (fs.existsSync(finalUiPayloadPath)) {
                try {
                    const rawPayload = JSON.parse(fs.readFileSync(finalUiPayloadPath, "utf-8"));
                    panel.webview.postMessage({ command: "updateGraphData", payload: rawPayload.graph });
                } catch (err) {}
            }
        } else {
            panel.webview.postMessage({ command: "updateStatus", payload: "error" });
        }
    });
}

function sendConfig(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('graphRagExplorer');
    const host = config.get('neo4j.host') || 'localhost';
    const portHttp = config.get('neo4j.port.http') || 7474;
    const neo4jUrl = `http://${host}:${portHttp}/browser/preview/`;

    panel.webview.postMessage({
        command: 'setConfig',
        config: {
            EntitiesTypesList: config.get('EntitiesTypesList'),
            regexFilterEnabled: config.get('regexFilterEnabled'),
            TreeFilterEnabled: config.get('TreeFilterEnabled'),
            geminiApiKey: config.get('geminiApiKey'),
            tooltipDelay: config.get('tooltipDelay') ?? 2000,
            extensionVersion: context.extension.packageJSON.version,
            neo4jUrl: neo4jUrl
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
    </head>
    <body class="h-full overflow-hidden select-none" style="padding: 0px !important;">
        <div id="root" class="h-full flex flex-col"></div>
        <script src="${scriptUri}"></script>
    </body></html>`;
}

export function deactivate() {}
EOF

# 3. Propagate neo4jUrl parameters seamlessly into ExplorerTab props tracking mapping bounds
cat << 'EOF' > src/webview/components/ExplorerTab.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { TreeView } from './explorer-tab/tree/TreeView';
import { GraphView } from './explorer-tab/graph/GraphView';
import { useGraphSelection } from '../hooks/useGraphSelection';
import { useCytoscapeGraph } from './explorer-tab/graph/useCytoscapeGraph';

interface ExplorerTabProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    filters: any;
    config?: any;
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
    nodes, edges, selectedNodeIds, setSelectedNodeIds, filters, config
}) => {
    const { applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase } = filters;

    const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(config?.graphLegendEnabled ?? true);

    const [parentDepth, setParentDepth] = useState<number>(config?.callersDepth ?? 1);
    const [childDepth, setChildDepth] = useState<number>(config?.calleesDepth ?? 1);

    const [isHierarchyEnabled, setIsHierarchyEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (config) {
            setShowLegend(config.graphLegendEnabled ?? true);
            setParentDepth(config.callersDepth ?? 1);
            setChildDepth(config.calleesDepth ?? 1);
        }
    }, [config]);

    const nodeToFileIdMap = useMemo(() => {
        const map = new Map<string, string>();
        const fileNodes = nodes.filter(n => n.group === 'file' || n.group === 'file_unreferenced');
        fileNodes.forEach(f => map.set(f.id, f.id));
        nodes.forEach(n => {
            if (n.group !== 'file' && n.group !== 'file_unreferenced' && n.source_file) {
                const matchingFile = fileNodes.find(f => f.source_file === n.source_file || f.id === n.source_file);
                if (matchingFile) map.set(n.id, matchingFile.id);
            }
        });
        return map;
    }, [nodes]);

    const fileLevelEdges = useMemo(() => {
        const fileEdgesMap = new Map<string, { from: string; to: string; types: Set<string> }>();
        edges.forEach(e => {
            const fromFileId = nodeToFileIdMap.get(e.from);
            const toFileId = nodeToFileIdMap.get(e.to);
            if (fromFileId && toFileId && fromFileId !== toFileId) {
                const key = `${fromFileId}->${toFileId}`;
                if (!fileEdgesMap.has(key)) {
                    fileEdgesMap.set(key, { from: fromFileId, to: toFileId, types: new Set() });
                }
                fileEdgesMap.get(key)!.types.add(e.type);
            }
        });
        return Array.from(fileEdgesMap.values());
    }, [edges, nodeToFileIdMap]);

    const {
        exactSelectedIds,
        effectiveFileIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    } = useGraphSelection(fileLevelEdges, nodeToFileIdMap, parentDepth, childDepth, isHierarchyEnabled);

    useEffect(() => {
        setSelectedNodeIds(exactSelectedIds);
    }, [exactSelectedIds, setSelectedNodeIds]);

    const prevSelectedSizeRef = useRef<number>(selectedNodeIds.size);
    useEffect(() => {
        if (selectedNodeIds.size === 0 && prevSelectedSizeRef.current > 0 && exactSelectedIds.size > 0) {
            clearSelection();
        }
        prevSelectedSizeRef.current = selectedNodeIds.size;
    }, [selectedNodeIds, exactSelectedIds, clearSelection]);

    const { containerRef, networkRef } = useCytoscapeGraph({
        nodes,
        fileLevelEdges,
        nodeToFileIdMap,
        effectiveFileIds,
        exactSelectedIds,
        toggleNodeSelection,
        clearSelection,
        applyOnGraph,
        selectedTypes,
        searchText,
        searchMode,
        isRegexEnabled,
        ignoreCase,
        isTreeCollapsed,
        isMaximized
    });

    return (
        <div id="tab-explorer-content" className="relative flex items-stretch w-full h-full min-h-0">
            <div className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] shadow-[2px_0_8px_var(--vscode-widget-shadow)] z-0 bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? 'hidden' : 'w-[465px]'}`}>
                <TreeView
                    nodes={nodes}
                    edges={edges}
                    exactSelectedIds={exactSelectedIds}
                    effectiveFileIds={effectiveFileIds}
                    toggleNodeSelection={toggleNodeSelection}
                    setNodesSelectionState={setNodesSelectionState}
                    clearSelection={clearSelection}
                    networkRef={networkRef}
                    isHierarchyEnabled={isHierarchyEnabled}
                    setIsHierarchyEnabled={setIsHierarchyEnabled}
                    filters={filters}
                />
            </div>
            <GraphView
                containerRef={containerRef} isMaximized={isMaximized} setIsMaximized={setIsMaximized}
                isTreeCollapsed={isTreeCollapsed} setIsTreeCollapsed={setIsTreeCollapsed}
                parentDepth={parentDepth} setParentDepth={setParentDepth} childDepth={childDepth} setChildDepth={setChildDepth}
                networkRef={networkRef} showLegend={showLegend} setShowLegend={setShowLegend}
                neo4jUrl={config?.neo4jUrl}
            />
        </div>
    );
};
EOF

# 4. Append custom interactive Neo4j Web Browser Console launcher button to GraphView
cat << 'EOF' > src/webview/components/explorer-tab/graph/GraphView.tsx
import React from 'react';
import { MaximizeIcon, MinimizeIcon, ListUnorderedIcon } from '@primer/octicons-react';
import { Legend } from '../Legend';

interface GraphViewProps {
    containerRef: React.RefObject<HTMLDivElement>;
    isMaximized: boolean;
    setIsMaximized: (val: boolean) => void;
    isTreeCollapsed: boolean;
    setIsTreeCollapsed: (val: boolean) => void;
    parentDepth: number;
    setParentDepth: (val: number) => void;
    childDepth: number;
    setChildDepth: (val: number) => void;
    networkRef: React.RefObject<any>;
    showLegend: boolean;
    setShowLegend: (val: boolean) => void;
    neo4jUrl?: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
    containerRef,
    isMaximized,
    setIsMaximized,
    isTreeCollapsed,
    setIsTreeCollapsed,
    parentDepth,
    setParentDepth,
    childDepth,
    setChildDepth,
    networkRef,
    showLegend,
    setShowLegend,
    neo4jUrl
}) => {
    return (
        <div className={`flex flex-col overflow-hidden bg-[var(--vscode-editor-background)] ${isMaximized ? 'fixed inset-0 z-50 w-screen h-screen' : 'flex-1 h-full'}`}>
            <div className="z-10 relative flex flex-shrink-0 justify-between items-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] shadow-[0_2px_4px_var(--vscode-widget-shadow)] px-3 border-[var(--vscode-panel-border)] border-b h-10">
                <div className="flex items-center gap-4 h-full text-xs">
                    <div className="flex items-center gap-2">
                        {!isMaximized && (
                            <button
                                onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                                className="codicon-layout-sidebar-left flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 text-[var(--vscode-foreground)] text-sm transition-colors duration-200 codicon"
                                data-tooltip={isTreeCollapsed ? "Show Tree View" : "Hide Tree View"}
                            />
                        )}
                        <span className="block font-bold text-[11px] uppercase tracking-wider">Graph&nbsp;View</span>
                    </div>

                    <div className="flex items-center gap-2 bg-[var(--vscode-input-background)]/50 shadow-inner px-2 py-1 border border-[var(--vscode-panel-border)]/50 rounded-md h-7">
                        <label className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide" data-tooltip="Number of parent files levels to select">Callers</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={parentDepth}
                            onChange={(e) => setParentDepth(parseInt(e.target.value) || 0)}
                            className="bg-[var(--vscode-input-background)] shadow-sm border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-sm outline-none focus:ring-1 focus:ring-blue-500/50 w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-[var(--vscode-input-background)]/50 shadow-inner px-2 py-1 border border-[var(--vscode-panel-border)]/50 rounded-md h-7">
                        <label className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide" data-tooltip="Number of child files levels to select">Callees</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={childDepth}
                            onChange={(e) => setChildDepth(parseInt(e.target.value) || 0)}
                            className="bg-[var(--vscode-input-background)] shadow-sm border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-sm outline-none focus:ring-1 focus:ring-blue-500/50 w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all"
                        />
                    </div>

                    {/* Standalone Neo4j Browser Client console utility navigation launch module */}
                    <button
                        onClick={() => {
                            const vscode = (window as any).vscodeApi;
                            if (vscode && neo4jUrl) {
                                vscode.postMessage({ command: 'openExternal', url: neo4jUrl });
                            } else if (neo4jUrl) {
                                window.open(neo4jUrl, '_blank', 'noopener,noreferrer');
                            }
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-sm px-2.5 rounded-md font-bold text-white text-[10px] uppercase tracking-wider h-7 transition-all cursor-pointer select-none"
                        data-tooltip="Open embedded Neo4j Web Console Client Browser"
                    >
                        <span className="codicon codicon-database"></span> Neo4j
                    </button>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => networkRef.current?.fit({ animation: true })}
                        className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] shadow-sm rounded-md w-7 h-7 text-[var(--vscode-foreground)] transition-colors duration-200"
                        data-tooltip="Recenter Graph"
                    >
                        <span className="text-[14px] codicon codicon-screen-full"></span>
                    </button>
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] shadow-sm rounded-md w-7 h-7 text-[var(--vscode-foreground)] transition-colors duration-200"
                        data-tooltip={isMaximized ? "Minimize Graph View" : "Maximize Graph View"}
                    >
                        {isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
                    </button>

                    <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1 w-[1px] h-5" />

                    <button
                        onClick={() => setShowLegend(!showLegend)}
                        className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 rounded-md shadow-sm ${showLegend ? 'text-blue-500 bg-blue-500/10' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-foreground)]'}`}
                        data-tooltip="Toggle Legend"
                    >
                        <ListUnorderedIcon />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 bg-[var(--vscode-editor-background)]">
                <div ref={containerRef} className="absolute inset-0 outline-none" />
                <Legend showLegend={showLegend} onClose={() => setShowLegend(false)} />
            </div>
        </div>
    );
};
EOF

# Compile structural configuration bundle layout profiles
npm run package

echo "✅ feat/neo4j: Extended application schemas with port parameters and injected a dedicated console toolbar navigation link to launch the Neo4j client!"
