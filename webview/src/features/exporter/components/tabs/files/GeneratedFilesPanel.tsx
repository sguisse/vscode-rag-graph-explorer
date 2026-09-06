import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen, FileJson, Search, BookOpen } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface GeneratedScopeData {
  exports?: string[];
  reports?: string[];
  tree_manifest?: any;
}

export interface GeneratedFilesPanelProps {
  title: string;
  scopeType: 'codebase' | 'reference';
  scopeData?: GeneratedScopeData | null;
  onOpenFile: (filePath: string) => void;
  onRevealFile: (filePath: string) => void;
}

export const GeneratedFilesPanel: React.FC<GeneratedFilesPanelProps> = ({
  title,
  scopeType,
  scopeData,
  onOpenFile,
  onRevealFile,
}) => {
  const [contentFilter, setContentFilter] = useState('');

  const exportsList: string[] = useMemo(() => {
    return scopeData?.exports || [];
  }, [scopeData]);

  const reportsList: string[] = useMemo(() => {
    return scopeData?.reports || [];
  }, [scopeData]);

  const filteredExports = useMemo(() => {
    if (!contentFilter.trim()) return exportsList;
    return exportsList.filter((filePath) => {
      const fileName = filePath.split(/[\\/]/).pop() || '';
      try {
        return new RegExp(contentFilter, 'i').test(fileName) || new RegExp(contentFilter, 'i').test(filePath);
      } catch {
        return (
          fileName.toLowerCase().includes(contentFilter.toLowerCase()) ||
          filePath.toLowerCase().includes(contentFilter.toLowerCase())
        );
      }
    });
  }, [exportsList, contentFilter]);

  const ScopeIcon = scopeType === 'codebase' ? FileCode : BookOpen;
  const iconColor = scopeType === 'codebase' ? 'text-emerald-500' : 'text-indigo-400';
  const textColor = scopeType === 'codebase' ? 'text-primary' : 'text-indigo-400';

  const topContent = (
    <div className="p-2 bg-muted/30 border-b border-border/60 shrink-0 font-mono text-xs">
      <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded px-2 h-7">
        <Search size={12} className="text-muted-foreground shrink-0" />
        <Input
          value={contentFilter}
          onChange={(e) => setContentFilter(e.target.value)}
          placeholder={`Search ${scopeType} generated files content/path...`}
          className="h-6 p-0 border-0 text-xs font-mono bg-transparent focus-visible:ring-0 flex-1 min-w-0"
        />
      </div>
    </div>
  );

  const middleContent = (
    <div className="p-3 space-y-2 h-full min-h-0 overflow-y-auto font-mono text-xs select-none">
      <div className="pb-1 border-b border-border/60 font-bold text-xs text-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ScopeIcon size={13} className={iconColor} />
          <span>{title} ({filteredExports.length})</span>
        </span>
      </div>

      {filteredExports.length === 0 ? (
        <div className="py-4 text-muted-foreground text-center italic border border-border/40 rounded-md bg-card">
          No {scopeType} export files generated.
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
                  onClick={() => {
                    logInfo(`[GeneratedFilesPanel:${scopeType}] handleOpenFile`, [filePath]);
                    onOpenFile(filePath);
                  }}
                  className={`flex flex-1 items-center gap-1.5 ${textColor} hover:underline truncate cursor-pointer font-bold`}
                >
                  <ScopeIcon size={13} className={`shrink-0 ${iconColor}`} />
                  <span className="truncate">{fileName}</span>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    logInfo(`[GeneratedFilesPanel:${scopeType}] handleRevealFile`, [filePath]);
                    onRevealFile(filePath);
                  }}
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

  const bottomContent = (
    <div className="p-2.5 bg-card border-t border-border font-mono text-xs shrink-0 space-y-1.5 select-none">
      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>📄 Manifests report and tree</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold border border-primary/20">
          {reportsList.length}
        </span>
      </div>

      {reportsList.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic">
          No manifest or report files generated for {scopeType}.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {reportsList.map((filePath) => {
            const fileName = filePath.split(/[\\/]/).pop() || filePath;
            return (
              <div
                key={filePath}
                className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/80 px-2 py-1 border border-border/60 rounded text-[11px] transition-colors group"
              >
                <FileJson size={13} className="text-indigo-400 shrink-0" />
                <span
                  onClick={() => {
                    logInfo(`[GeneratedFilesPanel:${scopeType}] handleOpenReport`, [filePath]);
                    onOpenFile(filePath);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer truncate max-w-[500px]"
                  title={filePath}
                >
                  {fileName}
                </span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    logInfo(`[GeneratedFilesPanel:${scopeType}] handleRevealReport`, [filePath]);
                    onRevealFile(filePath);
                  }}
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
      id={`panel-generated-files-${scopeType}`}
      className="w-full h-full min-h-0 overflow-hidden bg-background font-mono text-xs border border-border/60 rounded-md"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default GeneratedFilesPanel;
