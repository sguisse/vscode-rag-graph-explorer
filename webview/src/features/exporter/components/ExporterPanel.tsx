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
