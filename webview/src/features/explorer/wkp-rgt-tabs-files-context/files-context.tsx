import React, { useEffect, useRef } from 'react';
import { GitFork, FileText, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { FilesCtxExportPanel } from '../components/files-ctx-export/files-ctx-export-panel';
import { useFilesContext } from './hooks/use-files-context';

interface FilesContextPanelProps {
  initialCodebase: CodebaseData;
  selectedEntity: SelectedEntity | null;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

interface TriStateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
  );
}

export function FilesContextPanel({
  initialCodebase,
  selectedEntity,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: FilesContextPanelProps) {
  const {
    downstreamCount,
    upstreamCount,
    depthGroups,
    getGroupStyle,
    selectedFiles,
    expandedGroups,
    toggleGroupCheckbox,
    toggleFileCheckbox,
    toggleGroupExpand,
    selectedCount,
    selectedUpstreamCount,
    selectedDownstreamCount,
    totalFilesContext,
    combinedSelectedFilesContext,
    targetFilePaths,
  } = useFilesContext(
    initialCodebase,
    selectedEntity,
    enableDownstream,
    enableUpstream,
    impactedSet
  );

  const topContent = (
    <div className="space-y-2 mb-2 w-full">
      <div className="space-y-3 bg-card p-4 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Unified Files Context
            </h4>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-4 text-center">
          <div className="bg-muted/40 p-2 border border-border/50 rounded">
            <span className="block text-[9px] text-muted-foreground truncate uppercase">Total Files</span>
            <span className="font-bold text-foreground text-xs">{initialCodebase?.files?.length || 0}</span>
          </div>
          <div className="bg-indigo-500/10 p-2 border border-indigo-500/20 rounded">
            <span className="block text-[9px] text-indigo-500 truncate uppercase">Upstream</span>
            <span className="font-bold text-indigo-500 text-xs">{upstreamCount}</span>
          </div>
          <div className="bg-blue-500/10 p-2 border border-blue-500/20 rounded">
            <span className="block text-[9px] text-blue-500 truncate uppercase">Downstream</span>
            <span className="font-bold text-blue-500 text-xs">{downstreamCount}</span>
          </div>
          <div className="bg-yellow-500/10 p-2 border border-yellow-500/30 rounded">
            <span className="block text-[9px] text-yellow-600 dark:text-yellow-400 truncate uppercase">Token Size</span>
            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xs">{(totalFilesContext.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 bg-muted/30 p-3 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-2 grid grid-cols-2">
          <Button
            onClick={() => setEnableUpstream((prev) => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableUpstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} />
            Upstream ({upstreamCount})
          </Button>
          <Button
            onClick={() => setEnableDownstream((prev) => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableDownstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} className="rotate-180" />
            Downstream ({downstreamCount})
          </Button>
        </div>
      </div>
    </div>
  );

  const middleContent = (
    <div className="flex flex-col h-full py-2 pr-1 w-full font-mono text-xs">
      <div className="flex flex-col flex-1 space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg min-h-0 h-full">
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-500" />
            <h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5>
          </div>
          <span className="bg-orange-500/10 px-2 py-0.5 border border-orange-500/20 rounded font-mono font-bold text-[10px] text-orange-500">
            {selectedCount} Selected
          </span>
        </div>

        <div className="flex-1 space-y-2 pr-1 min-h-0 overflow-y-auto">
          {depthGroups.length === 0 ? (
            <div className="py-2 text-[11px] text-muted-foreground text-center italic">
              No impacted files or selected target entity.
            </div>
          ) : (
            depthGroups.map((group) => {
              const groupFiles = group.files;
              const isAllChecked = groupFiles.length > 0 && groupFiles.every((f) => selectedFiles[f.id]);
              const isSomeChecked = groupFiles.some((f) => selectedFiles[f.id]);
              const isIndeterminate = isSomeChecked && !isAllChecked;
              const isExpanded = expandedGroups[group.key] ?? true;
              const style = getGroupStyle(group.key);

              return (
                <div key={group.key} className={`border ${style.border} rounded-md bg-background/60 overflow-hidden`}>
                  <div className={`flex items-center justify-between px-2 py-1.5 ${style.bgHeader} select-none`}>
                    <div className="flex flex-1 items-center gap-1.5 min-w-0">
                      <TriStateCheckbox
                        checked={isAllChecked}
                        indeterminate={isIndeterminate}
                        onChange={() => toggleGroupCheckbox(group.key, groupFiles)}
                        className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                      />
                      <div
                        className="flex flex-1 items-center gap-1 min-w-0 cursor-pointer"
                        onClick={() => toggleGroupExpand(group.key)}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className={`${style.icon} shrink-0`} />
                        ) : (
                          <ChevronRight size={14} className={`${style.icon} shrink-0`} />
                        )}
                        <span className={`text-[11px] truncate ${style.text}`}>{group.label}</span>
                      </div>
                    </div>
                    <span className="bg-muted ml-2 px-1.5 py-0.5 rounded font-mono text-[9px] text-muted-foreground">
                      {groupFiles.filter((f) => selectedFiles[f.id]).length}/{groupFiles.length}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="space-y-1 bg-background/40 p-1">
                      {groupFiles.map((file) => {
                        const fileSizeKb = (((file as any).size || (file as any).content?.length || 0) / 1024).toFixed(1);

                        return (
                          <div
                            key={file.id}
                            className="flex justify-between items-center hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                          >
                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={!!selectedFiles[file.id]}
                                onChange={() => toggleFileCheckbox(file.id)}
                                className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                              />
                              <span
                                className={`truncate text-[11px] cursor-pointer ${
                                  selectedFiles[file.id] ? 'font-semibold text-foreground' : 'text-muted-foreground line-through'
                                }`}
                                onClick={() => toggleFileCheckbox(file.id)}
                              >
                                {file.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">
                                {file.language || 'unknown'}
                              </span>
                              <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[9px] text-muted-foreground">
                                {fileSizeKb} KB
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const bottomContent = (
    <div className="space-y-2 mt-2 w-full">
      <div className="space-y-3 bg-card p-4 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Selected Files Context
            </h4>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-4 text-center">
          <div className="bg-orange-500/10 p-2 border border-orange-500/20 rounded">
            <span className="block text-[9px] text-orange-500 truncate uppercase">Selected</span>
            <span className="font-bold text-orange-500 text-xs">{selectedCount}</span>
          </div>
          <div className="bg-indigo-500/10 p-2 border border-indigo-500/20 rounded">
            <span className="block text-[9px] text-indigo-500 truncate uppercase">Upstream</span>
            <span className="font-bold text-indigo-500 text-xs">{selectedUpstreamCount}</span>
          </div>
          <div className="bg-blue-500/10 p-2 border border-blue-500/20 rounded">
            <span className="block text-[9px] text-blue-500 truncate uppercase">Downstream</span>
            <span className="font-bold text-blue-500 text-xs">{selectedDownstreamCount}</span>
          </div>

          <div className="bg-emerald-500/10 p-2 border border-emerald-500/20 rounded">
            <span className="block text-[9px] text-emerald-500 truncate uppercase">Token Size</span>
            <span className="font-bold text-emerald-500 text-xs">{(combinedSelectedFilesContext.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

      <div className="bg-background pt-2 w-full">
        <FilesCtxExportPanel targetFilePaths={targetFilePaths} handleCopy={handleCopy} />
      </div>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="files-context-panel"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
      className="h-full font-mono text-xs animate-in duration-200 fade-in"
    />
  );
}
