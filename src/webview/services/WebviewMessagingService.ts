import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logError, logInfo, logWarn } from '@/common/utils/utils-log';
import { sendConfig } from './WebviewInitializerService';

/**
 * Handles incoming IPC messages from the webview.
 */
export async function handleWebviewMessage(
    message: any,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
): Promise<void> {
    switch (message.command) {
        case 'ready':
            handleReady(panel, context);
            break;

        case 'forceRefreshScan':
            handleForceRefreshScan(message, panel, context);
            break;

        case 'killAnalysis':
            handleKillAnalysis(panel);
            break;

        case 'openExternal':
            await handleOpenExternal(message);
            break;

        case 'revealFile':
            await handleRevealFile(message);
            break;
    }
}

// ============================================================================
// Command Handlers
// ============================================================================

function handleReady(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
    logInfo('Webview ready. Sending configuration and launching deep scan.');
    sendConfig(panel, context);
    // TODO pythonScanService.runPythonScan(context, panel, "deep");
}

function handleForceRefreshScan(
    message: any,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
): void {
    const mode = message.mode || "deep";
    let targetFile = "";
    logInfo(`Force refresh scan requested. Mode: ${mode}`);

    if (mode === "delta") {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.scheme === 'file') {
            targetFile = vscode.workspace.asRelativePath(activeEditor.document.uri);
        } else {
            vscode.window.showWarningMessage("Delta Reload parsing rules require an active text file window context.");
            logWarn('Delta Reload aborted: No active text file window context found.');
            panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
            return;
        }
    }

    // pythonScanService.runPythonScan(context, panel, mode, targetFile);
}

function handleKillAnalysis(panel: vscode.WebviewPanel): void {
    logInfo('Manual analysis termination requested by user.');
   //pythonScanService.killActiveProcess();
    panel.webview.postMessage({ command: "updateStatus", payload: "ready" });
}

async function handleOpenExternal(message: any): Promise<void> {
    if (!message.url) {
        return;
    }

    try {
        logInfo(`Opening external URL: ${message.url}`);
        await vscode.env.openExternal(vscode.Uri.parse(message.url));
    } catch (err) {
        logError(`Failed to open external URL: ${message.url}`);
        vscode.window.showErrorMessage(`Failed to open external link: ${message.url}`);
    }
}

async function handleRevealFile(message: any): Promise<void> {
    if (!message.path) {
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceRoot = workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].uri.fsPath
        : '';
    const fullPath = path.isAbsolute(message.path)
        ? message.path
        : path.join(workspaceRoot, message.path);

    if (fs.existsSync(fullPath)) {
        try {
            logInfo(`Revealing file: ${message.path}`);
            const doc = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(doc, {
                viewColumn: message.openEditor ? vscode.ViewColumn.One : undefined,
                preserveFocus: !message.openEditor
            });
        } catch (err) {
            logError(`Error opening text document: ${err}`);
        }
    }
}
