import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExporterExecution } from '../hooks/use-exporter-execution';
import { useExporterStore } from '../store/useExporterStore';
import { ActionToolbar } from './ActionToolbar';
import { ReportTab } from './tabs/ReportTab';
import { FilesTab } from './tabs/FilesTab';
import { TerminalTab } from './tabs/TerminalTab';
import { HelpTab } from './tabs/HelpTab';
import { SimulationTab } from './tabs/SimulationTab';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function ExporterPanel() {
  const {
    isRunning,
    handleRunExport,
    handleKillExport,
    handleOpenExchangeUrl,
    compiledBashCmd,
    terminalLogs,
    clearTerminalLogs,
    reportData,
    activeTab,
    setActiveTab,
  } = useExporterExecution();

  const { config, setConfig } = useExporterStore();

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
      {/* Control Toolbar */}
      <ActionToolbar
        isRunning={isRunning}
        onRunExport={handleRunExport}
        onKillExport={handleKillExport}
        onOpenExchangeUrl={handleOpenExchangeUrl}
      />

      {/* Results & Inspection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-2">
        <TabsList className="bg-muted p-1 border-b border-border">
          <TabsTrigger value="report" className="text-xs font-mono font-bold">REPORT</TabsTrigger>
          <TabsTrigger value="files" className="text-xs font-mono font-bold">FILES</TabsTrigger>
          <TabsTrigger value="terminal" className="text-xs font-mono font-bold">TERMINAL</TabsTrigger>
          <TabsTrigger value="help" className="text-xs font-mono font-bold">HELP</TabsTrigger>
          <TabsTrigger value="simu" className="text-xs font-mono font-bold">SIMULATION B</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="flex-1">
          <ReportTab
            reportData={reportData}
            onAppendExtension={(ext, mode) => {
              const field = mode === 'inc' ? 'inc_ext' : 'exc_ext';
              setConfig((prev) => ({
                ...prev,
                [field]: prev[field] ? `${prev[field]}\n.*\\.${ext}$` : `.*\\.${ext}$`,
              }));
            }}
            onSetMaxFileSize={(kb) =>
              setConfig((prev) => ({ ...prev, max_file: String(kb) }))
            }
          />
        </TabsContent>

        <TabsContent value="files" className="flex-1">
          <FilesTab
            reportData={reportData}
            destDir={config.dest}
            onOpenFile={(p) => vsCodeApiService.openFile(p)}
            onRevealFile={(p) => vsCodeApiService.revealInExplorer(p)}
          />
        </TabsContent>

        <TabsContent value="terminal" className="flex-1">
          <TerminalTab
            compiledBashCmd={compiledBashCmd}
            terminalLogs={terminalLogs}
            onCopyBashCmd={() => vsCodeApiService.copyToClipboard(compiledBashCmd)}
            onCopyTerminalLogs={() => vsCodeApiService.copyToClipboard(terminalLogs)}
            onClearTerminalLogs={clearTerminalLogs}
          />
        </TabsContent>

        <TabsContent value="help" className="flex-1">
          <HelpTab />
        </TabsContent>

        <TabsContent value="simu" className="flex-1">
          <SimulationTab
            onInjectPaths={(paths) => {
              setConfig((prev) => {
                const current = prev.src ? prev.src.split('\n') : [];
                return { ...prev, src: Array.from(new Set([...current, ...paths])).join('\n') };
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ExporterPanel;
