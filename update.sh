#!/bin/bash

# Ensure directory structure exists
mkdir -p src

# Replace full content of extension.ts to integrate the named VS Code Output Channel
cat << 'EOF' > src/extension.ts
//@ts-check
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import { VsCodeSettings } from './core/VsCodeSettings';

let activeChildProcess: any = null;
let logOutputChannel: vscode.OutputChannel;
const SCRIPT_SYNC_IGNORED_NAMES = new Set(["__pycache__", ".python_packages", ".bootstrap.lock"]);

function shouldSkipScriptSyncEntry(fileName: string): boolean {
    return SCRIPT_SYNC_IGNORED_NAMES.has(fileName) || fileName.endsWith(".pyc") || fileName.endsWith(".pyo");
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize dedicated Output Channel named "graph-rag-explorer"
    logOutputChannel = vscode.window.createOutputChannel('graph-rag-explorer');
    context.subscriptions.push(logOutputChannel);
    logOutputChannel.appendLine('[INFO] graph-rag-explorer output channel initialized.');

    // Set your global main key prefix here
    VsCodeSettings.init('graphRagExplorer');

    let disposable = vscode.commands.registerCommand('graphRagExplorer.openTool', () => {
        logOutputChannel.appendLine('[INFO] Command graphRagExplorer.openTool invoked.');
        const panel = vscode.window.createWebviewPanel(
            'graphRagExplorer', 'Graph RAG Explorer', vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
            }
        );

        if (VsCodeSettings.get('pinFilesExporter') !== false) {
            vscode.commands.executeCommand('workbench.action.pinEditor');
        }

        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

        const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.uri.scheme !== 'file') return;
            const relativePath = vscode.workspace.asRelativePath(document.uri);
            logOutputChannel.appendLine(`[INFO] File saved: ${relativePath}. Triggering delta scan.`);
            runPythonScan(context, panel, "delta", relativePath);
        });
        context.subscriptions.push(saveListener);

        panel.onDidDispose(() => {
            logOutputChannel.appendLine('[INFO] Webview panel disposed.');
            saveListener.dispose();
            if (activeChildProcess) {
                try {
                    logOutputChannel.appendLine('[WARN] Killing active background analysis process due to panel disposal.');
                    activeChildProcess.kill('SIGKILL');
                } catch(e){}
                activeChildProcess = null;
            }
        });

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'ready') {
                logOutputChannel.appendLine('[INFO] Webview ready. Sending configuration and launching deep scan.');
                sendConfig(panel, context);
                runPythonScan(context, panel, "deep");
            } else if (message.command === 'forceRefreshScan') {
                const mode = message.mode || "deep";
                let targetFile = "";
                logOutputChannel.appendLine(`[INFO] Force refresh scan requested. Mode: ${mode}`);
                if (mode === "delta") {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
                        targetFile = vscode.workspace.asRelativePath(activeEditor.document.uri);
                    } else {
                        vscode.window.showWarningMessage("Delta Reload parsing rules require an active text file window context.");
                        logOutputChannel.appendLine('[WARN] Delta Reload aborted: No active text file window context found.');
                        panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
                        return;
                    }
                }
                runPythonScan(context, panel, mode, targetFile);
            } else if (message.command === 'killAnalysis') {
                logOutputChannel.appendLine('[INFO] Manual analysis termination requested by user.');
                if (activeChildProcess) {
                    try { activeChildProcess.kill('SIGKILL'); } catch (err) {}
                    activeChildProcess = null;
                }
                panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            } else if (message.command === 'openExternal') {
                if (message.url) {
                    try {
                        logOutputChannel.appendLine(`[INFO] Opening external URL: ${message.url}`);
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    } catch (err) {
                        logOutputChannel.appendLine(`[ERROR] Failed to open external URL: ${message.url}`);
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
                            logOutputChannel.appendLine(`[INFO] Revealing file: ${message.path}`);
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
    let needsSync = VsCodeSettings.get("forceScriptSync") === true || !fs.existsSync(targetDir) || !fs.existsSync(versionFilePath);

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
            logOutputChannel.appendLine('[INFO] Core scripts are outdated or missing. Syncing scripts directory...');
            copyFolderRecursiveSync(sourceDir, targetDir);
            fs.writeFileSync(versionFilePath, JSON.stringify({ version: currentVersion }), "utf-8");
        } catch (err) {
            logOutputChannel.appendLine(`[ERROR] Script sync failed: ${err}`);
            return false;
        }
    }
    return true;
}

