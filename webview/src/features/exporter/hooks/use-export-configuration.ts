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
      if (msg.payload) {
        logInfo(`[useExportConfiguration] Received ${msg.command} message`, [msg.payload]);
        const newPaths = String(msg.payload || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsInConfig(newPaths, 'codebase');
      }
    });

    const unsubscribeCodebaseExclude = vsCodeBackendMessageHandler.on(EXPORTER_CODEBASE_EXCLUDE_PATHS, (msg) => {
      if (msg.payload) {
        logInfo(`[useExportConfiguration] Received ${msg.command} message`, [msg.payload]);
        const paths = String(msg.payload || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addExcludePathsInConfig(paths, 'codebase');
      }
    });

    // Reference scope listeners
    const unsubscribeReferenceAdd = vsCodeBackendMessageHandler.on(EXPORTER_REFERENCE_ADD_PATHS, (msg) => {
      if (msg.payload) {
        logInfo(`[useExportConfiguration] Received ${msg.command} message`, [msg.payload]);
        const newPaths = String(msg.payload || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsInConfig(newPaths, 'reference');
      }
    });

    const unsubscribeReferenceExclude = vsCodeBackendMessageHandler.on(EXPORTER_REFERENCE_EXCLUDE_PATHS, (msg) => {
      if (msg.payload) {
        logInfo(`[useExportConfiguration] Received ${msg.command} message`, [msg.payload]);
        const paths = String(msg.payload || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
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
