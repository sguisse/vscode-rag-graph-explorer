import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileJson } from 'lucide-react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { GeneratedFilesPanel, GeneratedScopeData } from './GeneratedFilesPanel';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface FilesTabProps {
  reportData: ExportReportData | null;
  destDir: string;
  onOpenFile: (filePath: string) => void;
  onRevealFile: (filePath: string) => void;
}

export interface PromptLogFileItem {
  label: string;
  path: string;
}

export function getPromptAndLogFiles(reportData: ExportReportData | null): PromptLogFileItem[] {
  if (!reportData) return [];
  const results: PromptLogFileItem[] = [];
  const gen = (reportData.generated_files || {}) as Record<string, any>;

  const addUnique = (label: string, path: string) => {
    if (path && typeof path === 'string' && !results.some((r) => r.path === path)) {
      results.push({ label, path });
    }
  };

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
  const gen = (reportData?.generated_files || {}) as Record<string, any>;

  const codebaseScopeData = useMemo<GeneratedScopeData | null>(() => {
    if (!reportData?.generated_files) return null;
    if (gen.codebase) {
      return gen.codebase;
    }
    // Fallback for flat schema
    return {
      exports: Array.isArray(gen.exports) ? gen.exports : [],
      reports: Array.isArray(gen.reports) ? gen.reports : [],
    };
  }, [reportData, gen]);

  const referenceScopeData = useMemo<GeneratedScopeData | null>(() => {
    if (!reportData?.generated_files) return null;
    return gen.reference || null;
  }, [reportData, gen]);

  const hasReference = Boolean(
    referenceScopeData &&
      ((referenceScopeData.exports && referenceScopeData.exports.length > 0) ||
        (referenceScopeData.reports && referenceScopeData.reports.length > 0))
  );

  const promptAndLogFiles = useMemo(() => getPromptAndLogFiles(reportData), [reportData]);

  const handleOpenFile = (filePath: string) => {
    logInfo('[FilesTab] handleOpenFile handler triggered', [filePath]);
    onOpenFile(filePath);
  };

  const handleRevealFile = (filePath: string) => {
    logInfo('[FilesTab] handleRevealFile handler triggered', [filePath]);
    onRevealFile(filePath);
  };

  const middleContent = (
    <div className="p-2 h-full min-h-0 w-full overflow-hidden">
      {hasReference ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full min-h-0">
          <GeneratedFilesPanel
            title="Codebase Export Files"
            scopeType="codebase"
            scopeData={codebaseScopeData}
            onOpenFile={handleOpenFile}
            onRevealFile={handleRevealFile}
          />
          <GeneratedFilesPanel
            title="Reference Export Files"
            scopeType="reference"
            scopeData={referenceScopeData}
            onOpenFile={handleOpenFile}
            onRevealFile={handleRevealFile}
          />
        </div>
      ) : (
        <GeneratedFilesPanel
          title="Codebase Export Files"
          scopeType="codebase"
          scopeData={codebaseScopeData}
          onOpenFile={handleOpenFile}
          onRevealFile={handleRevealFile}
        />
      )}
    </div>
  );

  const bottomContent = (
    <div className="p-2.5 bg-card border-t border-border font-mono text-xs shrink-0 space-y-1.5 select-none">
      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>📄 Prompt & Log Files</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold border border-primary/20">
          {promptAndLogFiles.length}
        </span>
      </div>

      {promptAndLogFiles.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic">
          No prompt or log files generated.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {promptAndLogFiles.map((file) => {
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
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default FilesTab;
