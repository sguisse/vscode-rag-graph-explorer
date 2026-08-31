import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../../store/useExplorerStore';
import { codebaseExporterApiService } from '@/services/api/codebase-exporter-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';
import { ExportStatus } from '@/shared/services/codebase-exporter/model/export-status';

export function useFilesCtxExportPanel(
  handleCopy?: (text: string, message: string) => void,
  onCopyFilesCtx?: () => void,
  targetFilePathsProps?: string[]
) {
  const setNotification = useAppContextStore((s) => s.setNotification);

  const exportFormat = useExplorerStore((s) => s.exportFormat);
  const maxChunk = useExplorerStore((s) => s.maxChunk);
  const splitChunkByFileExtension = useExplorerStore((s) => s.splitChunkByFileExtension);
  const copyAsFilesToClipboard = useExplorerStore((s) => s.copyAsFilesToClipboard);
  const storeTargetFilePaths = useExplorerStore((s) => s.targetFilePaths);

  const setExportFormat = useExplorerStore((s) => s.setExportFormat);
  const setMaxChunk = useExplorerStore((s) => s.setMaxChunk);
  const setSplitChunkByFileExtension = useExplorerStore((s) => s.setSplitChunkByFileExtension);
  const setCopyAsFilesToClipboard = useExplorerStore((s) => s.setCopyAsFilesToClipboard);

  const handleCopyFilesCtx = async () => {
    if (onCopyFilesCtx) {
      onCopyFilesCtx();
      return;
    }

    const files =
      targetFilePathsProps && targetFilePathsProps.length > 0
        ? targetFilePathsProps
        : storeTargetFilePaths || [];

    const parsedMaxChunk =
      typeof maxChunk === 'number' ? maxChunk : parseInt(String(maxChunk), 10) || 0;

    logInfo(`[FilesCtxExportPanel] Exporting ${files.length} selected file(s) in format '${exportFormat}'...`);

    try {
      const exportStatus: ExportStatus = await codebaseExporterApiService.exportSelectedFiles(
        files,
        exportFormat,
        parsedMaxChunk,
        splitChunkByFileExtension
      );

      logInfo(`[FilesCtxExportPanel] exportStatus received: ${JSON.stringify(exportStatus)}`);

      const checkStatusInterval = 1000;
      let currentStatus = exportStatus;
      while (currentStatus.pythonScriptStatus.isRunning) {
        await new Promise((resolve) => setTimeout(resolve, checkStatusInterval));
        currentStatus = await codebaseExporterApiService.getExportFilesStatus(currentStatus.pythonScriptStatus.pid);
      }

      const exportResult = await codebaseExporterApiService.getExportFilesResult(
        exportStatus.pythonScriptStatus.pid,
        exportStatus.exportArgs?.destDir || '',
        exportStatus.exportArgs?.timestamp || ''
      );

      if (copyAsFilesToClipboard) {
        const result: boolean = await codebaseExporterApiService.storeExportedFilesInClipboard(
          currentStatus.pythonScriptStatus.pid,
          exportResult
        );
        if (result) {
          if (handleCopy) {
            handleCopy('', 'Selected Files Content copied to clipboard as files!');
          } else {
            setNotification('Selected Files Content copied to clipboard as files!');
          }
        }
      } else {
        const combinedFilesContent = await codebaseExporterApiService.readExportedFilesContent(
          currentStatus.pythonScriptStatus.pid,
          exportResult
        );

        if (handleCopy) {
          handleCopy(combinedFilesContent, 'Selected Files Content copied to clipboard!');
        } else {
          setNotification('Selected Files Content copied to clipboard!');
        }
      }
    } catch (err: any) {
      logError('[FilesCtxExportPanel] Error during exportSelectedFiles:', err);
      setNotification('Failed to export selected files context.');
    }
  };

  return {
    exportFormat,
    maxChunk,
    splitChunkByFileExtension,
    copyAsFilesToClipboard,
    setExportFormat,
    setMaxChunk,
    setSplitChunkByFileExtension,
    setCopyAsFilesToClipboard,
    handleCopyFilesCtx,
  };
}
