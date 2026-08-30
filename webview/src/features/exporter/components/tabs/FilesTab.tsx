import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen } from 'lucide-react';
import { ExportReportData } from '../../types/exporter.types';

interface FilesTabProps {
  reportData: ExportReportData | null;
  destDir: string;
  onOpenFile: (filePath: string) => void;
  onRevealFile: (filePath: string) => void;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  reportData,
  destDir,
  onOpenFile,
  onRevealFile,
}) => {
  const [fileNameFilter, setFileNameFilter] = useState('');
  const [fileContentFilter, setFileContentFilter] = useState('');

  const exports = reportData?.generated_files?.exports || [];

  const filteredExports = exports.filter((file) => {
    const name = file.split(/[\\/]/).pop() || '';
    if (fileNameFilter && !new RegExp(fileNameFilter, 'i').test(name)) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-3 font-mono text-xs bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          value={fileNameFilter}
          onChange={(e) => setFileNameFilter(e.target.value)}
          placeholder="Filter by file name regex..."
          className="h-7 text-xs font-mono bg-card"
        />
        <Input
          value={fileContentFilter}
          onChange={(e) => setFileContentFilter(e.target.value)}
          placeholder="Filter by content regex..."
          className="h-7 text-xs font-mono bg-card"
        />
      </div>

      <div className="border border-border rounded bg-card p-2 space-y-1 max-h-[350px] overflow-y-auto">
        <div className="font-bold text-[11px] text-foreground border-b border-border pb-1">
          📂 Exported Files ({filteredExports.length})
        </div>

        {filteredExports.length === 0 ? (
          <div className="text-muted-foreground italic text-center py-4">
            No exported files generated.
          </div>
        ) : (
          filteredExports.map((filePath) => {
            const fileName = filePath.split(/[\\/]/).pop() || '';
            return (
              <div
                key={filePath}
                className="flex items-center justify-between p-1 hover:bg-muted/40 rounded border-b border-border/40"
              >
                <div
                  onClick={() => onOpenFile(filePath)}
                  className="flex items-center gap-1.5 cursor-pointer text-primary hover:underline truncate flex-1"
                >
                  <FileCode size={13} className="shrink-0" />
                  <span className="truncate">{fileName}</span>
                </div>

                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onRevealFile(filePath)}
                  title="Reveal in OS Explorer"
                >
                  <FolderOpen size={12} />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
