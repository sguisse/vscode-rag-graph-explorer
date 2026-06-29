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
                        vscode.window.showWarningMessage("Delta Reload parsing rules require an active text file layout window to be focused.");
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

    const child = childProcess.spawn("python3", args, { cwd: workspaceRoot, env: { ...process.env, PYTHONPATH: path.join(targetDir, "core") } });
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
        <script src="https://cdn.tailwindcss.com"></script>
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
