import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { useAppContextStore } from '@/store/useAppContextStore';
import {
  EXPORT_FORMAT_LIST,
  EXPORT_FORMAT_ICON_MAP,
  ExportFormat,
} from '@/shared/services/codebase-exporter/domain/model/types';
import { useFilesCtxExportStore } from './use-files-ctx-export-store';
import { codebaseExporterApiService } from '@/services/api/codebase-exporter-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';
import { ExportStatus } from '@/shared/services/codebase-exporter/domain/model/export-status';

interface FilesCtxExportPanelProps {
  handleCopy?: (text: string, message: string) => void;
  onCopyFilesCtx?: () => void;
  targetFilePaths?: string[];
}

export function FilesCtxExportPanel({
  handleCopy,
  onCopyFilesCtx,
  targetFilePaths,
}: FilesCtxExportPanelProps) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const {
    exportFormat,
    maxChunk,
    splitChunkByFileExtension,
    copyAsFilesToClipboard,
    targetFilePaths: storeTargetFilePaths,
    setExportFormat,
    setMaxChunk,
    setSplitChunkByFileExtension,
    setCopyAsFilesToClipboard,
  } = useFilesCtxExportStore();

  const handleCopyFilesCtx = async () => {
    if (onCopyFilesCtx) {
      onCopyFilesCtx();
      return;
    }

    const files = (targetFilePaths && targetFilePaths.length > 0)
      ? targetFilePaths
      : (storeTargetFilePaths || []);

    const parsedMaxChunk = typeof maxChunk === 'number' ? maxChunk : (parseInt(String(maxChunk), 10) || 0);

    logInfo(`[FilesCtxExportPanel] Exporting ${files.length} selected file(s) in format '${exportFormat}'...`);

    try {
      const exportStatus: ExportStatus = await codebaseExporterApiService.exportSelectedFiles(
        files,
        exportFormat,
        parsedMaxChunk,
        splitChunkByFileExtension
      );

      logInfo(`[FilesCtxExportPanel] exportStatus received: ${JSON.stringify(exportStatus)}`);

      // Wait for the export process to finish
      const checkStatusInterval = 1000; // 1 second
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

  return (
    <div className="flex items-center gap-3 bg-card p-2.5 border border-border rounded-lg w-full">
      {/* Scrollable left area */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0 overflow-x-auto">
        {/* Output Format */}
        <div className="space-y-1 shrink-0">
          <label
            className="block font-medium text-[10px] text-muted-foreground whitespace-nowrap"
            title="Structured file format schema template applied to aggregate the files contents."
          >
            Output Format
          </label>
          <SelectFromTypeBuilder
            id="select-export-format"
            value={exportFormat}
            onChange={(val) => setExportFormat(val as ExportFormat)}
            triggerClassName="!h-8 min-h-0 py-0 px-2 text-xs border-border rounded-md font-mono w-24"
            options={EXPORT_FORMAT_LIST.map((key) => ({
              value: key,
              icon: EXPORT_FORMAT_ICON_MAP[key]?.icon,
              label: EXPORT_FORMAT_ICON_MAP[key]?.label,
            }))}
          />
        </div>

        {/* Max Chunk (KB) */}
        <div className="space-y-1 shrink-0">
          <label
            className="block font-medium text-[10px] text-muted-foreground whitespace-nowrap"
            title="Maximum payload slice limit for chunk splitting in Kilobytes (0 means unlimited size)."
          >
            Max Chunk (KB)
          </label>
          <Input
            type="number"
            value={maxChunk}
            onChange={(e) => setMaxChunk(e.target.value)}
            className="bg-background w-20 h-8 text-xs"
          />
        </div>

        {/* Split by ext */}
        <div className="flex flex-col items-center space-y-1 shrink-0">
          <label
            htmlFor="splitChunkByFileExtension"
            className="font-medium text-[10px] text-muted-foreground whitespace-nowrap cursor-pointer"
            title="Force the export runner to partition output chunks whenever a change of file extension occurs."
          >
            Split by Ext
          </label>
          <div className="flex justify-center items-center h-8">
            <Checkbox
              id="splitChunkByFileExtension"
              checked={splitChunkByFileExtension}
              onCheckedChange={(checked) => setSplitChunkByFileExtension(!!checked)}
            />
          </div>
        </div>

        {/* Copy to clip */}
        <div className="flex flex-col items-center space-y-1 shrink-0">
          <label
            htmlFor="copyAsFilesToClipboard"
            className="font-medium text-[10px] text-muted-foreground whitespace-nowrap cursor-pointer"
            title="Automatically copy generated export files to the OS clipboard after each successful run."
          >
            Copy as Files
          </label>
          <div className="flex justify-center items-center h-8">
            <Checkbox
              id="copyAsFilesToClipboard"
              checked={copyAsFilesToClipboard}
              onCheckedChange={(checked) => setCopyAsFilesToClipboard(!!checked)}
            />
          </div>
        </div>
      </div>

      {/* Copy files ctx Button */}
      <Button
        onClick={handleCopyFilesCtx}
        className="flex justify-center items-center gap-1.5 bg-blue-500 hover:bg-blue-600 shadow-sm rounded-lg w-36 h-8 font-bold text-white text-xs whitespace-nowrap cursor-pointer shrink-0"
      >
        <FileText size={14} /> Copy files ctx
      </Button>
    </div>
  );
}
