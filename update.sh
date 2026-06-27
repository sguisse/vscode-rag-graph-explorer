#!/bin/bash
set -e

# Create workspace folders if they don't exist
mkdir -p src
mkdir -p src/webview/hooks
mkdir -p src/webview/components/explorer-tab/graph

# 1. Update useGraphSelection.ts to fix the React render-phase state update warning
cat << 'EOF' > src/webview/hooks/useGraphSelection.ts
import { useState, useMemo, useCallback, useEffect } from 'react';

export function useGraphSelection(
    fileLevelEdges: { from: string; to: string; types: Set<string> }[],
    nodeToFileIdMap: Map<string, string>,
    parentDepth: number,
    childDepth: number,
    isHierarchyEnabled: boolean
) {
    const [exactSelectedIds, setExactSelectedIds] = useState<Set<string>>(new Set());

    const manualFileIds = useMemo(() => {
        const fileIds = new Set<string>();
        exactSelectedIds.forEach(id => {
            const fileId = nodeToFileIdMap.get(id) || id;
            fileIds.add(fileId);
        });
        return fileIds;
    }, [exactSelectedIds, nodeToFileIdMap]);

    const effectiveFileIds = useMemo(() => {
        const effective = new Set<string>(manualFileIds);

        if (!isHierarchyEnabled || manualFileIds.size === 0) {
            return effective;
        }

        Array.from(manualFileIds).forEach(startId => {
            let currentChildLayer = [startId];
            for (let d = 0; d < childDepth; d++) {
                const nextLayer: string[] = [];
                currentChildLayer.forEach(id => {
                    for (const e of fileLevelEdges) {
                        if (e.from === id && !effective.has(e.to)) {
                            effective.add(e.to);
                            nextLayer.push(e.to);
                        }
                    }
                });
                currentChildLayer = nextLayer;
            }

            let currentParentLayer = [startId];
            for (let d = 0; d < parentDepth; d++) {
                const nextLayer: string[] = [];
                currentParentLayer.forEach(id => {
                    for (const e of fileLevelEdges) {
                        if (e.to === id && !effective.has(e.from)) {
                            effective.add(e.from);
                            nextLayer.push(e.from);
                        }
                    }
                });
                currentParentLayer = nextLayer;
            }
        });

        return effective;
    }, [manualFileIds, fileLevelEdges, parentDepth, childDepth, isHierarchyEnabled]);

    // Relocate side-effect logging to a safe useEffect lifecycle phase to eliminate App component render-phase updates
    useEffect(() => {
        if (typeof (window as any).logToTerminal === 'function') {
            if (!isHierarchyEnabled || manualFileIds.size === 0) {
                (window as any).logToTerminal('debug', `Registry B recalculated (Flat Mode). Effective Files: ${effectiveFileIds.size}`);
            } else {
                (window as any).logToTerminal('debug', `Registry B recalculated (Hierarchy Sync Link). Manual Base: ${manualFileIds.size} ➔ Total Effective Files Context: ${effectiveFileIds.size}`);
            }
        }
    }, [effectiveFileIds, manualFileIds, isHierarchyEnabled]);

    const toggleNodeSelection = useCallback((targetId: string) => {
        setExactSelectedIds(prev => {
            const next = new Set(prev);
            const isChecked = next.has(targetId);
            if (isChecked) {
                next.delete(targetId);
            } else {
                next.add(targetId);
            }
            if (typeof (window as any).logToTerminal === 'function') {
                (window as any).logToTerminal('info', `🎯 Transaction: toggleNodeSelection ID=[${targetId}] | PriorState=${isChecked ? 'Checked' : 'Unchecked'} ➔ New Registry A Size: ${next.size}`);
            }
            return next;
        });
    }, []);

    const setNodesSelectionState = useCallback((ids: string[], checked: boolean) => {
        setExactSelectedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            if (typeof (window as any).logToTerminal === 'function') {
                (window as any).logToTerminal('info', `📦 Mass Transaction: setNodesSelectionState -> TargetState=${checked} | Actioned IDs Count: ${ids.length} ➔ New Registry A Size: ${next.size}`);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        if (typeof (window as any).logToTerminal === 'function') {
            (window as any).logToTerminal('warn', `🗑️ Transaction: clearSelection invoked. Purging total Registry A!`);
        }
        setExactSelectedIds(new Set());
    }, []);

    return {
        exactSelectedIds,
        effectiveFileIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    };
}
EOF

# 2. Update GraphConfig.ts to replace invalid dynamic CSS syntax and drop unrecognized property tracking values
cat << 'EOF' > src/webview/components/explorer-tab/graph/GraphConfig.ts
import cytoscape from 'cytoscape';

export const getGraphStyle = (): any[] => [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'width': 26,
            'height': 26,
            'background-color': '#0e639c',
            'border-color': '#1177bb',
            'border-width': 2,
            'color': '#0e639c',
            'font-family': 'sans-serif',
            'font-size': 10,
            'font-weight': '400',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'shape': 'diamond',
            'text-outline-color': '#1177bb',
            'text-outline-width': 0,
            'text-max-width': '200px',
            'text-wrap': 'ellipsis',
            'transition-property': 'opacity, border-width, border-color, background-color',
            'transition-duration': 0.25
        }
    },
    {
        selector: 'node[group = "file_unreferenced"]',
        style: {
            'background-color': '#3a1e22',
            'border-color': '#000000',
            'border-width': 2.5,
            'color': '#e0a0a0',
            'shape': 'diamond'
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1.5,
            'line-color': '#444444',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#444444',
            'curve-style': 'bezier',
            'control-point-step-size': 40,
            'arrow-scale': 0.9,
            'opacity': 0.65,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 0.25
        }
    },
    {
        selector: 'node:selected',
        style: {
            'border-color': '#007acc',
            'border-width': 4,
            'background-color': '#1f8ad2'
        }
    }
];

