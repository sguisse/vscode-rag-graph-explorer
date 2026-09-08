import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logError, logInfo, logWarn } from './utils/utils-log';
import { currentWebviewPanel, EXTENSION_BASE_CONFIG_NAME } from './extension';
import {
    EXPORTER_CODEBASE_ADD_PATHS,
    EXPORTER_CODEBASE_EXCLUDE_PATHS,
    EXPORTER_REFERENCE_ADD_PATHS,
    EXPORTER_REFERENCE_EXCLUDE_PATHS,
    EXPLORER_ADD_PATHS,
    VsCodeCommand
} from '../../shared/config/vscode-message-command.constants';
import { serviceRegistry } from './core/ServiceRegistry';
import { ServiceEnum } from '../../shared/config/service-enum.gen';

export function registerVsCodeSubMenuitemCommands(openToolCmd: () => void, extentionContext: vscode.ExtensionContext) {

    // Register commands for Exporter Feature
    const tokenRazorExporterCodebaseAddPathsCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.codebase.addPaths`,
        createTokenRazorExporterPathsCommand(openToolCmd, EXPORTER_CODEBASE_ADD_PATHS)
    );
    const tokenRazorExporterCodebaseExcludePathsCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.codebase.excludePaths`,
        createTokenRazorExporterPathsCommand(openToolCmd, EXPORTER_CODEBASE_EXCLUDE_PATHS)
    );
    const tokenRazorExporterReferenceAddPathsCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.reference.addPaths`,
        createTokenRazorExporterPathsCommand(openToolCmd, EXPORTER_REFERENCE_ADD_PATHS)
    );
    const tokenRazorExporterReferenceExcludePathsCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.reference.excludePaths`,
        createTokenRazorExporterPathsCommand(openToolCmd, EXPORTER_REFERENCE_EXCLUDE_PATHS)
    );

    // Register commands for Explorer Feature
    const tokenRazorExplorerAddPathsCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.explorer.addPaths`,
        createTokenRazorExporterPathsCommand(openToolCmd, EXPLORER_ADD_PATHS)
    );

    // Register commands for Global Exports from vscode explorer - Clipboard Operations
    const tokenRazorExporterExportSelectedPathsToClipboardCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.exportSelectedPathsToClipboard`,
        createExporterExportSelectedPathsToClipboardCommand()
    );
    const tokenRazorExporterCopySelectedFilesToClipboardCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.copySelectedFilesToClipboard`,
        createExporterCopySelectedFilesToClipboardCommand()
    );
    const tokenRazorExporterCopySelectedPathsToClipboardCmd = vscode.commands.registerCommand(
        `${EXTENSION_BASE_CONFIG_NAME}.exporter.copySelectedPathsToClipboard`,
        createExporterCopySelectedPathsToClipboardCommand()
    );

    extentionContext.subscriptions.push(
        tokenRazorExporterCodebaseAddPathsCmd,
        tokenRazorExporterCodebaseExcludePathsCmd,
        tokenRazorExporterReferenceAddPathsCmd,
        tokenRazorExporterReferenceExcludePathsCmd,

        tokenRazorExplorerAddPathsCmd,

        tokenRazorExporterExportSelectedPathsToClipboardCmd,
        tokenRazorExporterCopySelectedFilesToClipboardCmd,
        tokenRazorExporterCopySelectedPathsToClipboardCmd
    );
}

function createTokenRazorExporterPathsCommand(openTool: () => void, command: VsCodeCommand | string) {
    return (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        let paths: string[] = [];
        if (uris && uris.length > 0) {
            paths = uris.map((u) => u.fsPath);
        } else if (uri) {
            paths = [uri.fsPath];
        }

        const selectedPath = paths.join('\n');
        logInfo(`[Command] '${command}' triggered for path(s):\n${selectedPath}`);

        if (!currentWebviewPanel) {
            openTool();
        } else {
            currentWebviewPanel.reveal(vscode.ViewColumn.One);
        }

        if (currentWebviewPanel && selectedPath.length > 0) {
            currentWebviewPanel.webview.postMessage({
                command: command,
                paths: selectedPath
            });
        }
    };
}

function createExporterExportSelectedPathsToClipboardCommand() {
    return (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        const selectedUris = uris || (uri ? [uri] : []);
        const rootPaths = selectedUris.map((u) => u.fsPath).filter(Boolean);

        logInfo(`[Command] 'ExportSelectedPathsToClipboard' requested for ${rootPaths.length} paths.`);

        if (rootPaths.length === 0) {
            const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
            vsCodeService.showRichNotification("No files or directories selected.", { type: 'warn' });
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Exporting selected paths to OS clipboard...",
            cancellable: false
        }, async () => {
            const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
            try {
                const fileExporterService = serviceRegistry.get(ServiceEnum.FILE_EXPORTER);
                const result = await fileExporterService.copyFullContextToClipboard(rootPaths, [], '');

                if (result.success) {
                    await vsCodeService.showRichNotification(
                        `📋 ${result.message}`,
                        {
                            type: 'success',
                            header: 'Export Pipeline Completed',
                            message: `Successfully aggregated and copied <b>${result.fileCount}</b> file(s) to OS clipboard.`,
                            actions: [
                                { label: '📋 Copy Source Paths', command: 'copy_source_paths', data: { pathsToCopy: rootPaths } },
                                { label: 'Dismiss', command: 'close_notification' }
                            ]
                        },
                        (cmd, payload) => {
                            if (cmd === 'copy_source_paths' && payload?.pathsToCopy) {
                                vscode.env.clipboard.writeText(payload.pathsToCopy.join('\n'));
                            }
                        }
                    );
                } else {
                    await vsCodeService.showRichNotification(`Export failed: ${result.message}`, { type: 'error' });
                }
            } catch (err: any) {
                logError(`[Command] ExportSelectedPathsToClipboard error: ${err?.message || err}`);
                await vsCodeService.showRichNotification(`Export pipeline error: ${err?.message || err}`, { type: 'error' });
            }
        });
    };
}

function createExporterCopySelectedFilesToClipboardCommand() {
    return async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        const selectedUris = uris || (uri ? [uri] : []);
        const rootPaths = selectedUris.map((u) => u.fsPath).filter(Boolean);
        const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);

        logInfo(`[Command] 'CopySelectedFilesToClipboard' requested for ${rootPaths.length} paths.`);

        if (rootPaths.length === 0) {
            await vsCodeService.showRichNotification("No files or directories selected.", { type: 'warn' });
            return;
        }

        const absoluteFilePaths: string[] = [];
        let totalSizeBytes = 0;

        function resolveFilesRecursively(currentPath: string) {
            if (!fs.existsSync(currentPath)) return;
            const stat = fs.statSync(currentPath);
            if (stat.isFile()) {
                absoluteFilePaths.push(currentPath);
                totalSizeBytes += stat.size;
            } else if (stat.isDirectory()) {
                const children = fs.readdirSync(currentPath);
                for (const child of children) {
                    resolveFilesRecursively(path.join(currentPath, child));
                }
            }
        }

        for (const rootPath of rootPaths) {
            resolveFilesRecursively(rootPath);
        }

        if (absoluteFilePaths.length === 0) {
            await vsCodeService.showRichNotification("No files discovered within selected paths.", { type: 'warn' });
            return;
        }

        const FIVE_MEGABYTES = 5 * 1024 * 1024;
        if (absoluteFilePaths.length > 50 || totalSizeBytes > FIVE_MEGABYTES) {
            const formattedSize = totalSizeBytes >= 1024 * 1024
                ? `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                : `${(totalSizeBytes / 1024).toFixed(2)} KB`;

            const confirmation = await vscode.window.showWarningMessage(
                `⚠️ Large Clipboard Payload Warning\n\nYou are attempting to copy ${absoluteFilePaths.length} files totaling ${formattedSize} directly into your OS clipboard. Large copy transfers can occasionally cause micro-stuttering. Do you want to continue?`,
                { modal: true },
                "Copy Anyway"
            );

            if (confirmation !== "Copy Anyway") {
                return;
            }
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Copying selected files to clipboard...",
            cancellable: false
        }, async () => {
            try {
                const fileExporterService = serviceRegistry.get(ServiceEnum.FILE_EXPORTER);
                const result = await fileExporterService.copySelectedFilesToClipboard(rootPaths);

                if (result.success) {
                    await vsCodeService.showRichNotification(`📋 ${result.message}`, { type: 'success' });
                } else {
                    await vsCodeService.showRichNotification(result.message, { type: 'warn' });
                }
            } catch (err: any) {
                logError(`[Command] CopySelectedFilesToClipboard error: ${err?.message || err}`);
                await vsCodeService.showRichNotification(`Clipboard pipeline error: ${err?.message || err}`, { type: 'error' });
            }
        });
    };
}

function createExporterCopySelectedPathsToClipboardCommand() {
    return async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        const selectedUris = uris || (uri ? [uri] : []);
        const rootPaths = selectedUris.map((u) => u.fsPath).filter(Boolean);
        const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);

        logInfo(`[Command] 'CopySelectedPathsToClipboard' requested for ${rootPaths.length} paths.`);

        if (rootPaths.length === 0) {
            await vsCodeService.showRichNotification("No files or directories selected.", { type: 'warn' });
            return;
        }

        try {
            const selectedPathsString = rootPaths.join('\n');
            await vscode.env.clipboard.writeText(selectedPathsString);
            await vsCodeService.showRichNotification(`📋 Successfully copied ${rootPaths.length} path(s) to OS clipboard.`, { type: 'info' });
        } catch (err: any) {
            logError(`[Command] CopySelectedPathsToClipboard error: ${err?.message || err}`);
            await vsCodeService.showRichNotification(`Failed to copy paths to clipboard: ${err?.message || err}`, { type: 'error' });
        }
    };
}
