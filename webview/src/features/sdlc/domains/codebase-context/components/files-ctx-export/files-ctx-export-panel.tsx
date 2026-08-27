import React from 'react';
import { Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import {
  EXPORT_FORMAT_LIST,
  EXPORT_FORMAT_ICON_MAP,
  ExportFormat,
} from '@/shared/services/codebase-exporter/domain/model/types';
import { useFilesCtxExportPanel } from './hooks/use-files-ctx-export-panel';

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
  const {
    exportFormat,
    maxChunk,
    splitChunkByFileExtension,
    copyAsFilesToClipboard,
    setExportFormat,
    setMaxChunk,
    setSplitChunkByFileExtension,
    setCopyAsFilesToClipboard,
    handleCopyFilesCtx,
  } = useFilesCtxExportPanel(handleCopy, onCopyFilesCtx, targetFilePaths);

  return (
    <div className="flex items-center gap-3 bg-card p-1 border border-border rounded-lg w-full">
      <div className="flex flex-1 items-center gap-2.5 p-1 min-w-0 overflow-x-auto">
        <div className="space-y-1 shrink-0">
          <label
            className="block font-medium text-[10px] text-muted-foreground whitespace-nowrap"
            data-tooltip="Structured file format schema template applied to aggregate the files contents."
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

        <div className="space-y-1 shrink-0">
          <label
            className="block font-medium text-[10px] text-muted-foreground whitespace-nowrap"
            data-tooltip="Maximum payload slice limit for chunk splitting in Kilobytes (0 means unlimited size)."
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

        <div className="flex flex-col items-center space-y-1 shrink-0">
          <label
            htmlFor="splitChunkByFileExtension"
            className="font-medium text-[10px] text-muted-foreground whitespace-nowrap cursor-pointer"
            data-tooltip="Force the export runner to partition output chunks whenever a change of file extension occurs."
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

        <div className="flex flex-col items-center space-y-1 shrink-0">
          <label
            htmlFor="copyAsFilesToClipboard"
            className="font-medium text-[10px] text-muted-foreground whitespace-nowrap cursor-pointer"
            data-tooltip="Automatically copy generated export files to the OS clipboard after each successful run."
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

      <Button
        onClick={handleCopyFilesCtx}
        className="flex justify-center items-center gap-1.5 bg-blue-500 hover:bg-blue-600 shadow-sm rounded-lg w-25 h-17 font-bold text-white text-xs whitespace-nowrap cursor-pointer shrink-0"
      >
        <Copy size={14} /> Copy <br/>files <br/> context
      </Button>
    </div>
  );
}
