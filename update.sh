#!/usr/bin/env bash
set -e

echo "⚙️  Mise à niveau de l'architecture des logs (Horodatage fin, Rotation & UI Default)..."

# ==============================================================================
# 1. MISE À JOUR DE PACKAGE.JSON (Déclaration des nouvelles configurations)
# ==============================================================================
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
          "items": { "type": "string" },
          "default": ["file", "class", "method", "document"]
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
        "graphRagExplorer.includePatterns": {
          "type": "array",
          "description": "List of regex patterns to explicitly restrict the scope of graph analysis.",
          "items": { "type": "string" },
          "default": []
        },
        "graphRagExplorer.excludePatterns": {
          "type": "array",
          "description": "List of regex patterns to explicitly exclude from code analysis.",
          "items": { "type": "string" },
          "default": ["**/node_modules/**", "**/target/**", "**/dist/**", "**/.git/**"]
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

# ==============================================================================
# 2. CONFIGURATION DE SRC/EXTENSION.TS (Transmission des préférences de logs)
# ==============================================================================
cat << 'EOF' > src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
            const relativePath = vscode.workspace.asRelativePath(document.uri);
            runPythonScan(context, panel, "delta", relativePath);
        });
        context.subscriptions.push(saveListener);

        panel.onDidDispose(() => { saveListener.dispose(); });

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'ready') {
                sendConfig(panel);
                runPythonScan(context, panel, "deep");
            } else if (message.command === 'forceRefreshScan') {
                runPythonScan(context, panel, "deep");
            } else if (message.command === 'nodeSelected' && message.id) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const radiusPath = path.join(workspaceFolders[0].uri.fsPath, ".codegraph", "blast_radius.json");
                    if (fs.existsSync(radiusPath)) {
                        try {
                            const report = JSON.parse(fs.readFileSync(radiusPath, "utf-8"));
                            panel.webview.postMessage({ command: 'blastRadiusReport', payload: report });
                        } catch(e){}
                    }
                }
                sendConfig(panel);
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
    const targetDir = path.join(workspaceRoot, ".graph-rag-explorer");
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
    const outputDir = path.join(workspaceRoot, ".codegraph");
    const targetDir = path.join(workspaceRoot, ".graph-rag-explorer");

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
        includePatterns: graphConfig.get("includePatterns") || [],
        excludePatterns: graphConfig.get("excludePatterns") || [],
        logFileEnabled: graphConfig.get("logFileEnabled") ?? true,
        logFileMaxSize: graphConfig.get("logFileMaxSize") ?? 5,
        logFileMaxCountRetension: graphConfig.get("logFileMaxCountRetension") ?? 5
    };

    const child = cp.spawn("python3", args, { cwd: workspaceRoot, env: { ...process.env, PYTHONPATH: targetDir } });
    child.stdin.write(JSON.stringify(payloadConfig));
    child.stdin.end();

    child.stdout.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "info")));
    child.stderr.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "error")));

    child.on("close", (code: number) => {
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
            callersDepth: config.get('callersDepth') ?? 1,
            calleesDepth: config.get('calleesDepth') ?? 1
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

# ==============================================================================
# 3. MISE À JOUR DE TERMINALTAB.TSX (Positionnement par défaut sur 'info')
# ==============================================================================
cat << 'EOF' > src/webview/components/TerminalTab.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';

interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

interface TerminalTabProps {
    logs: LogEntry[];
    clearLogs: () => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({ logs, clearLogs }) => {
    // FIX : La combo de l'écran terminal est désormais positionnée sur Info ('info') par défaut
    const [selectedLevel, setSelectedLevel] = useState<string>('info');
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = () => {
        const textToCopy = filteredLogs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const severityMap: Record<string, number> = {
        'debug': 0,
        'info': 1,
        'warn': 2,
        'error': 3
    };

    const filteredLogs = useMemo(() => {
        const targetSeverity = severityMap[selectedLevel] ?? 1;
        return logs.filter(log => (severityMap[log.level] ?? 1) >= targetSeverity);
    }, [logs, selectedLevel]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredLogs]);

    const getLogColor = (level: string) => {
        switch (level) {
            case 'debug': return 'text-gray-400';
            case 'info': return 'text-blue-400';
            case 'warn': return 'text-yellow-500 font-semibold';
            case 'error': return 'text-red-500 font-bold';
            default: return 'text-white';
        }
    };

    return (
        <div className="w-full h-full p-6 flex flex-col overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4">
                <div className="bg-[var(--vscode-editorWidget-background)] p-4 rounded-xl border border-[var(--vscode-panel-border)] shadow-md flex items-center justify-between flex-shrink-0 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="codicon codicon-terminal text-blue-500 text-lg"></span>
                        <h2 className="text-xs font-bold tracking-wide uppercase text-[var(--vscode-foreground)]">Backend Script Runtime Monitor</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">Filter Level:</label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] shadow-sm px-2 py-1 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none text-xs font-semibold cursor-pointer"
                        >
                            <option value="debug">🪲 Debug</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warn">⚠️ Warn</option>
                            <option value="error">❌ Error</option>
                        </select>
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 hover:text-blue-400 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                            <span className={"codicon " + (copied ? "codicon-check" : "codicon-copy")}></span> {copied ? "Copied!" : "Copy Logs"}
                        </button>
                        <button onClick={clearLogs} className="px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5">
                            <span className="codicon codicon-trash"></span> Clear Output
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-black rounded-lg border border-[var(--vscode-panel-border)] p-4 font-mono text-xs overflow-y-auto shadow-inner flex flex-col gap-1 selection:bg-blue-500/30 select-text">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, idx) => (
                          <div key={idx} className="flex items-start gap-2 leading-relaxed whitespace-pre-wrap break-all">
                              <span className="text-gray-500 select-none flex-shrink-0">[{log.timestamp}]</span>
                              <span className={getLogColor(log.level)}>{log.message}</span>
                          </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 italic select-none">
                            <span className="codicon codicon-blank text-3xl mb-2 opacity-40"></span>
                            No log traces captured matching current severity filter level constraint.
                        </div>
                    )}
                    <div ref={terminalEndRef} />
                </div>
            </div>
        </div>
    );
};
EOF

# ==============================================================================
# 4. SCRIPTS/CORE/UTILS.PY (Moteur d'horodatage fin & Auto-rotation cyclique)
# ==============================================================================
cat << 'EOF' > scripts/core/utils.py
import os
import sys
from datetime import datetime

# Variables d'état globales pour la redirection et la rotation
LOG_ENABLED = True
MAX_SIZE_MB = 5
MAX_RETENTION = 5
WORKSPACE_ROOT = None
CURRENT_FILE_INDEX = 1

def configure_logger(workspace_root: str, enabled: bool, max_size: int, retention: int):
    """
    Configure dynamiquement les paramètres de persistance des logs.
    Scanne le disque pour reprendre sur le fichier actif existant.
    """
    global LOG_ENABLED, MAX_SIZE_MB, MAX_RETENTION, WORKSPACE_ROOT, CURRENT_FILE_INDEX
    WORKSPACE_ROOT = workspace_root
    LOG_ENABLED = enabled
    MAX_SIZE_MB = max_size
    MAX_RETENTION = retention

    if LOG_ENABLED and WORKSPACE_ROOT:
        logs_dir = os.path.join(WORKSPACE_ROOT, ".graph-rag-explorer", "logs")
        os.makedirs(logs_dir, exist_ok=True)

        # Identification de l'index actif existant sur le disque
        active_idx = 1
        for i in range(1, 100):
            if os.path.exists(os.path.join(logs_dir, f"graph-rag-explorer-{i:02d}.log")):
                active_idx = i
        CURRENT_FILE_INDEX = active_idx

def _log(level: str, component: str, message: str, flush: bool = True):
    """
    Méthode interne de formatage avec patron d'horodatage YYYY/MM/DD-HH-mm-ss-sss
    Gère la redirection concurrente sécurisée et la rotation cyclique de 01 à 99.
    """
    global CURRENT_FILE_INDEX

    # Génération du format strict demandé : YYYY/MM/DD-HH-mm-ss-sss
    now = datetime.now()
    timestamp = now.strftime("%Y/%m/%d-%H-%M-%S-%f")[:-3]
    full_message = f"[{timestamp}] {level} [{component}] {message}"

    # Émission immédiate sur la sortie standard de contrôle (interceptée par VS Code)
    if "ERROR" in level or "WARN" in level:
        print(full_message, file=sys.stderr, flush=flush)
    else:
        print(full_message, file=sys.stdout, flush=flush)

    # Redirection vers fichier rotatif local si activé
    if LOG_ENABLED and WORKSPACE_ROOT:
        try:
            logs_dir = os.path.join(WORKSPACE_ROOT, ".graph-rag-explorer", "logs")
            log_file_path = os.path.join(logs_dir, f"graph-rag-explorer-{CURRENT_FILE_INDEX:02d}.log")

            # Vérification de la contrainte de taille (Mo -> Octets)
            if os.path.exists(log_file_path) and os.path.getsize(log_file_path) >= (MAX_SIZE_MB * 1024 * 1024):
                CURRENT_FILE_INDEX += 1

                # Gestion des bornes d'arrêt : retour cyclique à 01 si dépassement de la rétention ou de 99
                if CURRENT_FILE_INDEX > MAX_RETENTION or CURRENT_FILE_INDEX > 99:
                    CURRENT_FILE_INDEX = 1

                log_file_path = os.path.join(logs_dir, f"graph-rag-explorer-{CURRENT_FILE_INDEX:02d}.log")
                if os.path.exists(log_file_path):
                    os.remove(log_file_path) # Écrase le fichier recyclé pour démarrer une nouvelle rotation

            with open(log_file_path, "a", encoding="utf-8") as lf:
                lf.write(full_message + "\n")
        except Exception:
            pass

def _format_args(*args) -> str:
    return " ".join(str(arg) for arg in args)

def debug(*args, component: str = "Backend", flush: bool = True):
    _log("🪲 [DEBUG]", component, _format_args(*args), flush=flush)

def info(*args, component: str = "Backend", flush: bool = True):
    _log("ℹ️ [INFO]", component, _format_args(*args), flush=flush)

def warn(*args, component: str = "Backend", flush: bool = True):
    _log("⚠️ [WARN]", component, _format_args(*args), flush=flush)

def error(*args, component: str = "Backend", flush: bool = True):
    _log("❌ [ERROR]", component, _format_args(*args), flush=flush)

def success(*args, component: str = "Backend", flush: bool = True):
    _log("✅ [SUCCESS]", component, _format_args(*args), flush=flush)
EOF

# ==============================================================================
# 5. SCRIPTS/CORE/MAIN.PY (Initialisation hâtive du Logger depuis stdin)
# ==============================================================================
cat << 'EOF' > scripts/core/main.py
import argparse
import json
import sys
import shutil
from discovery import PathFilter, WorkspaceScanner
from graph_engine import GraphEngine
from orchestrator import ParallelOrchestrator
from reconciler import PolyglotReconciler
from utils import debug, info, warn, error, success, configure_logger

def main():
    parser = argparse.ArgumentParser(description="Graph RAG Explorer - Core Engine Entrypoint")
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--output", default=".codegraph")
    args = parser.parse_args()

    # Ingestion hâtive du flux de configuration pour initialiser le logger de fichiers
    try:
        config = json.loads(sys.stdin.read())
    except Exception:
        config = {}

    # Bootstrap du logger avec les paramètres de configuration utilisateurs
    configure_logger(
        workspace_root=args.workspace,
        enabled=config.get("logFileEnabled", True),
        max_size=config.get("logFileMaxSize", 5),
        retention=config.get("logFileMaxCountRetension", 5)
    )

    info("Point d'entrée exécutable du moteur Graph RAG activé.", component="Main")
    debug(f"Arguments reçus -> Workspace: {args.workspace} | Target: {args.output}", component="Main")

    path_filter = PathFilter(config.get("includePatterns", []), config.get("excludePatterns", []))
    scanner = WorkspaceScanner(args.workspace, path_filter)
    graph_engine = GraphEngine()
    orchestrator = ParallelOrchestrator(graph_engine)

    partitions = scanner.scan_and_partition()
    if partitions.get("JAVA") and not shutil.which("mvn"):
        warn("Maven (mvn) absent des variables d'environnement locales.", component="Main")
    if partitions.get("TS_JS") and not shutil.which("npm"):
        warn("npm/NodeJS absent des variables d'environnement locales.", component="Main")

    orchestrator.execute_analysis_pool(partitions)
    PolyglotReconciler.reconcile_api_routes(graph_engine)
    graph_engine.save_to_workspace(args.output)
    success("Processus d'indexation structurelle terminé.", component="Main")

if __name__ == "__main__":
    main()
EOF

# ==============================================================================
# 6. SCRIPTS/CORE/GIT_DELTA.PY (Initialisation hâtive du Logger en mode Delta)
# ==============================================================================
cat << 'EOF' > scripts/core/git_delta.py
import argparse
import json
import os
import sys
import networkx as nx
from utils import debug, info, warn, error, success, configure_logger

class GitDeltaAnalyzer:
    def __init__(self, workspace_root: str, graph_cache_dir: str):
        self.workspace_root = os.path.abspath(workspace_root)
        self.graph_cache_dir = os.path.abspath(graph_cache_dir)
        self.graph_json_path = os.path.join(self.graph_cache_dir, "graph.json")
        info(f"Initialisation de l'analyseur incrémental sur : {self.workspace_root}", component="GitDelta")

    def calculate_blast_radius(self, target_file: str):
        norm_target = target_file.replace("\\", "/")
        info(f"Analyse chirurgicale de Blast Radius pour : {norm_target}", component="GitDelta")

        if not os.path.exists(self.graph_json_path):
            error("Cache global graph.json introuvable. Effectuez un Deep Scan au préalable.", component="GitDelta")
            return

        with open(self.graph_json_path, "r", encoding="utf-8") as f:
            graph_data = json.load(f)

        G = nx.DiGraph()
        node_file_map = {}
        for node in graph_data.get("nodes", []):
            nid = node["id"]
            G.add_node(nid, **node)
            node_file_map[nid] = node.get("source_file", "").replace("\\", "/")

        for link in graph_data.get("links", []):
            G.add_edge(link["source"], link["target"], relation=link.get("relation", "relation"))

        impacted_seeds = []
        for nid, src_file in node_file_map.items():
            if norm_target in src_file or src_file in norm_target:
                impacted_seeds.append(nid)
                debug(f"Nœud graine localisé : [{nid}]", component="GitDelta")

        upstream_impacts = set()
        for seed in impacted_seeds:
            if G.has_node(seed):
                upstream_impacts.add(seed)
                ancestors = nx.ancestors(G, seed)
                upstream_impacts.update(ancestors)

        impacted_files, impacted_methods = set(), []
        for node_id in upstream_impacts:
            node_data = G.nodes[node_id]
            src_file = node_data.get("source_file", "")
            if src_file: impacted_files.add(src_file)
            if node_data.get("file_type") == "method":
                impacted_methods.append(f"{src_file} -> {node_data.get('label')}")

        report_payload = {
            "target_file": target_file, "impacted_nodes_count": len(upstream_impacts),
            "impacted_files": list(impacted_files), "impacted_methods": impacted_methods
        }

        json_out = os.path.join(self.graph_cache_dir, "blast_radius.json")
        md_out = os.path.join(self.graph_cache_dir, "blast_radius.md")

        with open(json_out, "w", encoding="utf-8") as f: json.dump(report_payload, f, indent=2, ensure_ascii=False)
        with open(md_out, "w", encoding="utf-8") as f:
            f.write("# GRAPH RAG EXPLORER - COGNITIVE IMPACT REPORT\n\n")
            f.write(f"### Cible modifiée : `{target_file}`\n\n")
            f.write("## 📂 Fichiers impactés par propagation\n")
            for f_path in sorted(list(impacted_files)): f.write(f"- [ ] `{f_path}`\n")
            f.write("\n## ⚡ Méthodes à tester en priorité\n")
            for m_sig in sorted(impacted_methods): f.write(f"- [ ] `{m_sig}`\n")

        success(f"Blast Radius calculé. Fichiers impactés : {len(impacted_files)}", component="GitDelta")

def main():
    parser = argparse.ArgumentParser(description="Deterministic Blast Radius Evaluation")
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--file", required=True)
    parser.add_argument("--output", default=".codegraph")
    args = parser.parse_args()

    try:
        config = json.loads(sys.stdin.read())
    except Exception:
        config = {}

    # Alignement du logger sur l'exécution chirurgicale delta
    configure_logger(
        workspace_root=args.workspace,
        enabled=config.get("logFileEnabled", True),
        max_size=config.get("logFileMaxSize", 5),
        retention=config.get("logFileMaxCountRetension", 5)
    )

    analyzer = GitDeltaAnalyzer(args.workspace, args.output)
    analyzer.calculate_blast_radius(args.file)

if __name__ == "__main__":
    main()
EOF

# ==============================================================================
# 7. NETTOYAGE DU CACHE ET COMPILATION FINALE
# ==============================================================================
echo "🧹 Nettoyage du dossier local de cache pour forcer la synchronisation..."
rm -rf .graph-rag-explorer

echo "⚙️ Validation syntaxique globale des scripts Python..."
python3 -m py_compile scripts/core/*.py

if [ -d "node_modules" ]; then
    echo "📦 Compilation finale de l'extension VS Code..."
    npm run compile
fi

echo "✅ [ SUCCÈS COMPLET ]. Toutes les exigences sont appliquées. Fais un 'Reload Window' dans VS Code !"
