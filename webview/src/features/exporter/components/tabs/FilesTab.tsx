import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen } from 'lucide-react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface FilesTabProps {
  reportData: ExportReportData | null;
  destDir: string;
  onOpenFile: (filePath: string) => void;
  onRevealFile: (filePath: string) => void;
}

export function getOtherFiles(reportData: ExportReportData | null): { label: string; path: string }[] {
  if (!reportData) return [];
  const files: { label: string; path: string }[] = [];
  const gen = (reportData.generated_files || {}) as Record<string, any>;

  // 1. Check explicit properties on generated_files object if present
  if (gen.report_file && typeof gen.report_file === 'string') {
    files.push({ label: 'Report JSON', path: gen.report_file });
  }
  if (gen.tree_file && typeof gen.tree_file === 'string') {
    files.push({ label: 'Tree Manifest JSON', path: gen.tree_file });
  }
  if (gen.report_json && typeof gen.report_json === 'string' && !files.some((f) => f.path === gen.report_json)) {
    files.push({ label: 'Report JSON', path: gen.report_json });
  }
  if (gen.tree_json && typeof gen.tree_json === 'string' && !files.some((f) => f.path === gen.tree_json)) {
    files.push({ label: 'Tree Manifest JSON', path: gen.tree_json });
  }

  // 2. Scan exports array for files ending with -report.json, -tree.json, or similar metadata extensions
  const exportsList: string[] = Array.isArray(gen.exports) ? gen.exports : [];
  for (const p of exportsList) {
    if (typeof p !== 'string') continue;
    const filename = p.split(/[\\/]/).pop() || '';
    if (filename.endsWith('-report.json') || filename.endsWith('report.json')) {
      if (!files.some((f) => f.path === p)) {
        files.push({ label: 'Report File (-report.json)', path: p });
      }
    } else if (filename.endsWith('-tree.json') || filename.endsWith('tree.json') || filename.endsWith('-tree_manifest.json')) {
      if (!files.some((f) => f.path === p)) {
        files.push({ label: 'Tree Manifest File (-tree.json)', path: p });
      }
    }
  }

  // 3. Scan all other string properties inside generated_files object
  for (const key of Object.keys(gen)) {
    if (key === 'exports') continue;
    const val = gen[key];
    if (typeof val === 'string' && val.trim() && !files.some((f) => f.path === val)) {
      const filename = val.split(/[\\/]/).pop() || '';
      files.push({ label: `${key} (${filename})`, path: val });
    }
  }

  return files;
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

  const otherFiles = useMemo(() => getOtherFiles(reportData), [reportData]);

  const handleOpenFile = (filePath: string) => {
    logInfo('[FilesTab] handleOpenFile handler triggered', [filePath]);
    onOpenFile(filePath);
  };

  const handleRevealFile = (filePath: string) => {
    logInfo('[FilesTab] handleRevealFile handler triggered', [filePath]);
    onRevealFile(filePath);
  };

  const topContent = (
    <div className="p-3 pb-2 gap-2 grid grid-cols-1 md:grid-cols-2 bg-background border-b border-border/40 shrink-0">
      <Input
        value={fileNameFilter}
        onChange={(e) => {
          logInfo('[FilesTab] fileNameFilter changed', [e.target.value]);
          setFileNameFilter(e.target.value);
        }}
        placeholder="Filter by file name regex..."
        className="bg-card h-7 font-mono text-xs"
      />
      <Input
        value={fileContentFilter}
        onChange={(e) => {
          logInfo('[FilesTab] fileContentFilter changed', [e.target.value]);
          setFileContentFilter(e.target.value);
        }}
        placeholder="Filter by content regex..."
        className="bg-card h-7 font-mono text-xs"
      />
    </div>
  );

  const middleContent = (
    <div className="p-3 space-y-2 h-full min-h-0 overflow-y-auto font-mono text-xs">
      <div className="pb-1 border-border border-b font-bold text-[11px] text-foreground flex items-center justify-between">
        <span>📂 Exported Files ({filteredExports.length})</span>
      </div>

      {filteredExports.length === 0 ? (
        <div className="py-8 text-muted-foreground text-center italic border border-border/40 rounded-md bg-card mt-2">
          No exported files generated.
        </div>
      ) : (
        <div className="space-y-0.5 bg-card p-1 border border-border/60 rounded-md">
          {filteredExports.map((filePath) => {
            const fileName = filePath.split(/[\\/]/).pop() || '';
            return (
              <div
                key={filePath}
                className="flex justify-between items-center hover:bg-muted/40 p-1 px-2 border-b border-border/30 last:border-b-0 rounded transition-colors"
              >
                <div
                  onClick={() => handleOpenFile(filePath)}
                  className="flex flex-1 items-center gap-1.5 text-primary hover:underline truncate cursor-pointer"
                >
                  <FileCode size={13} className="shrink-0 text-emerald-500" />
                  <span className="truncate">{fileName}</span>
                </div>

                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => handleRevealFile(filePath)}
                  data-tooltip="Reveal in OS Explorer"
                >
                  <FolderOpen size={12} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const bottomContent = otherFiles.length > 0 ? (
    <div className="p-2.5 bg-card border-t border-border font-mono text-xs shrink-0 space-y-1.5">
      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>📄 Other Generated Files</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold border border-primary/20">
          {otherFiles.length}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {otherFiles.map((file) => {
          const fileName = file.path.split(/[\\/]/).pop() || file.path;
          return (
            <div
              key={file.path}
              className="flex items-center gap-1.5 bg-muted/30 hover:bg-muted/60 px-2 py-1 border border-border/60 rounded text-[11px] transition-colors"
            >
              <FileCode size={12} className="text-indigo-400 shrink-0" />
              <span
                onClick={() => handleOpenFile(file.path)}
                className="font-semibold text-primary hover:underline cursor-pointer truncate max-w-[220px]"
                title={file.path}
              >
                {fileName}
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => handleRevealFile(file.path)}
                data-tooltip="Reveal in OS Explorer"
                className="h-5 w-5 p-0"
              >
                <FolderOpen size={11} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <TopMiddleBottomPanel
      id="panel-exporter-files-tab"
      className="w-full h-full min-h-0 overflow-hidden bg-background font-mono text-xs"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default FilesTab;
