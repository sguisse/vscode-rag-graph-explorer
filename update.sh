#!/usr/bin/env bash
set -e

mkdir -p webview/src/features/exporter/hooks
mkdir -p webview/src/features/exporter/components

cat << 'EOF' > webview/src/features/exporter/hooks/use-exporter-execution.ts
import { useExporterProfiles } from "./use-exporter-profiles";
import { useExporterStore } from '../store/useExporterStore';
import { useExporterValidation } from './use-exporter-validation';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { PathMappingService } from '../utils/path-resolver';
import { generateNewConfigName, generateDuplicateName } from '../utils/date-formatter';
import { isConfigDirty } from '../utils/config-dirty-checker';

export function useExporterExecution() {
  const store = useExporterStore();
  const { addProfile, renameProfile, saveProfile, freezeToggle } = useExporterProfiles();
  const { validateAllConfig, markAllTouched } = useExporterValidation();

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
      const newId = await addProfile(store.config);
      if (newId) {
        await renameProfile(newId, newName);
        fileExporterApiService.showNotification('info', `New profile '${newName}' created successfully!`);
      }
      return;
    }

    const isFrozen = Boolean(selectedEntry?.frozen);

    if (isFrozen) {
      store.setModalState({ isSaveLockedModalOpen: true });
      return;
    }

    await saveProfile();
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

    const newId = await addProfile(store.config);
    if (newId) {
      await renameProfile(newId, newName);
    }
  };

  const handleForceSaveFromSaveModal = async () => {
    store.setModalState({ isSaveLockedModalOpen: false });

    if (store.selectedProfileId !== 'default') {
      await freezeToggle(store.selectedProfileId);
      await saveProfile();
      fileExporterApiService.showNotification('info', 'Profile unlocked and configuration saved!');
    }
  };

  const handleRunExport = async () => {
    logInfo('[useExporterExecution] handleRunExport starting...');

    await markAllTouched();

    const { errorList } = validateAllConfig(store.config, store.invalidPaths);

    if (errorList.length > 0) {
      logInfo('[useExporterExecution] Export blocked due to validation errors', [errorList]);
      store.setModalState({
        isValidationModalOpen: true,
        validationErrors: errorList,
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

      store.setLastPid(pid);
      store.setLastTimestamp(runResponse.timestamp);

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
              store.setLastExportResult(result);

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
    setActiveTab: store.setActiveTab,
    exchangeLinks: store.exchangeLinks,
    modalState: store.modalState,
    setModalState: store.setModalState,
  };
}
EOF

cat << 'EOF' > webview/src/features/exporter/components/ExporterPanel.tsx
import React, { useState, useEffect } from 'react';
import { BarChart3, BookOpen, Files, Terminal, HelpCircle, MessageSquareText, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { useExporterExecution } from '../hooks/use-exporter-execution';
import { useExporterStore } from '../store/useExporterStore';
import { ActionToolbar } from './ActionToolbar';
import { ExternalLinks } from './ExternalLinks';
import { TokenEstimationPanel } from './tabs/report/TokenEstimationPanel';
import { ReportTab } from './tabs/report/ReportTab';
import { FilesTab } from './tabs/files/FilesTab';
import { TerminalTab } from './tabs/terminal/TerminalTab';
import { HelpTab } from '@/features/exporter/components/tabs/help/HelpTab';
import { PromptTab } from './tabs/prompt/PromptTab';
import { LlmResponseTab } from './tabs/llm-response/LlmResponseTab';
import { ValidationErrorDialog } from './ValidationErrorDialog';
import { SaveLockedProfileDialog } from './SaveLockedProfileDialog';
import { ExtensionConflictDialog, ExtensionConflictState } from './ExtensionConflictDialog';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { ExporterTabId } from '../types/exporter.types';
import { PathMappingService } from '../utils/path-resolver';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function ExporterPanel() {
  const {
    isRunning,
    isDirty,
    handleSaveConfig,
    handleDuplicateFromSaveModal,
    handleForceSaveFromSaveModal,
    handleRunExport,
    handleKillExport,
    handleOpenExchangeUrl,
    compiledBashCmd,
    terminalLogs,
    clearTerminalLogs,
    reportData,
    activeTab,
    setActiveTab,
    exchangeLinks,
    modalState,
    setModalState,
  } = useExporterExecution();

  const { config, setConfig, workspaceRoot, historyList, selectedProfileId } = useExporterStore();
  const selectedEntry = historyList.find((h) => h.id === selectedProfileId);

  const [conflictState, setConflictState] = useState<ExtensionConflictState | null>(null);

  useEffect(() => {
    setActiveTab('prompt');
  }, [setActiveTab]);

  const handleTabChange = (val: ExporterTabId) => {
    logInfo('[ExporterPanel] Active tab changed', [val]);
    setActiveTab(val);
  };

  const getExtensionPattern = (ext: string) => {
    return ext === 'no_ext' ? '^[^.]+$' : `.*\\.${ext}$`;
  };

  const handleAppendExtensionWithCoherence = (ext: string, targetMode: 'inc' | 'exc', targetScope: 'codebase' | 'reference' = 'codebase') => {
    const pattern = getExtensionPattern(ext);
    const scopeFilter = targetScope === 'codebase' ? config.codebase : config.reference;
    const opposingField = targetMode === 'inc' ? 'exc_ext' : 'inc_ext';
    const opposingContent = (scopeFilter?.[opposingField] || '') as string;

    const hasOpposingConflict = (opposingContent || '').split('\n').some((line) => {
      const trimmed = line.trim();
      return trimmed === pattern || trimmed === `.*\\.${ext}$` || trimmed === ext;
    });

    if (hasOpposingConflict) {
      setConflictState({ extension: ext, targetMode });
    } else {
      const targetField = targetMode === 'inc' ? 'inc_ext' : 'exc_ext';
      setConfig((prev) => ({
        ...prev,
        [targetScope]: {
          ...prev[targetScope],
          [targetField]: prev[targetScope]?.[targetField]
            ? `${prev[targetScope][targetField]}\n${pattern}`
            : pattern,
        },
      }));
    }
  };

  const codebaseReportData = reportData?.codebase || null;
  const referenceReportData = reportData?.reference || null;

  const activeReportData = activeTab === 'reference-report' ? referenceReportData : codebaseReportData;
  const totalSizeBytes = (activeTab === 'codebase-report' || activeTab === 'reference-report')
    ? (activeReportData?.summary?.total_size || 0)
    : ((codebaseReportData?.summary?.total_size || 0) + (referenceReportData?.summary?.total_size || 0));
  const estimatedInputTokens = Math.ceil(totalSizeBytes / 4);

  const codebaseFilesCount = codebaseReportData?.summary?.total_exported || 0;
  const referenceFilesCount = referenceReportData?.summary?.total_exported || 0;

  const topContent = (
    <ActionToolbar
      isRunning={isRunning}
      isDirty={isDirty}
      onSaveConfig={handleSaveConfig}
      onRunExport={handleRunExport}
      onKillExport={handleKillExport}
    />
  );

  const middleContent = (
    <div className="flex flex-col h-full w-full min-h-0 font-mono text-xs overflow-hidden">
      <LeftCenterRightPanel
        id="exporter-tab-navigation-panel"
        className="bg-muted/60 p-1 border-b border-border shrink-0"
        left={
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('prompt')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'prompt'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <MessageSquareText size={13} className={activeTab === 'prompt' ? 'text-primary' : ''} />
              <span>PROMPT</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('codebase-report')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'codebase-report'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <BarChart3 size={13} className={activeTab === 'codebase-report' ? 'text-primary' : ''} />
              <span>CODEBASE REPORT</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('reference-report')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'reference-report'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <BookOpen size={13} className={activeTab === 'reference-report' ? 'text-indigo-400' : ''} />
              <span>REFERENCE REPORT</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('files')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'files'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <Files size={13} className={activeTab === 'files' ? 'text-primary' : ''} />
              <span>FILES</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('terminal')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'terminal'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <Terminal size={13} className={activeTab === 'terminal' ? 'text-primary' : ''} />
              <span>TERMINAL</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('llm-response')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'llm-response'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <Bot size={13} className={activeTab === 'llm-response' ? 'text-primary' : ''} />
              <span>LLM RESPONSE</span>
            </Button>
          </div>
        }
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange('help')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              activeTab === 'help'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <HelpCircle size={13} className={activeTab === 'help' ? 'text-primary' : ''} />
            <span>HELP</span>
          </Button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {activeTab === 'codebase-report' && (
          <ReportTab
            reportData={codebaseReportData}
            onAppendExtension={(ext, mode) => handleAppendExtensionWithCoherence(ext, mode, 'codebase')}
            onSetMaxFileSize={(kb) => {
              setConfig((prev) => ({
                ...prev,
                codebase: { ...prev.codebase, max_file: String(kb) },
              }));
            }}
            onExcludeTreePattern={(pattern, isExt) => {
              if (isExt) {
                const ext = pattern.replace(/.*\\\./, '').replace(/\$/, '');
                handleAppendExtensionWithCoherence(ext, 'exc', 'codebase');
              } else {
                setConfig((prev) => ({
                  ...prev,
                  codebase: {
                    ...prev.codebase,
                    exc_paths: prev.codebase?.exc_paths ? `${prev.codebase.exc_paths}\n${pattern}` : pattern,
                  },
                }));
              }
            }}
            onCaptureTreePaths={(paths) => {
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = (prev.codebase?.src || '').split(/[,\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
                  const flatNew = paths.flatMap((p: string) => p.split(/[,\n\r]+/)).map((s: string) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p: string) => PathMappingService.registerPath(p, workspaceRoot));
                  return {
                    ...prev,
                    codebase: { ...prev.codebase, src: Array.from(new Set([...current, ...formatted])).join('\n') },
                  };
                });
              }
            }}
          />
        )}

        {activeTab === 'reference-report' && (
          <ReportTab
            reportData={referenceReportData}
            onAppendExtension={(ext, mode) => handleAppendExtensionWithCoherence(ext, mode, 'reference')}
            onSetMaxFileSize={(kb) => {
              setConfig((prev) => ({
                ...prev,
                reference: { ...prev.reference, max_file: String(kb) },
              }));
            }}
            onExcludeTreePattern={(pattern, isExt) => {
              if (isExt) {
                const ext = pattern.replace(/.*\\\./, '').replace(/\$/, '');
                handleAppendExtensionWithCoherence(ext, 'exc', 'reference');
              } else {
                setConfig((prev) => ({
                  ...prev,
                  reference: {
                    ...prev.reference,
                    exc_paths: prev.reference?.exc_paths ? `${prev.reference.exc_paths}\n${pattern}` : pattern,
                  },
                }));
              }
            }}
            onCaptureTreePaths={(paths) => {
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = (prev.reference?.src || '').split(/[,\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
                  const flatNew = paths.flatMap((p: string) => p.split(/[,\n\r]+/)).map((s: string) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p: string) => PathMappingService.registerPath(p, workspaceRoot));
                  return {
                    ...prev,
                    reference: { ...prev.reference, src: Array.from(new Set([...current, ...formatted])).join('\n') },
                  };
                });
              }
            }}
          />
        )}

        {activeTab === 'files' && (
          <FilesTab
            reportData={reportData}
            destDir={config.dest}
            onOpenFile={(p) => fileExporterApiService.openPathAtCursor(p)}
            onRevealFile={(p) => fileExporterApiService.openPathAtCursor(p)}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab
            compiledBashCmd={compiledBashCmd}
            terminalLogs={terminalLogs}
            onCopyBashCmd={() => fileExporterApiService.showNotification('info', 'Command copied to clipboard')}
            onCopyTerminalLogs={() => fileExporterApiService.showNotification('info', 'Logs copied to clipboard')}
            onClearTerminalLogs={() => clearTerminalLogs()}
          />
        )}

        {activeTab === 'llm-response' && <LlmResponseTab />}

        {activeTab === 'prompt' && <PromptTab />}

        {activeTab === 'help' && <HelpTab />}
      </div>
    </div>
  );

  const bottomContent = (
    <TopMiddleBottomPanel
      id="exporter-footer-wrapper"
      className="shrink-0"
      top={
        <div className="px-2 pb-0">
          <TokenEstimationPanel
            tokens={estimatedInputTokens}
            codebaseFilesCount={codebaseFilesCount}
            referenceFilesCount={referenceFilesCount}
          />
        </div>
      }
      middle={
        <LeftCenterRightPanel
          id="exporter-footer-panel"
          className="p-2 bg-card font-mono text-xs shrink-0"
          center={
            <ExternalLinks
              exchangeLinks={exchangeLinks}
              onOpenExchangeUrl={handleOpenExchangeUrl}
            />
          }
        />
      }
    />
  );

  return (
    <>
      <TopMiddleBottomPanel
        id="panel-exporter-execution"
        className="bg-background w-full h-full min-h-0 overflow-hidden"
        top={topContent}
        middle={middleContent}
        bottom={bottomContent}
      />

      <ValidationErrorDialog
        isOpen={Boolean(modalState.isValidationModalOpen)}
        errors={modalState.validationErrors || []}
        onClose={() => setModalState({ isValidationModalOpen: false })}
      />

      <SaveLockedProfileDialog
        isOpen={Boolean(modalState.isSaveLockedModalOpen)}
        profileName={selectedEntry?.display}
        onDuplicate={handleDuplicateFromSaveModal}
        onForceSave={handleForceSaveFromSaveModal}
        onCancel={() => setModalState({ isSaveLockedModalOpen: false })}
      />

      <ExtensionConflictDialog
        isOpen={Boolean(conflictState)}
        conflictState={conflictState}
        onResolveMove={() => {}}
        onForceAppend={() => {}}
        onCancel={() => setConflictState(null)}
      />
    </>
  );
}

export default ExporterPanel;
EOF

echo "✅ fix: Resolved infinite re-render loop by stabilizing setActiveTab reference in useExporterExecution and safely initializing prompt tab!"
