import { useExporterStore } from '../store/useExporterStore';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { ExporterValidatorService } from '../utils/validator.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { PathMappingService } from '../utils/path-resolver';
import { generateNewConfigName, generateDuplicateName } from '../utils/date-formatter';
import { isConfigDirty } from '../utils/config-dirty-checker';

export function useExporterExecution() {
  const store = useExporterStore();

  const selectedEntry = store.historyList.find((h) => h.id === store.selectedProfileId);
  const isDefault = store.selectedProfileId === 'default';
  const targetSavedConfig = isDefault ? store.defaultConfig : selectedEntry?.config;

  const isDirty = isConfigDirty(store.config, targetSavedConfig);

  const handleSaveConfig = async () => {
    logInfo('[useExporterExecution] handleSaveConfig starting...');
    const isFrozen = Boolean(selectedEntry?.frozen);

    if (isFrozen) {
      logInfo('[useExporterExecution] Profile is locked, opening SaveLockedProfileDialog');
      store.setModalState({ isSaveLockedModalOpen: true });
      return;
    }

    await store.saveProfile();
    filesExporterApiService.showNotification('info', 'Configuration saved successfully!');
  };

  const handleDuplicateFromSaveModal = async () => {
    logInfo('[useExporterExecution] handleDuplicateFromSaveModal starting...');
    store.setModalState({ isSaveLockedModalOpen: false });

    const id = store.selectedProfileId;
    const wsName =
      store.currentRepo ||
      (store.workspaceRoot ? store.workspaceRoot.split(/[/\\]/).pop() || '' : 'workspace');

    let newName = '';
    if (id === 'default') {
      newName = generateNewConfigName(wsName);
    } else {
      const targetEntry = store.historyList.find((h) => h.id === id);
      const originalName = targetEntry ? targetEntry.display : 'Default Configuration';
      const existingNames = store.historyList.map((h) => h.display);
      newName = generateDuplicateName(originalName, existingNames);
    }

    const newId = await store.addProfile(store.config);
    if (newId) {
      await store.renameProfile(newId, newName);
    }
  };

  const handleForceSaveFromSaveModal = async () => {
    logInfo('[useExporterExecution] handleForceSaveFromSaveModal starting...');
    store.setModalState({ isSaveLockedModalOpen: false });

    if (store.selectedProfileId !== 'default') {
      await store.freezeToggle(store.selectedProfileId);
      await store.saveProfile();
      filesExporterApiService.showNotification('info', 'Profile unlocked and configuration saved!');
    }
  };

  const handleRunExport = async () => {
    logInfo('[useExporterExecution] handleRunExport starting...');

    const validationErrors: string[] = [];

    const srcErr = ExporterValidatorService.validatePathList(store.config.src, store.invalidPaths);
    if (srcErr) validationErrors.push(`Source Paths: ${srcErr}`);

    const destErr = ExporterValidatorService.validateDestDir(store.config.dest);
    if (destErr) validationErrors.push(`Destination Directory: ${destErr}`);

    const maxFileErr = ExporterValidatorService.validateMaxFile(store.config.max_file);
    if (maxFileErr) validationErrors.push(`Max File Size: ${maxFileErr}`);

    const maxChunkErr = ExporterValidatorService.validateMaxChunk(store.config.max_chunk);
    if (maxChunkErr) validationErrors.push(`Max Chunk Size: ${maxChunkErr}`);

    const incPathsErr = ExporterValidatorService.validateRegexSyntax(store.config.inc_paths);
    if (incPathsErr) validationErrors.push(`Include Paths Regex: ${incPathsErr}`);

    const excPathsErr = ExporterValidatorService.validateRegexSyntax(store.config.exc_paths);
    if (excPathsErr) validationErrors.push(`Exclude Paths Regex: ${excPathsErr}`);

    const incExtErr = ExporterValidatorService.validateRegexSyntax(store.config.inc_ext);
    if (incExtErr) validationErrors.push(`Include Extensions Regex: ${incExtErr}`);

    const excExtErr = ExporterValidatorService.validateRegexSyntax(store.config.exc_ext);
    if (excExtErr) validationErrors.push(`Exclude Extensions Regex: ${excExtErr}`);

    if (validationErrors.length > 0) {
      logInfo('[useExporterExecution] Export blocked due to validation errors', validationErrors);
      store.setModalState({
        isValidationModalOpen: true,
        validationErrors,
      });
      return;
    }

    store.setIsRunning(true);
    store.setActiveTab('terminal');
    store.appendTerminalLog(`\n🚀 [Codebase Exporter] Executing python export runner...\n`);

    const displayLines = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    const resolvedAbsPaths = displayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

    store.appendTerminalLog(`📂 Sources (${resolvedAbsPaths.length}): ${resolvedAbsPaths.join(', ')}\n`);
    store.appendTerminalLog(`💾 Target Dir: ${store.config.dest}\n`);

    if (resolvedAbsPaths.length === 0) {
      store.appendTerminalLog(`❌ [Validation Error] No valid source paths defined.\n`);
      store.setIsRunning(false);
      return;
    }

    try {
      store.appendTerminalLog(`💾 [1/4] Saving profile configuration...\n`);
      try {
        await Promise.race([
          store.saveProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile save timeout (3s)')), 3000)),
        ]);
        store.appendTerminalLog(`✅ [1/4] Profile saved.\n`);
      } catch (saveErr: any) {
        store.appendTerminalLog(`⚠️ [1/4] Profile save bypassed (${saveErr?.message || saveErr}). Continuing export...\n`);
      }

      store.appendTerminalLog(`📡 [2/4] Sending RPC runExport request to backend...\n`);
      const runResponse = await filesExporterApiService.runExport({
        config: {
          ...store.config,
          src: resolvedAbsPaths.join('\n'),
        },
        currentHistoryId: store.selectedProfileId,
        paths: resolvedAbsPaths,
        mode: 'standard',
      });

      const pid = runResponse?.pythonScriptStatus?.pid;
      if (!pid) {
        store.appendTerminalLog(`❌ [Error] Backend returned invalid PID response: ${JSON.stringify(runResponse)}\n`);
        store.setIsRunning(false);
        return;
      }

      store.appendTerminalLog(`⚡ [3/4] Python process spawned with PID ${pid}. Target Dir: ${runResponse.exportDirectory}\n`);
      store.appendTerminalLog(`⏳ [4/4] Monitoring execution progress...\n`);

      let isDone = false;
      let checkCount = 0;
      const maxChecks = 120;

      while (!isDone && checkCount < maxChecks) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        checkCount++;

        try {
          const status = await filesExporterApiService.getExportStatus(pid);
          if (!status?.pythonScriptStatus) {
            store.appendTerminalLog(`⚠️ [Poll ${checkCount}s] Could not retrieve process status for PID ${pid}.\n`);
            continue;
          }

          if (!status.pythonScriptStatus.isRunning) {
            isDone = true;
            const exitCode = status.pythonScriptStatus.exitCode ?? 0;
            if (exitCode === 0) {
              store.appendTerminalLog(`✅ Process PID ${pid} completed successfully (exit code 0).\n`);
            } else {
              store.appendTerminalLog(`❌ Process PID ${pid} exited with non-zero exit code: ${exitCode}.\n`);
            }

            try {
              store.appendTerminalLog(`📄 Reading export results and report for PID ${pid}...\n`);
              const result = await filesExporterApiService.getExportResult(
                pid,
                runResponse.exportDirectory,
                runResponse.timestamp
              );
              if (result?.report) {
                store.setReportData({
                  summary: result.report.results.summary,
                  metrics_per_extension: result.report.results.metrics_per_extension,
                  generated_files: result.report.results.generated_files,
                  tree_manifest: result.report.results.tree_manifest,
                  estimatedInputTokens: result.estimatedInputTokens,
                });
                const totalExported = result.report.results.summary?.total_exported ?? 0;
                store.appendTerminalLog(`📊 Export Report Loaded: ${totalExported} files exported.\n`);

                if (store.config.copyGeneratedFilesToClipboard) {
                  await filesExporterApiService.copyLatestExportedFiles(runResponse.exportDirectory);
                  store.appendTerminalLog(`📋 Generated export files successfully stored in OS clipboard!\n`);
                }
              } else {
                store.appendTerminalLog(`⚠️ Result Parsing: Report data empty or unavailable.\n`);
              }
            } catch (e: any) {
              store.appendTerminalLog(`❌ Result Parsing Error: ${e?.message || JSON.stringify(e)}\n`);
            }
          } else if (checkCount % 5 === 0) {
            store.appendTerminalLog(`⏳ [Poll ${checkCount}s] Python process PID ${pid} is still running...\n`);
          }
        } catch (pollErr: any) {
          store.appendTerminalLog(`⚠️ Status check error (attempt ${checkCount}): ${pollErr?.message || pollErr}\n`);
        }
      }

      if (!isDone) {
        store.appendTerminalLog(`⚠️ [Timeout] Process PID ${pid} did not finish within ${maxChecks} seconds.\n`);
      }
    } catch (err: any) {
      store.appendTerminalLog(`❌ Export Error: ${err?.message || JSON.stringify(err)}\n`);
      if (err?.stack) {
        store.appendTerminalLog(`🔍 Stack Trace:\n${err.stack}\n`);
      }
    } finally {
      store.setIsRunning(false);
    }
  };

  const handleKillExport = async () => {
    logInfo('[useExporterExecution] handleKillExport starting...');
    store.setIsRunning(false);
    store.appendTerminalLog(`\n🛑 Process export terminated by user.\n`);
  };

  const handleOpenExchangeUrl = (url: string) => {
    logInfo('[useExporterExecution] handleOpenExchangeUrl starting...', [url]);
    filesExporterApiService.openBrowserTab(url, true);
  };

  return {
    isRunning: store.isRunning,
    isDirty,
    handleSaveConfig,
    handleDuplicateFromSaveModal,
    handleForceSaveFromSaveModal,
    handleRunExport,
    handleKillExport,
    handleOpenExchangeUrl,
    compiledBashCmd: store.compiledBashCmd,
    terminalLogs: store.terminalLogs,
    clearTerminalLogs: () => {
      logInfo('[useExporterExecution] clearTerminalLogs starting...');
      store.clearTerminalLogs();
    },
    reportData: store.reportData,
    activeTab: store.activeTab,
    setActiveTab: (tab: any) => {
      logInfo('[useExporterExecution] setActiveTab starting...', [tab]);
      store.setActiveTab(tab);
    },
    exchangeLinks: store.exchangeLinks,
    modalState: store.modalState,
    setModalState: store.setModalState,
  };
}
