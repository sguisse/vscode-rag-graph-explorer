import { useExporterStore } from '../store/useExporterStore';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
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

    if (isDefault) {
      const wsName =
        store.currentRepo ||
        (store.workspaceRoot ? store.workspaceRoot.split(/[/\\]/).pop() || '' : 'workspace');
      const newName = generateNewConfigName(wsName);
      const newId = await store.addProfile(store.config);
      if (newId) {
        await store.renameProfile(newId, newName);
        fileExporterApiService.showNotification('info', `New profile '${newName}' created successfully!`);
      }
      return;
    }

    const isFrozen = Boolean(selectedEntry?.frozen);

    if (isFrozen) {
      store.setModalState({ isSaveLockedModalOpen: true });
      return;
    }

    await store.saveProfile();
    fileExporterApiService.showNotification('info', 'Configuration saved successfully!');
  };

  const handleDuplicateFromSaveModal = async () => {
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
    store.setModalState({ isSaveLockedModalOpen: false });

    if (store.selectedProfileId !== 'default') {
      await store.freezeToggle(store.selectedProfileId);
      await store.saveProfile();
      fileExporterApiService.showNotification('info', 'Profile unlocked and configuration saved!');
    }
  };

  const handleRunExport = async () => {
    logInfo('[useExporterExecution] handleRunExport starting...');

    const validationErrors: string[] = [];

    const srcErr = ExporterValidatorService.validatePathList(store.config.codebase.src || '', store.invalidPaths);
    if (srcErr) validationErrors.push(`Codebase Paths: ${srcErr}`);

    const destErr = ExporterValidatorService.validateDestDir(store.config.dest || '');
    if (destErr) validationErrors.push(`Destination Directory: ${destErr}`);

    const maxFileErr = ExporterValidatorService.validateMaxFile(store.config.codebase.max_file || '');
    if (maxFileErr) validationErrors.push(`Max File Size: ${maxFileErr}`);

    const maxChunkErr = ExporterValidatorService.validateMaxChunk(store.config.max_chunk || '');
    if (maxChunkErr) validationErrors.push(`Max Chunk Size: ${maxChunkErr}`);

    if (validationErrors.length > 0) {
      logInfo('[useExporterExecution] Export blocked due to validation errors', [validationErrors]);
      store.setModalState({
        isValidationModalOpen: true,
        validationErrors,
      });
      return;
    }

    store.setIsRunning(true);
    store.setActiveTab('terminal');
    store.appendTerminalLog(`\n🚀 [Codebase Exporter] Executing python export runner...\n`);

    const codebaseLines = (store.config.codebase.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    const referenceLines = (store.config.reference.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);

    const resolvedAbsCodebase = codebaseLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));
    const resolvedAbsReferences = referenceLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

    store.appendTerminalLog(`📂 Codebase Sources (${resolvedAbsCodebase.length}): ${resolvedAbsCodebase.join(', ')}\n`);
    if (resolvedAbsReferences.length > 0) {
      store.appendTerminalLog(`📚 Reference Sources (${resolvedAbsReferences.length}): ${resolvedAbsReferences.join(', ')}\n`);
    }
    store.appendTerminalLog(`💾 Target Dir: ${store.config.dest}\n`);

    // Extract prompt from all potential state paths
    const storeObj = store as Record<string, any>;
    const rawPrompt = store.config.prompt || storeObj.prompt || storeObj.promptInstruction || '';
    const isPromptCheckboxChecked = store.config.generatePromptFile !== false;
    const effectivePrompt = isPromptCheckboxChecked ? rawPrompt : '';

    if (isPromptCheckboxChecked) {
      store.appendTerminalLog(`📝 Prompt File active (${effectivePrompt.length} chars)\n`);
    } else {
      store.appendTerminalLog(`ℹ️ Prompt File checkbox inactive\n`);
    }

    try {
      const payloadConfig = {
        ...store.config,
        generatePromptFile: isPromptCheckboxChecked,
        prompt: effectivePrompt,
        codebase: { ...store.config.codebase, src: resolvedAbsCodebase.join('\n') },
        reference: { ...store.config.reference, src: resolvedAbsReferences.join('\n') },
      };

      store.appendTerminalLog(`📡 Sending RPC runExport request to backend...\n`);
      const runResponse = await fileExporterApiService.runExport({
        config: payloadConfig,
        currentHistoryId: store.selectedProfileId,
        codebasePaths: resolvedAbsCodebase,
        referencePaths: resolvedAbsReferences,
        mode: 'standard',
      });

      if (runResponse?.pythonScriptStatus?.command) {
        store.setCompiledBashCmd(runResponse.pythonScriptStatus.command);
      }

      const pid = runResponse?.pythonScriptStatus?.pid;
      if (!pid) {
        store.appendTerminalLog(`❌ [Error] Backend returned invalid PID response.\n`);
        store.setIsRunning(false);
        return;
      }

      store.appendTerminalLog(`⚡ Python process spawned with PID ${pid}. Target Dir: ${runResponse.exportDirectory}\n`);

      let isDone = false;
      let checkCount = 0;
      const maxChecks = 120;

      while (!isDone && checkCount < maxChecks) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        checkCount++;

        try {
          const status = await fileExporterApiService.getExportStatus(pid);
          if (status?.pythonScriptStatus?.command) {
            store.setCompiledBashCmd(status.pythonScriptStatus.command);
          }

          if (!status?.pythonScriptStatus?.isRunning) {
            isDone = true;
            store.appendTerminalLog(`✅ Export completed successfully.\n`);
            const result = await fileExporterApiService.getExportResult(
              pid,
              runResponse.exportDirectory,
              runResponse.timestamp
            );
            if (result?.report) {
              store.setReportData(result.report.results);

              if (store.config.copyGeneratedFilesToClipboard) {
                await fileExporterApiService.copyLatestExportedFiles(runResponse.exportDirectory);
                store.appendTerminalLog(`📋 Export files copied to clipboard!\n`);
              }
            }
          }
        } catch (pollErr: any) {
          store.appendTerminalLog(`⚠️ Status check error: ${pollErr?.message || pollErr}\n`);
        }
      }
    } catch (err: any) {
      store.appendTerminalLog(`❌ Export Error: ${err?.message || JSON.stringify(err)}\n`);
    } finally {
      store.setIsRunning(false);
    }
  };

  const handleKillExport = async () => {
    store.setIsRunning(false);
    store.appendTerminalLog(`\n🛑 Export process killed.\n`);
  };

  const handleOpenExchangeUrl = (url: string, inBrowserTab: boolean = false) => {
    fileExporterApiService.openBrowserTab(url, inBrowserTab);
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
    clearTerminalLogs: () => store.clearTerminalLogs(),
    reportData: store.reportData,
    activeTab: store.activeTab,
    setActiveTab: (tab: any) => store.setActiveTab(tab),
    exchangeLinks: store.exchangeLinks,
    modalState: store.modalState,
    setModalState: store.setModalState,
  };
}
