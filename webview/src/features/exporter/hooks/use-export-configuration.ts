import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { filesExporterHistoryApiService } from '@/services/api/files-exporter-history-api.service.gen';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '../utils/log-info';
import { PathMappingService } from '../utils/path-resolver';
import { ExporterValidatorService } from '../utils/validator.service';

export function useExportConfiguration() {
  const store = useExporterStore();

  const addPathsToConfig = (absPaths: string[]) => {
    const wsRoot = store.workspaceRoot;
    const expandedList = absPaths
      .flatMap((p) => String(p).split(/[,\n\r]+/))
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedList = expandedList
      .map((p) => PathMappingService.registerPath(p, wsRoot))
      .filter(Boolean);

    store.setConfig((prev) => {
      const current = prev.src
        ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)
        : [];
      const combined = Array.from(new Set([...current, ...formattedList]));
      return { ...prev, src: combined.join('\n') };
    });
  };

  useEffect(() => {
    logInfo('[useExportConfiguration] Initializing exporter configuration hook...');
    store.fetchInitialState();

    vsCodeApiService.getRepoName().then((repo) => {
      logInfo('[useExportConfiguration] Active repository:', repo);
    }).catch(() => {});

    const unsubscribeSelectedPath = vsCodeHandleMessage.on('selectedPath', (msg) => {
      if (msg.payload) {
        logInfo('[useExportConfiguration] Received selectedPath message', msg.payload);
        const newPaths = String(msg.payload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsToConfig(newPaths);
      }
    });

    const unsubscribeUpdatePaths = vsCodeHandleMessage.on('updatePaths', (msg) => {
      if (Array.isArray(msg.paths)) {
        logInfo('[useExportConfiguration] Received updatePaths message', msg.paths);
        const newPaths = msg.paths.flatMap((p) => String(p).split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
        addPathsToConfig(newPaths);
      }
    });

    return () => {
      unsubscribeSelectedPath();
      unsubscribeUpdatePaths();
    };
  }, [store.workspaceRoot]);

  // Execute real-time field validation whenever configuration or invalid paths change
  useEffect(() => {
    const srcErr = ExporterValidatorService.validatePathList(store.config.src, store.invalidPaths);
    const destErr = ExporterValidatorService.validateDestDir(store.config.dest);
    const maxFileErr = ExporterValidatorService.validateMaxFile(store.config.max_file);
    const maxChunkErr = ExporterValidatorService.validateMaxChunk(store.config.max_chunk);
    const incPathsErr = ExporterValidatorService.validateRegexSyntax(store.config.inc_paths);
    const excPathsErr = ExporterValidatorService.validateRegexSyntax(store.config.exc_paths);
    const incExtErr = ExporterValidatorService.validateRegexSyntax(store.config.inc_ext);
    const excExtErr = ExporterValidatorService.validateRegexSyntax(store.config.exc_ext);

    store.setValidationState({
      pathListInvalid: Boolean(srcErr),
      destDirInvalid: Boolean(destErr),
      maxFileInvalid: Boolean(maxFileErr),
      maxChunkInvalid: Boolean(maxChunkErr),
      errors: {
        src: srcErr,
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
    store.config.src,
    store.config.dest,
    store.config.max_file,
    store.config.max_chunk,
    store.config.inc_paths,
    store.config.exc_paths,
    store.config.inc_ext,
    store.config.exc_ext,
    store.invalidPaths,
  ]);

  // Perform path existence validation whenever source paths or workspace root changes
  useEffect(() => {
    const displayLines = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    if (displayLines.length === 0) {
      store.setInvalidPaths([]);
      return;
    }

    const resolvedAbsPaths = displayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

    fileSystemApiService
      .getInvalidPaths(resolvedAbsPaths, store.workspaceRoot)
      .then((invalid) => {
        store.setInvalidPaths(invalid || []);
      })
      .catch(() => {});
  }, [store.config.src, store.workspaceRoot]);

  useEffect(() => {
    const displayLines = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    const resolvedAbsPaths = displayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));
    const paths = resolvedAbsPaths.join(',');

    const cmd = `python3 files-exporter.py --src '${paths || '.'}' --dest '${store.config.dest}' --format '${store.config.format}' --max-file ${store.config.max_file} --max-chunk ${store.config.max_chunk}${
      store.config.groupByExt ? ' --group-ext' : ''
    }${store.config.logConsole ? ' --log-console' : ''}${store.config.generateTreeView ? ' --tree-view' : ''}`;
    store.setCompiledBashCmd(cmd);
  }, [store.config, store.workspaceRoot]);

  const handleAddOpenFiles = async () => {
    logInfo('[useExportConfiguration] handleAddOpenFiles starting...');
    try {
      const currentDisplayLines = store.config.src ? store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const openFiles = await filesExporterApiService.getOpenEditorFiles(currentAbsPaths);
      addPathsToConfig(openFiles);
      filesExporterApiService.showNotification('info', `Added open editor files (${openFiles.length} total paths)`);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error adding open files:', err);
    }
  };

  const handleAddGitDiffFiles = async () => {
    logInfo('[useExportConfiguration] handleAddGitDiffFiles starting...');
    try {
      const currentDisplayLines = store.config.src ? store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const gitFiles = await filesExporterApiService.getGitDiffFiles(currentAbsPaths);
      addPathsToConfig(gitFiles);
      filesExporterApiService.showNotification('info', `Added modified Git files (${gitFiles.length} total paths)`);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error adding Git diff files:', err);
    }
  };

  const handleCopyLatestFiles = async () => {
    logInfo('[useExportConfiguration] handleCopyLatestFiles starting...', store.config.dest);
    try {
      const res = await filesExporterApiService.copyLatestExportedFiles(store.config.dest);
      filesExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error copying latest files:', err);
    }
  };

  const handleClearDestDir = async () => {
    logInfo('[useExportConfiguration] handleClearDestDir starting...', store.config.dest);
    try {
      const res = await filesExporterApiService.clearDestDirectory(store.config.dest);
      filesExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error clearing dest dir:', err);
    }
  };

  const handleOpenErrorModal = () => {
    logInfo('[useExportConfiguration] handleOpenErrorModal starting...');
    store.setModalState({ isErrorModalOpen: true });
  };

  const handleCloseErrorModal = () => {
    logInfo('[useExportConfiguration] handleCloseErrorModal starting...');
    store.setModalState({ isErrorModalOpen: false });
  };

  const handleOpenHistoryFile = async () => {
    logInfo('[useExportConfiguration] handleOpenHistoryFile starting...');
    await filesExporterHistoryApiService.openHistoryFile();
  };

  const handleRevealHistoryFolder = async () => {
    logInfo('[useExportConfiguration] handleRevealHistoryFolder starting...');
    await filesExporterHistoryApiService.revealHistoryFile();
  };

  const handleRevealDestination = async () => {
    logInfo('[useExportConfiguration] handleRevealDestination starting...', store.config.dest);
    await filesExporterApiService.openPathAtCursor(store.config.dest);
  };

  const handleOpenCursorLinePath = async () => {
    logInfo('[useExportConfiguration] handleOpenCursorLinePath starting...');
    const firstLine = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)[0];
    if (firstLine) {
      const absPath = PathMappingService.resolveToAbsolute(firstLine, store.workspaceRoot);
      await filesExporterApiService.openPathAtCursor(absPath);
    }
  };

  return {
    ...store,
    addPathsToConfig,
    handleSelectProfile: async (id: string) => {
      logInfo('[useExportConfiguration] handleSelectProfile starting...', id);
      await store.selectProfile(id);
    },
    handleFreezeToggle: async (id: string) => {
      logInfo('[useExportConfiguration] handleFreezeToggle starting...', id);
      await store.freezeToggle(id);
    },
    handleResetConfig: () => {
      logInfo('[useExportConfiguration] handleResetConfig starting...');
      store.resetConfig();
    },
    handleRenameProfile: async (id: string, newName: string) => {
      logInfo('[useExportConfiguration] handleRenameProfile starting...', { id, newName });
      await store.renameProfile(id, newName);
    },
    handleDuplicateProfile: async (id: string) => {
      logInfo('[useExportConfiguration] handleDuplicateProfile starting...', id);
      await store.duplicateProfile(id);
    },
    handleAddProfile: async () => {
      logInfo('[useExportConfiguration] handleAddProfile starting...');
      await store.addProfile();
    },
    handleClearHistory: async () => {
      logInfo('[useExportConfiguration] handleClearHistory starting...');
      await store.clearHistoryWithMode('clear-all-hard');
    },
    handleAddOpenFiles,
    handleAddGitDiffFiles,
    handleCopyLatestFiles,
    handleClearDestDir,
    handleOpenErrorModal,
    handleCloseErrorModal,
    handleOpenHistoryFile,
    handleRevealHistoryFolder,
    handleRevealDestination,
    handleOpenCursorLinePath,
  };
}
