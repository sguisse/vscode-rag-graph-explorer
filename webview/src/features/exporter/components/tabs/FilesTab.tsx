import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen, FileJson, Search, BookOpen } from 'lucide-react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface FilesTabProps {
  reportData: ExportReportData | null;
  destDir: string;
  onOpenFile: (filePath: string) => void;
  onRevealFile: (filePath: string) => void;
}

export interface OtherFileItem {
  label: string;
  path: string;
}

export function getOtherFiles(reportData: ExportReportData | null): OtherFileItem[] {
  if (!reportData) return [];
  const results: OtherFileItem[] = [];
  const gen = (reportData.generated_files || {}) as Record<string, any>;

  const addUnique = (label: string, path: string) => {
    if (path && typeof path === 'string' && !results.some((r) => r.path === path)) {
      results.push({ label, path });
    }
  };

  // Collect reports from generated_files schema
  const codebaseReports: string[] = gen.codebase?.reports || [];
  const referenceReports: string[] = gen.reference?.reports || [];
  const flatReports: string[] = Array.isArray(gen.reports) ? gen.reports : [];

  [...codebaseReports, ...referenceReports, ...flatReports].forEach((p) => {
    const filename = p.split(/[\\/]/).pop() || p;
    addUnique(filename, p);
  });

  // Collect prompt files
  const promptFiles: string[] = Array.isArray(gen.prompt) ? gen.prompt : [];
  promptFiles.forEach((p) => {
    const filename = p.split(/[\\/]/).pop() || p;
    addUnique(`Prompt (${filename})`, p);
  });

  return results;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  reportData,
  destDir,
  onOpenFile,
  onRevealFile,
}) => {
  const [fileNameFilter, setFileNameFilter] = useState('');
  const [fileContentFilter, setFileContentFilter] = useState('');

  const gen = (reportData?.generated_files || {}) as Record<string, any>;

  const codebaseExports: string[] = gen.codebase?.exports || (Array.isArray(gen.exports) ? gen.exports : []);
  const referenceExports: string[] = gen.reference?.exports || [];

  const otherFiles = useMemo(() => getOtherFiles(reportData), [reportData]);

  const filteredCodebaseExports = useMemo(() => {
    return codebaseExports.filter((filePath) => {
      const name = filePath.split(/[\\/]/).pop() || '';
      if (fileNameFilter && !new RegExp(fileNameFilter, 'i').test(name)) return false;
      return true;
    });
  }, [codebaseExports, fileNameFilter]);

  const filteredReferenceExports = useMemo(() => {
    return referenceExports.filter((filePath) => {
      const name = filePath.split(/[\\/]/).pop() || '';
      if (fileNameFilter && !new RegExp(fileNameFilter, 'i').test(name)) return false;
      return true;
    });
  }, [referenceExports, fileNameFilter]);

  const handleOpenFile = (filePath: string) => {
    logInfo('[FilesTab] handleOpenFile handler triggered', [filePath]);
    onOpenFile(filePath);
  };

  const handleRevealFile = (filePath: string) => {
    logInfo('[FilesTab] handleRevealFile handler triggered', [filePath]);
    onRevealFile(filePath);
  };

  const topContent = (
    <div className="p-2.5 bg-muted/30 border-b border-border/60 shrink-0 font-mono text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded px-2 h-7">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <Input
            value={fileNameFilter}
            onChange={(e) => setFileNameFilter(e.target.value)}
            placeholder="Filter export files by name..."
            className="h-6 p-0 border-0 text-xs font-mono bg-transparent focus-visible:ring-0 flex-1 min-w-0"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded px-2 h-7">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <Input
            value={fileContentFilter}
            onChange={(e) => setFileContentFilter(e.target.value)}
            placeholder="Filter by content regex..."
            className="h-6 p-0 border-0 text-xs font-mono bg-transparent focus-visible:ring-0 flex-1 min-w-0"
          />
        </div>
      </div>
    </div>
  );

  const middleContent = (
    <div className="p-3 space-y-4 h-full min-h-0 overflow-y-auto font-mono text-xs select-none">
      {/* Codebase Exports Block */}
      <div className="space-y-1.5">
        <div className="pb-1 border-b border-border/60 font-bold text-xs text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileCode size={13} className="text-emerald-500" />
            <span>Codebase Export Files ({filteredCodebaseExports.length})</span>
          </span>
        </div>

        {filteredCodebaseExports.length === 0 ? (
          <div className="py-4 text-muted-foreground text-center italic border border-border/40 rounded-md bg-card">
            No codebase export files generated.
          </div>
        ) : (
          <div className="space-y-0.5 bg-card p-1 border border-border/60 rounded-md">
            {filteredCodebaseExports.map((filePath) => {
              const fileName = filePath.split(/[\\/]/).pop() || '';
              return (
                <div key={filePath} className="flex justify-between items-center hover:bg-muted/40 p-1 px-2 border-b border-border/30 last:border-b-0 rounded transition-colors group">
                  <div onClick={() => handleOpenFile(filePath)} className="flex flex-1 items-center gap-1.5 text-primary hover:underline truncate cursor-pointer font-bold">
                    <FileCode size={13} className="shrink-0 text-emerald-500" />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <Button size="icon-xs" variant="ghost" onClick={() => handleRevealFile(filePath)} data-tooltip="Reveal in OS Explorer">
                    <FolderOpen size={12} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reference Exports Block */}
      {filteredReferenceExports.length > 0 && (
        <div className="space-y-1.5">
          <div className="pb-1 border-b border-border/60 font-bold text-xs text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} className="text-indigo-400" />
              <span>Reference Export Files ({filteredReferenceExports.length})</span>
            </span>
          </div>

          <div className="space-y-0.5 bg-card p-1 border border-border/60 rounded-md">
            {filteredReferenceExports.map((filePath) => {
              const fileName = filePath.split(/[\\/]/).pop() || '';
              return (
                <div key={filePath} className="flex justify-between items-center hover:bg-muted/40 p-1 px-2 border-b border-border/30 last:border-b-0 rounded transition-colors group">
                  <div onClick={() => handleOpenFile(filePath)} className="flex flex-1 items-center gap-1.5 text-indigo-400 hover:underline truncate cursor-pointer font-bold">
                    <BookOpen size={13} className="shrink-0 text-indigo-400" />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <Button size="icon-xs" variant="ghost" onClick={() => handleRevealFile(filePath)} data-tooltip="Reveal in OS Explorer">
                    <FolderOpen size={12} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const bottomContent = (
    <div className="p-2.5 bg-card border-t border-border font-mono text-xs shrink-0 space-y-1.5 select-none">
      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>📄 Manifests, Prompt & Log Files</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold border border-primary/20">
          {otherFiles.length}
        </span>
      </div>

      {otherFiles.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic">
          No report manifests or prompt files generated.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {otherFiles.map((file) => {
            const fileName = file.path.split(/[\\/]/).pop() || file.path;
            return (
              <div key={file.path} className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/80 px-2 py-1 border border-border/60 rounded text-[11px] transition-colors group">
                <FileJson size={13} className="text-indigo-400 shrink-0" />
                <span onClick={() => handleOpenFile(file.path)} className="font-bold text-primary hover:underline cursor-pointer truncate max-w-[240px]" title={file.path}>
                  {fileName}
                </span>
                <Button size="icon-xs" variant="ghost" onClick={() => handleRevealFile(file.path)} data-tooltip="Reveal in OS Explorer" className="h-5 w-5 p-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <FolderOpen size={11} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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
