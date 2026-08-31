import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen } from 'lucide-react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';

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
    <div className="space-y-3 bg-background p-4 font-mono text-xs">
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
        <Input
          value={fileNameFilter}
          onChange={(e) => setFileNameFilter(e.target.value)}
          placeholder="Filter by file name regex..."
          className="bg-card h-7 font-mono text-xs"
        />
        <Input
          value={fileContentFilter}
          onChange={(e) => setFileContentFilter(e.target.value)}
          placeholder="Filter by content regex..."
          className="bg-card h-7 font-mono text-xs"
        />
      </div>

      <div className="space-y-1 bg-card p-2 border border-border rounded max-h-[350px] overflow-y-auto">
        <div className="pb-1 border-border border-b font-bold text-[11px] text-foreground">
          📂 Exported Files ({filteredExports.length})
        </div>

        {filteredExports.length === 0 ? (
          <div className="py-4 text-muted-foreground text-center italic">
            No exported files generated.
          </div>
        ) : (
          filteredExports.map((filePath) => {
            const fileName = filePath.split(/[\\/]/).pop() || '';
            return (
              <div
                key={filePath}
                className="flex justify-between items-center hover:bg-muted/40 p-1 border-border/40 border-b rounded"
              >
                <div
                  onClick={() => onOpenFile(filePath)}
                  className="flex flex-1 items-center gap-1.5 text-primary hover:underline truncate cursor-pointer"
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