function runPythonScan(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, mode: string, targetFile: string = "") {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return;

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const backendScriptsPath : string = VsCodeSettings.get('graphRagExplorer.beScriptsPath');
    const targetDir4Scripts = path.join(workspaceRoot, backendScriptsPath, "scripts");

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

        const timestamp = new Date().toLocaleTimeString();

        // Relay background execution logs to the VS Code Output Channel
        logOutputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] ${cleanLine}`);

        panel.webview.postMessage({
            command: "logTrace",
            payload: { level: level, message: cleanLine, timestamp: timestamp }
        });
    };

    const runnerScript = path.join(targetDir4Scripts, "main.py");
    let args = [runnerScript];

    const isWindows = process.platform === 'win32';
    const pythonBinary = isWindows ? 'python' : 'python3';

    const payloadConfig = VsCodeSettings.toJson();
    payloadConfig["graphRagExplorer"]["workspaceRoot"] = workspaceRoot;

    if (activeChildProcess) {
        try {
            logOutputChannel.appendLine('[WARN] Terminating previous background execution context before launching new process.');
            activeChildProcess.kill('SIGKILL');
        } catch(e){}
    }

    logOutputChannel.appendLine(`[INFO] Spawning Python background process: ${pythonBinary} with script ${runnerScript}`);
    const child = childProcess.spawn(pythonBinary, args, { cwd: workspaceRoot });
    activeChildProcess = child;

    child.stdin.write(JSON.stringify(payloadConfig));
    child.stdin.end();

    child.stdout.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "info")));
    child.stderr.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "error")));

    child.on("close", (code: number) => {
        if (activeChildProcess === child) activeChildProcess = null;
        if (code === 0) {
            logOutputChannel.appendLine('[INFO] Python background process completed successfully.');
            panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            const finalUiPayloadPath = path.join(workspaceRoot, backendScriptsPath, "target", "ui_outputs", "graph-ui-payload.json");
            if (fs.existsSync(finalUiPayloadPath)) {
                try {
                    const rawPayload = JSON.parse(fs.readFileSync(finalUiPayloadPath, "utf-8"));
                    panel.webview.postMessage({ command: "updateGraphData", payload: rawPayload.graph });
                } catch (err) {
                    logOutputChannel.appendLine(`[ERROR] Failed to parse UI payload JSON structure: ${err}`);
                }
            }
        } else {
            logOutputChannel.appendLine(`[ERROR] Python background process exited with non-zero exit code: ${code}`);
            panel.webview.postMessage({ command: "updateStatus", payload: "error" });
        }
    });
}

function sendConfig(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    const host = VsCodeSettings.get('neo4j.host') || 'localhost';
    const portHttp = VsCodeSettings.get('neo4j.port.http') || 7474;
    const neo4jUrl = `http://${host}:${portHttp}/browser/preview/`;

    panel.webview.postMessage({
        command: 'setConfig',
        config: {
            entitiesTypesList: VsCodeSettings.get('entitiesTypesList'),
            regexFilterEnabled: VsCodeSettings.get('regexFilterEnabled'),
            treeFilterEnabled: VsCodeSettings.get('treeFilterEnabled'),
            geminiApiKey: VsCodeSettings.get('geminiApiKey'),
            tooltipDelay: VsCodeSettings.get('tooltipDelay') ?? 2000,
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

export function deactivate() {
    if (activeChildProcess) {
        try { activeChildProcess.kill('SIGKILL'); } catch(e){}
    }
}
EOF

# Build project to ensure updates are verified and compiled correctly
npm run compile

echo "✅ feat: Integrated real-time log stream routing into a native VS Code Output Channel named 'graph-rag-explorer'!"
