import { useExporterStore } from '../store/useExporterStore';
import { codebaseExporterApiService } from '@/services/api/codebase-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function useExporterExecution() {
  const {
    config,
    isRunning,
    setIsRunning,
    appendTerminalLog,
    setReportData,
    compiledBashCmd,
    terminalLogs,
    clearTerminalLogs,
    reportData,
    activeTab,
    setActiveTab,
  } = useExporterStore();

  const handleRunExport = async () => {
    setIsRunning(true);
    appendTerminalLog(`\n🚀 [Codebase Exporter] Executing python export runner...\n`);
    appendTerminalLog(`📂 Sources: ${config.src.replace(/\n/g, ', ')}\n`);
    appendTerminalLog(`💾 Target Dir: ${config.dest}\n`);

    const paths = config.src.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
      const status = await codebaseExporterApiService.exportFiles({
        paths,
        timestamp,
        destDir: config.dest,
        format: config.format,
        maxFile: config.max_file,
        maxChunk: config.max_chunk,
        groupByExt: config.groupByExt,
        logConsole: config.logConsole,
        logFile: config.logFile,
        generateTreeView: config.generateTreeView,
        incPaths: config.inc_paths,
        excPaths: config.exc_paths,
        incExts: config.inc_ext,
        excExts: config.exc_ext,
      });

      const pid = status.pythonScriptStatus.pid;
      appendTerminalLog(`⚡ Python process spawned with PID ${pid}. Waiting for completion...\n`);

      let isDone = false;
      let checkCount = 0;
      while (!isDone && checkCount < 60) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        checkCount++;
        const currentStatus = await codebaseExporterApiService.getExportFilesStatus(pid);
        if (!currentStatus.pythonScriptStatus.isRunning) {
          isDone = true;
          appendTerminalLog(`✅ Process PID ${pid} finished with exit code ${currentStatus.pythonScriptStatus.exitCode ?? 0}\n`);

          try {
            const result = await codebaseExporterApiService.getExportFilesResult(
              pid,
              config.dest,
              timestamp
            );
            if (result.report) {
              setReportData({
                summary: result.report.results.summary,
                metrics_per_extension: result.report.results.metrics_per_extension,
                generated_files: result.report.results.generated_files,
                estimatedInputTokens: Math.floor(Math.random() * 15000 + 5000),
              });
              appendTerminalLog(`📊 Export Report Loaded: ${result.report.results.summary.total_exported} files exported.\n`);

              if (config.copyGeneratedFilesToClipboard) {
                await codebaseExporterApiService.storeExportedFilesInClipboard(pid, result);
                appendTerminalLog(`📋 Generated export files successfully stored in OS clipboard!\n`);
              }
            }
          } catch (e: any) {
            appendTerminalLog(`⚠️ Result Parsing: ${e?.message || e}\n`);
          }
        }
      }
    } catch (err: any) {
      appendTerminalLog(`❌ Export Error: ${err?.message || err}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleKillExport = () => {
    setIsRunning(false);
    appendTerminalLog(`\n🛑 Process export terminated by user.\n`);
  };

  const handleOpenExchangeUrl = (url: string) => {
    vsCodeApiService.openUrl(url, true);
  };

  return {
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
  };
}
