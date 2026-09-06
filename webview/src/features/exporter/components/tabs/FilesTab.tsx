import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen, FileJson, Search } from 'lucide-react';
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

  // 1. Direct properties on reportData or generated_files
  if (gen.report_file) addUnique('Report JSON (-report.json)', gen.report_file);
  if (gen.tree_file) addUnique('Tree Manifest JSON (-tree.json)', gen.tree_file);
  if (gen.report_json) addUnique('Report JSON (-report.json)', gen.report_json);
  if (gen.tree_json) addUnique('Tree Manifest JSON (-tree.json)', gen.tree_json);

  const reportDataAny = reportData as Record<string, any>;
  if (reportDataAny.report_file_path) addUnique('Report JSON (-report.json)', reportDataAny.report_file_path);
  if (reportDataAny.tree_file_path) addUnique('Tree Manifest JSON (-tree.json)', reportDataAny.tree_file_path);

  // 2. Scan generated_files.exports array for metadata files ending with -report.json / -tree.json
  const exportsList: string[] = Array.isArray(gen.exports) ? gen.exports : [];
  for (const p of exportsList) {
    if (typeof p !== 'string') continue;
    const filename = p.split(/[\\/]/).pop() || '';
    if (filename.endsWith('-report.json') || filename.endsWith('report.json')) {
      addUnique('Report File (-report.json)', p);
    } else if (filename.endsWith('-tree.json') || filename.endsWith('tree.json') || filename.endsWith('-tree_manifest.json')) {
      addUnique('Tree Manifest File (-tree.json)', p);
    }
  }

  // 3. Scan all other properties in generated_files object
  for (const [key, val] of Object.entries(gen)) {
    if (key === 'exports') continue;
    if (typeof val === 'string' && val.trim()) {
      const filename = val.split(/[\\/]/).pop() || val;
      addUnique(filename.endsWith('.json') ? filename : `${key} (${filename})`, val);
    }
  }

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

  const exports: string[] = reportData?.generated_files?.exports || [];
  const otherFiles = useMemo(() => getOtherFiles(reportData), [reportData]);

  // Separate data exports from metadata exports if metadata files were placed in exports array
  const otherFilePathsSet = useMemo(() => new Set(otherFiles.map((f) => f.path)), [otherFiles]);

  const filteredExports = useMemo(() => {
    return exports.filter((filePath) => {
      // Exclude manifest/report files from main data files list if present
      if (otherFilePathsSet.has(filePath)) return false;

      const name = filePath.split(/[\\/]/).pop() || '';
      if (fileNameFilter && !new RegExp(fileNameFilter, 'i').test(name)) {
        return false;
      }
      return true;
    });
  }, [exports, otherFilePathsSet, fileNameFilter]);

  const handleOpenFile = (filePath: string) => {
    logInfo('[FilesTab] handleOpenFile handler triggered', [filePath]);
    onOpenFile(filePath);
  };

  const handleRevealFile = (filePath: string) => {
    logInfo('[FilesTab] handleRevealFile handler triggered', [filePath]);
    onRevealFile(filePath);
  };

  // Top Section: Search Box
  const topContent = (
    <div className="p-2.5 bg-muted/30 border-b border-border/60 shrink-0 font-mono text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded px-2 h-7">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <Input
            value={fileNameFilter}
            onChange={(e) => {
              logInfo('[FilesTab] fileNameFilter changed', [e.target.value]);
              setFileNameFilter(e.target.value);
            }}
            placeholder="Filter by file name regex..."
            className="h-6 p-0 border-0 text-xs font-mono bg-transparent focus-visible:ring-0 flex-1 min-w-0"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded px-2 h-7">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <Input
            value={fileContentFilter}
            onChange={(e) => {
              logInfo('[FilesTab] fileContentFilter changed', [e.target.value]);
              setFileContentFilter(e.target.value);
            }}
            placeholder="Filter by content regex..."
            className="h-6 p-0 border-0 text-xs font-mono bg-transparent focus-visible:ring-0 flex-1 min-w-0"
          />
        </div>
      </div>
    </div>
  );

  // Middle Section (Center): Data Exported Files List
  const middleContent = (
    <div className="p-3 space-y-2 h-full min-h-0 overflow-y-auto font-mono text-xs select-none">
      <div className="pb-1 border-b border-border/60 font-bold text-xs text-foreground flex items-center justify-between">
        <span>📂 Data Exported Files ({filteredExports.length})</span>
      </div>

      {filteredExports.length === 0 ? (
        <div className="py-8 text-muted-foreground text-center italic border border-border/40 rounded-md bg-card mt-2">
          No exported data files generated.
        </div>
      ) : (
        <div className="space-y-0.5 bg-card p-1 border border-border/60 rounded-md">
          {filteredExports.map((filePath) => {
            const fileName = filePath.split(/[\\/]/).pop() || '';
            return (
              <div
                key={filePath}
                className="flex justify-between items-center hover:bg-muted/40 p-1 px-2 border-b border-border/30 last:border-b-0 rounded transition-colors group"
              >
                <div
                  onClick={() => handleOpenFile(filePath)}
                  className="flex flex-1 items-center gap-1.5 text-primary hover:underline truncate cursor-pointer font-bold"
                >
                  <FileCode size={13} className="shrink-0 text-emerald-500" />
                  <span className="truncate">{fileName}</span>
                </div>

                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => handleRevealFile(filePath)}
                  data-tooltip="Reveal in OS Explorer"
                  className="opacity-80 group-hover:opacity-100 transition-opacity"
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

  // Bottom Section: Manifest / Metadata Files (-report.json, -tree.json)
  const bottomContent = (
    <div className="p-2.5 bg-card border-t border-border font-mono text-xs shrink-0 space-y-1.5 select-none">
      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>📄 Manifest & Metadata Files</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold border border-primary/20">
          {otherFiles.length}
        </span>
      </div>

      {otherFiles.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic">
          No manifest files (-report.json, -tree.json) found in export output.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {otherFiles.map((file) => {
            const fileName = file.path.split(/[\\/]/).pop() || file.path;
            return (
              <div
                key={file.path}
                className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/80 px-2 py-1 border border-border/60 rounded text-[11px] transition-colors group"
              >
                <FileJson size={13} className="text-indigo-400 shrink-0" />
                <span
                  onClick={() => handleOpenFile(file.path)}
                  className="font-bold text-primary hover:underline cursor-pointer truncate max-w-[240px]"
                  title={file.path}
                >
                  {fileName}
                </span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => handleRevealFile(file.path)}
                  data-tooltip="Reveal in OS Explorer"
                  className="h-5 w-5 p-0 opacity-80 group-hover:opacity-100 transition-opacity"
                >
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
