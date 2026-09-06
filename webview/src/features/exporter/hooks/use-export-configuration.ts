import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { fileExporterHistoryApiService } from '@/services/api/file-exporter-history-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { PathMappingService } from '../utils/path-resolver';
import { ExporterValidatorService } from '../utils/validator.service';

export function useExportConfiguration() {
  const store = useExporterStore();

  const addPathsToConfig = (absPaths: string[]) => {
    const wsRoot = store.workspaceRoot;
    const expandedList = (absPaths || [])
      .flatMap((p) => String(p || '').split(/[,\n\r]+/))
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedList = expandedList
      .map((p) => PathMappingService.registerPath(p, wsRoot))
      .filter(Boolean);

    store.setConfig((prev) => {
      const current = (prev.codebase.src || '')
        .split(/[,\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const combined = Array.from(new Set([...current, ...formattedList]));
      return {
        ...prev,
        codebase: { ...prev.codebase, src: combined.join('\n') },
      };
    });
  };

  const addReferencePathsToConfig = (absPaths: string[]) => {
    const wsRoot = store.workspaceRoot;
    const expandedList = (absPaths || [])
      .flatMap((p) => String(p || '').split(/[,\n\r]+/))
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedList = expandedList
      .map((p) => PathMappingService.registerPath(p, wsRoot))
      .filter(Boolean);

    store.setConfig((prev) => {
      const current = (prev.reference.src || '')
        .split(/[,\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const combined = Array.from(new Set([...current, ...formattedList]));
      return {
        ...prev,
        reference: { ...prev.reference, src: combined.join('\n') },
      };
    });
  };

  useEffect(() => {
    logInfo('[useExportConfiguration] Initializing exporter configuration hook...');
    store.fetchInitialState();

    const unsubscribeSelectedPath = vsCodeHandleMessage.on('selectedPath', (msg) => {
      if (msg.payload) {
        logInfo('[useExportConfiguration] Received selectedPath message', [msg.payload]);
        const newPaths = String(msg.payload || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsToConfig(newPaths);
      }
    });

    const unsubscribeUpdatePaths = vsCodeHandleMessage.on('updatePaths', (msg) => {
      if (Array.isArray(msg.paths)) {
        logInfo('[useExportConfiguration] Received updatePaths message', [msg.paths]);
        const newPaths = msg.paths.flatMap((p) => String(p || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean));
        addPathsToConfig(newPaths);
      }
    });

    return () => {
      unsubscribeSelectedPath();
      unsubscribeUpdatePaths();
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
      addPathsToConfig(openFiles);
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
      addPathsToConfig(gitFiles);
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
    addPathsToConfig,
    addReferencePathsToConfig,
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