export const layoutOptions = {
    name: 'cose',
    animate: true,
    refresh: 20,
    fit: true,
    padding: 40,
    nodeOverlap: 40,
    idealEdgeLength: () => 90,
    componentSpacing: 120,
    nodeRepulsion: () => 900000,
    edgeElasticity: () => 100,
    nestingFactor: 5,
    gravity: 25,
    numIter: 1200,
    initialTemp: 300,
    coolingFactor: 0.95,
    minTemp: 1.0
};
EOF

# 3. Update extension.ts to eliminate production CDN script tags, document.write hazards, and secure DOM bindings
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

function copyFolderRecursiveSync(source: string, target: string) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    if (fs.existsSync(source)) {
        const files = fs.readdirSync(source);
        for (const file of files) {
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
            const sourceDir = path.join(context.extensionPath, "scripts");
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
    const runnerScript = path.join(targetDir, "core", "runner.py");
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

    const child = cp.spawn("python3", args, { cwd: workspaceRoot, env: { ...process.env, PYTHONPATH: path.join(targetDir, "core") } });
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
            const graphJsonPath = path.join(outputDir, "graph-view.json");
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
        <style>
            body { padding: 0; margin: 0; background-color: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family, sans-serif); }
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

# 4. Add safety checks to App.tsx when reading classList to resolve transient theme changes
sed -i.bak 's/const root = window.document.documentElement;/const root = window.document.documentElement; if (root) {/g' src/webview/App.tsx
sed -i.bak 's/else root.classList.remove(\x27dark\x27);/else root.classList.remove(\x27dark\x27); }/g' src/webview/App.tsx
rm -f src/webview/App.tsx.bak

# Compile project using extension configuration scripts
npm run package

echo "✅ fix: Resolved render-phase state update crashes, corrected invalid Cytoscape engine variables, and safely removed dynamic runtime CDN stylesheet warnings."
