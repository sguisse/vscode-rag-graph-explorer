#!/usr/bin/env bash
set -e

mkdir -p webview/src/features/exporter/hooks
mkdir -p backend/src

# 1. Update use-export-configuration.ts to inspect both msg.payload and msg.paths
cat << 'EOF' > webview/src/features/exporter/hooks/use-export-configuration.ts
import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { fileExporterHistoryApiService } from '@/services/api/file-exporter-history-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
import { vsCodeBackendMessageHandler } from '@/services/listener/vscode-backend-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { PathMappingService } from '../utils/path-resolver';
import { ExporterValidatorService } from '../utils/validator.service';
import { normalizeExportConfig } from '../utils/exporter-config.normalizer';
import {
  EXPORTER_CODEBASE_ADD_PATHS,
  EXPORTER_CODEBASE_EXCLUDE_PATHS,
  EXPORTER_REFERENCE_ADD_PATHS,
  EXPORTER_REFERENCE_EXCLUDE_PATHS,
} from "@/shared/config/vscode-message-command.constants";

export type ExporterScope = 'codebase' | 'reference';

export function useExportConfiguration() {
  const store = useExporterStore();

  // Mutualized helper to append paths to specified scope (codebase or reference)
  const addPathsInConfig = (absPaths: string[], scope: ExporterScope = 'codebase') => {
    const wsRoot = store.workspaceRoot;
    const expandedList = (absPaths || [])
      .flatMap((p) => String(p || '').split(/[,\n\r]+/))
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedList = expandedList
      .map((p) => PathMappingService.registerPath(p, wsRoot))
      .filter(Boolean);

    store.setConfig((prev) => {
      const current = (prev[scope]?.src || '')
        .split(/[,\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const combined = Array.from(new Set([...current, ...formattedList]));
      return {
        ...prev,
        [scope]: { ...prev[scope], src: combined.join('\n') },
      };
    });
  };

  // Mutualized helper to append exclude regex patterns to specified scope (codebase or reference)
  const addExcludePathsInConfig = (absPaths: string[], scope: ExporterScope = 'codebase') => {
    const wsRootPath = store.workspaceRoot ? store.workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';

    const newEntries: string[] = [];

    (absPaths || []).forEach((rawPath) => {
      if (!rawPath || !rawPath.trim()) return;
      const cleanRaw = rawPath.trim().replace(/\\/g, '/');
      let relativePath = cleanRaw;
      if (wsRootPath && cleanRaw.startsWith(wsRootPath)) {
        relativePath = cleanRaw.slice(wsRootPath.length);
      }
      relativePath = relativePath.replace(/^\/+/, '');
      const escapedPath = relativePath.replace(/[-\\^\$*+?.()|[\]{}]/g, '\\$&');

      let isFolder = true;
      if (cleanRaw.includes('.')) {
        const lastSegment = cleanRaw.split('/').pop();
        if (lastSegment && lastSegment.includes('.')) isFolder = false;
      }

      const regexEntry = isFolder ? `.*/${escapedPath}/.*` : `.*/${escapedPath}$`;
      newEntries.push(regexEntry);
    });

    if (newEntries.length === 0) return;

    store.setConfig((prev) => {
      const currentLines = (prev[scope]?.exc_paths || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const combined = Array.from(new Set([...currentLines, ...newEntries]));

      return {
        ...prev,
        [scope]: {
          ...prev[scope],
          exc_paths: combined.join('\n'),
        },
      };
    });

    const scopeLabel = scope === 'codebase' ? 'Codebase' : 'Reference';
    fileExporterApiService.showNotification('info', `Added ${newEntries.length} pattern(s) to ${scopeLabel} Exclude Paths`);
  };

  useEffect(() => {
    logInfo('[useExportConfiguration] Initializing exporter configuration and message listeners...');

    const init = async () => {
      try {
        const res = await fileExporterApiService.getInitialState();
        const normDefault = normalizeExportConfig(res.defaultConfig);
        const normCurrent = normalizeExportConfig(res.currentConfig);
        const normHistory = (res.history || []).map((h) => ({
          ...h,
          config: normalizeExportConfig(h.config),
        }));

        store.setInitialData({
          defaultConfig: normDefault,
          config: normCurrent,
          historyList: normHistory,
          selectedProfileId: res.selectedId,
          historyViewMode: res.historyViewMode,
          currentRepo: res.currentRepo,
          workspaceRoot: res.workspaceRoot,
          fileExtsCategoryGroups: res.fileExtsCategoryGroups,
          exchangeLinks: res.exchange,
          pendingPaths: res.pendingPaths || [],
        });
      } catch (e) {
        console.error('[useExportConfiguration] Error initializing exporter state:', e);
      }
    };

    init();

    // Codebase scope listeners
    const unsubscribeCodebaseAdd = vsCodeBackendMessageHandler.on(EXPORTER_CODEBASE_ADD_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const newPaths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsInConfig(newPaths, 'codebase');
      }
    });

    const unsubscribeCodebaseExclude = vsCodeBackendMessageHandler.on(EXPORTER_CODEBASE_EXCLUDE_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const paths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addExcludePathsInConfig(paths, 'codebase');
      }
    });

    // Reference scope listeners
    const unsubscribeReferenceAdd = vsCodeBackendMessageHandler.on(EXPORTER_REFERENCE_ADD_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const newPaths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsInConfig(newPaths, 'reference');
      }
    });

    const unsubscribeReferenceExclude = vsCodeBackendMessageHandler.on(EXPORTER_REFERENCE_EXCLUDE_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const paths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addExcludePathsInConfig(paths, 'reference');
      }
    });

    return () => {
      unsubscribeCodebaseAdd();
      unsubscribeCodebaseExclude();
      unsubscribeReferenceAdd();
      unsubscribeReferenceExclude();
    };
  }, [store.workspaceRoot]);

  useEffect(() => {
    const codebaseErr = ExporterValidatorService.validatePathList(store.config.codebase.src || '', store.invalidPaths);
    const destErr = ExporterValidatorService.validateDestDir(store.config.dest || '');
    const maxFileErr = ExporterValidatorService.validateMaxFile(store.config.codebase.max_file || '');
    const maxChunkErr = ExporterValidatorService.validateMaxChunk(store.config.max_chunk || '');
    const incPathsErr = ExporterValidatorService.validateRegexSyntax(store.config.codebase.inc_paths || '');
    const excPathsErr = ExporterValidatorService.validateRegexSyntax(store.config.codebase.exc_paths || '');
    const incExtErr = ExporterValidatorService.validateRegexSyntax(store.config.codebase.inc_ext || '');
    const excExtErr = ExporterValidatorService.validateRegexSyntax(store.config.codebase.exc_ext || '');

    store.setValidationState({
      codebasePathListInvalid: Boolean(codebaseErr),
      destDirInvalid: Boolean(destErr),
      maxFileInvalid: Boolean(maxFileErr),
      maxChunkInvalid: Boolean(maxChunkErr),
      errors: {
        codebase_src: codebaseErr,
        dest: destErr,
        max_file: maxFileErr,
        max_chunk: maxChunkErr,
        inc_paths: incPathsErr,
        exc_paths: excPathsErr,
        inc_ext: incExtErr,
        exc_ext: excExtErr,
      },
    });
  }, [
    store.config.codebase,
    store.config.reference,
    store.config.dest,
    store.config.max_chunk,
    store.invalidPaths,
  ]);

  const handleAddOpenFiles = async () => {
    try {
      const currentDisplayLines = (store.config.codebase.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const openFiles = await fileExporterApiService.getOpenEditorFiles(currentAbsPaths);
      addPathsInConfig(openFiles, 'codebase');
      fileExporterApiService.showNotification('info', `Added open editor files (${openFiles.length} total paths)`);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error adding open files:', [err]);
    }
  };

  const handleAddGitDiffFiles = async () => {
    try {
      const currentDisplayLines = (store.config.codebase.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const gitFiles = await fileExporterApiService.getGitDiffFiles(currentAbsPaths);
      addPathsInConfig(gitFiles, 'codebase');
      fileExporterApiService.showNotification('info', `Added modified Git files (${gitFiles.length} total paths)`);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error adding Git diff files:', [err]);
    }
  };

  const handleCopyLatestFiles = async () => {
    try {
      const res = await fileExporterApiService.copyLatestExportedFiles(store.config.dest);
      fileExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error copying latest files:', [err]);
    }
  };

  const handleClearDestDir = async () => {
    try {
      const res = await fileExporterApiService.clearDestDirectory(store.config.dest);
      fileExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error clearing dest dir:', [err]);
    }
  };

  const handleOpenErrorModal = () => store.setModalState({ isErrorModalOpen: true });
  const handleCloseErrorModal = () => store.setModalState({ isErrorModalOpen: false });

  const handleRevealDestination = async () => {
    const formattedDest = store.config.dest || 'Default directory';
    const absDest = PathMappingService.resolveToAbsolute(formattedDest, store.workspaceRoot);
    await vsCodeApiService.revealInOsExplorer(absDest);
  };

  const handleOpenCursorLinePath = async () => {
    const firstLine = (store.config.codebase.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)[0];
    if (firstLine) {
      const absPath = PathMappingService.resolveToAbsolute(firstLine, store.workspaceRoot);
      await fileExporterApiService.openPathAtCursor(absPath);
    }
  };

  return {
    ...store,
    addPathsToConfig: (absPaths: string[], scope: ExporterScope = 'codebase') => addPathsInConfig(absPaths, scope),
    addReferencePathsToConfig: (absPaths: string[]) => addPathsInConfig(absPaths, 'reference'),
    addExcludePathsInConfig: (absPaths: string[], scope: ExporterScope = 'codebase') => addExcludePathsInConfig(absPaths, scope),
    handleAddOpenFiles,
    handleAddGitDiffFiles,
    handleCopyLatestFiles,
    handleClearDestDir,
    handleOpenErrorModal,
    handleCloseErrorModal,
    handleRevealDestination,
    handleOpenCursorLinePath,
  };
}
EOF

# 2. Update backend extension-commands.ts to output both payload and paths properties
cat << 'EOF' > backend/src/extension-commands.ts
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
                payload: selectedPath,
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
EOF

echo "✅ fix(webview): Unified message payload/paths extraction in listeners to reliably intercept exporterCodebaseAddPaths commands"
