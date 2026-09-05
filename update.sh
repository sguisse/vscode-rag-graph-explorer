#!/usr/bin/env bash
set -e

# Ensure directories exist
mkdir -p webview/src/features/exporter/components
mkdir -p webview/src/features/exporter/hooks

# 1. Update ActionToolbar.tsx to accept `isDirty` prop and conditionally render SAVE CONFIG button
cat << 'EOF' > webview/src/features/exporter/components/ActionToolbar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, ExternalLink, Save } from 'lucide-react';
import { ExportExchangeLink } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface ActionToolbarProps {
  isRunning: boolean;
  isDirty?: boolean;
  onSaveConfig: () => void;
  onRunExport: () => void;
  onKillExport: () => void;
  onOpenExchangeUrl: (url: string) => void;
  exchangeLinks?: ExportExchangeLink[];
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  isRunning,
  isDirty = false,
  onSaveConfig,
  onRunExport,
  onKillExport,
  onOpenExchangeUrl,
  exchangeLinks = [],
}) => {
  const handleSave = () => {
    logInfo('[ActionToolbar] onSaveConfig handler triggered');
    onSaveConfig();
  };

  const handleRun = () => {
    logInfo('[ActionToolbar] onRunExport handler triggered');
    onRunExport();
  };

  const handleKill = () => {
    logInfo('[ActionToolbar] onKillExport handler triggered');
    onKillExport();
  };

  const handleExchange = (url: string) => {
    logInfo('[ActionToolbar] onOpenExchangeUrl handler triggered', [url]);
    onOpenExchangeUrl(url);
  };

  return (
    <div className="p-3 bg-card flex flex-wrap items-center justify-center gap-3 border-b border-border font-mono text-xs">
      {isRunning ? (
        <Button
          type="button"
          variant="destructive"
          onClick={handleKill}
          className="h-9 px-6 font-bold gap-2 cursor-pointer"
        >
          <Square size={14} className="fill-current" />
          STOP EXPORT
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 px-4 font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md animate-in fade-in zoom-in-95 duration-150"
              data-tooltip="Save current configuration changes to profile"
            >
              <Save size={14} />
              SAVE CONFIG
            </Button>
          )}

          <Button
            type="button"
            onClick={handleRun}
            className="h-9 px-8 font-bold gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white cursor-pointer shadow-md"
          >
            <Play size={14} className="fill-current" />
            RUN EXPORT
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 border-l border-border pl-3">
        {exchangeLinks && exchangeLinks.length > 0 ? (
          exchangeLinks.map((link, idx) => (
            <Button
              key={idx}
              size="sm"
              variant="outline"
              onClick={() => handleExchange(link.url)}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
              data-tooltip={link.tooltip}
            >
              {link.icon ? (
                <img src={link.icon} alt={link.tooltip} className="w-4 h-4 object-contain" />
              ) : (
                <ExternalLink size={12} />
              )}
              {link.tooltip || 'Exchange'}
            </Button>
          ))
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExchange('https://gemini.google.com/')}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              Gemini
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExchange('https://notebooklm.google.com/')}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              NotebookLM
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionToolbar;
EOF

# 2. Update use-exporter-execution.ts to compute `isDirty` state and return it
cat << 'EOF' > webview/src/features/exporter/hooks/use-exporter-execution.ts
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
EOF

# 3. Update ExporterPanel.tsx to pass `isDirty` to ActionToolbar
cat << 'EOF' > webview/src/features/exporter/components/ExporterPanel.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useExporterExecution } from '../hooks/use-exporter-execution';
import { useExporterStore } from '../store/useExporterStore';
import { ActionToolbar } from './ActionToolbar';
import { ReportTab } from './tabs/ReportTab';
import { FilesTab } from './tabs/FilesTab';
import { TerminalTab } from './tabs/TerminalTab';
import { HelpTab } from './tabs/HelpTab';
import { SimulationTab } from './tabs/SimulationTab';
import { TreeTab } from './tabs/TreeTab';
import { ValidationErrorDialog } from './ValidationErrorDialog';
import { SaveLockedProfileDialog } from './SaveLockedProfileDialog';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
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

  const handleTabChange = (val: string) => {
    logInfo('[ExporterPanel] Active tab changed', [val]);
    setActiveTab(val as ExporterTabId);
  };

  const topContent = (
    <ActionToolbar
      isRunning={isRunning}
      isDirty={isDirty}
      onSaveConfig={handleSaveConfig}
      onRunExport={handleRunExport}
      onKillExport={handleKillExport}
      onOpenExchangeUrl={handleOpenExchangeUrl}
      exchangeLinks={exchangeLinks}
    />
  );

  const middleContent = (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex-1 flex flex-col h-full min-h-0 p-2 overflow-hidden"
    >
      <TabsList className="bg-muted p-1 border-b border-border flex-wrap h-auto gap-1 shrink-0">
        <TabsTrigger value="report" className="text-xs font-mono font-bold">REPORT</TabsTrigger>
        <TabsTrigger value="files" className="text-xs font-mono font-bold">FILES</TabsTrigger>
        <TabsTrigger value="tree" className="text-xs font-mono font-bold">TREE MANIFEST</TabsTrigger>
        <TabsTrigger value="terminal" className="text-xs font-mono font-bold">TERMINAL</TabsTrigger>
        <TabsTrigger value="help" className="text-xs font-mono font-bold">HELP</TabsTrigger>
        <TabsTrigger value="simu" className="text-xs font-mono font-bold">SIMULATION B</TabsTrigger>
      </TabsList>

      <div className="flex-1 min-h-0 overflow-y-auto mt-2">
        <TabsContent value="report" className="h-full m-0">
          <ReportTab
            reportData={reportData}
            onAppendExtension={(ext, mode) => {
              logInfo('[ExporterPanel] onAppendExtension', [{ ext, mode }]);
              const field = mode === 'inc' ? 'inc_ext' : 'exc_ext';
              setConfig((prev) => ({
                ...prev,
                [field]: prev[field] ? `${prev[field]}\n.*\\.${ext}$` : `.*\\.${ext}$`,
              }));
            }}
            onSetMaxFileSize={(kb) => {
              logInfo('[ExporterPanel] onSetMaxFileSize', [kb]);
              setConfig((prev) => ({ ...prev, max_file: String(kb) }));
            }}
          />
        </TabsContent>

        <TabsContent value="files" className="h-full m-0">
          <FilesTab
            reportData={reportData}
            destDir={config.dest}
            onOpenFile={(p) => {
              logInfo('[ExporterPanel] FilesTab onOpenFile', [p]);
              filesExporterApiService.openPathAtCursor(p);
            }}
            onRevealFile={(p) => {
              logInfo('[ExporterPanel] FilesTab onRevealFile', [p]);
              filesExporterApiService.openPathAtCursor(p);
            }}
          />
        </TabsContent>

        <TabsContent value="tree" className="h-full m-0">
          <TreeTab
            rootNode={reportData?.tree_manifest?.root || null}
            onExcludePattern={(pattern) => {
              logInfo('[ExporterPanel] TreeTab onExcludePattern', [pattern]);
              setConfig((prev) => ({
                ...prev,
                exc_paths: prev.exc_paths ? `${prev.exc_paths}\n${pattern}` : pattern,
              }));
            }}
            onCaptureSelectedPaths={(paths) => {
              logInfo('[ExporterPanel] TreeTab onCaptureSelectedPaths', paths);
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = prev.src ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
                  const flatNew = paths.flatMap((p) => p.split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p) => PathMappingService.registerPath(p, workspaceRoot));
                  return { ...prev, src: Array.from(new Set([...current, ...formatted])).join('\n') };
                });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="terminal" className="h-full m-0">
          <TerminalTab
            compiledBashCmd={compiledBashCmd}
            terminalLogs={terminalLogs}
            onCopyBashCmd={() => {
              logInfo('[ExporterPanel] TerminalTab onCopyBashCmd');
              filesExporterApiService.showNotification('info', 'Command copied to clipboard');
            }}
            onCopyTerminalLogs={() => {
              logInfo('[ExporterPanel] TerminalTab onCopyTerminalLogs');
              filesExporterApiService.showNotification('info', 'Logs copied to clipboard');
            }}
            onClearTerminalLogs={() => {
              logInfo('[ExporterPanel] TerminalTab onClearTerminalLogs');
              clearTerminalLogs();
            }}
          />
        </TabsContent>

        <TabsContent value="help" className="h-full m-0">
          <HelpTab />
        </TabsContent>

        <TabsContent value="simu" className="h-full m-0">
          <SimulationTab
            onInjectPaths={(paths) => {
              logInfo('[ExporterPanel] SimulationTab onInjectPaths', paths);
              setConfig((prev) => {
                const current = prev.src ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
                const flatNew = paths.flatMap((p) => p.split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
                const formatted = flatNew.map((p) => PathMappingService.registerPath(p, workspaceRoot));
                return { ...prev, src: Array.from(new Set([...current, ...formatted])).join('\n') };
              });
            }}
          />
        </TabsContent>
      </div>
    </Tabs>
  );

  return (
    <>
      <TopMiddleBottomPanel
        id="panel-exporter-execution"
        className="bg-background w-full h-full min-h-0 overflow-hidden"
        top={topContent}
        middle={middleContent}
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
    </>
  );
}

export default ExporterPanel;
EOF

echo "✅ feat: Configured 'SAVE CONFIG' button to render conditionally only when configuration changes are detected vs stored profile!"
echo "💡 Next step: Run 'cd webview && npm run build' to verify compilation."
