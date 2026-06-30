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
            uri: graphConfig.get("neo4j.uri") ?? "bolt://localhost:7687",
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
    panel.webview.postMessage({
        command: 'setConfig',
        config: {
            EntitiesTypesList: config.get('EntitiesTypesList'),
            regexFilterEnabled: config.get('regexFilterEnabled'),
            TreeFilterEnabled: config.get('TreeFilterEnabled'),
            geminiApiKey: config.get('geminiApiKey'),
            tooltipDelay: config.get('tooltipDelay') ?? 2000,
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
    </head>
    <body class="h-full overflow-hidden select-none">
        <div id="root" class="h-full flex flex-col"></div>
        <script src="${scriptUri}"></script>
    </body></html>`;
}

export function deactivate() {}
