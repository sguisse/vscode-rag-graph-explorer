#!/usr/bin/env bash
set -e

echo "🚀 Fixing 'Copy files ctx' button clipboard export and notification handling..."

# Ensure target directories exist
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/files-selection
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/files-ctx-export/hooks

# -----------------------------------------------------------------------------
# 1. Update use-files-ctx-export-panel.ts: Ensure fallback clipboard copying & notification
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/components/files-ctx-export/hooks/use-files-ctx-export-panel.ts
import { useAppContextStore } from '@/store/useAppContextStore';
import { useCodebaseDomainState } from '../../../store/useCodebaseDomainState';
import { codebaseExporterApiService } from '@/services/api/codebase-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';
import { ExportStatus } from '@/shared/services/codebase-exporter/domain/model/export-status';

export function useFilesCtxExportPanel(
  handleCopy?: (text: string, message: string) => void,
  onCopyFilesCtx?: () => void,
  targetFilePathsProps?: string[]
) {
  const setNotification = useAppContextStore((s) => s.setNotification);

  const exportFormat = useCodebaseDomainState((s) => s.exportFormat);
  const maxChunk = useCodebaseDomainState((s) => s.maxChunk);
  const splitChunkByFileExtension = useCodebaseDomainState((s) => s.splitChunkByFileExtension);
  const copyAsFilesToClipboard = useCodebaseDomainState((s) => s.copyAsFilesToClipboard);
  const storeTargetFilePaths = useCodebaseDomainState((s) => s.targetFilePaths);

  const setExportFormat = useCodebaseDomainState((s) => s.setExportFormat);
  const setMaxChunk = useCodebaseDomainState((s) => s.setMaxChunk);
  const setSplitChunkByFileExtension = useCodebaseDomainState((s) => s.setSplitChunkByFileExtension);
  const setCopyAsFilesToClipboard = useCodebaseDomainState((s) => s.setCopyAsFilesToClipboard);

  const handleCopyFilesCtx = async () => {
    if (onCopyFilesCtx) {
      onCopyFilesCtx();
      return;
    }

    const files =
      targetFilePathsProps && targetFilePathsProps.length > 0
        ? targetFilePathsProps
        : storeTargetFilePaths || [];

    const parsedMaxChunk =
      typeof maxChunk === 'number' ? maxChunk : parseInt(String(maxChunk), 10) || 0;

    logInfo(`[FilesCtxExportPanel] Exporting ${files.length} selected file(s) in format '${exportFormat}'...`);

    try {
      const exportStatus: ExportStatus = await codebaseExporterApiService.exportSelectedFiles(
        files,
        exportFormat,
        parsedMaxChunk,
        splitChunkByFileExtension
      );

      logInfo(`[FilesCtxExportPanel] exportStatus received: ${JSON.stringify(exportStatus)}`);

      const checkStatusInterval = 1000;
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
          if (combinedFilesContent) {
            await vsCodeApiService.copyToClipboard(combinedFilesContent);
          }
          setNotification('Selected Files Content copied to clipboard!');
        }
      }
    } catch (err: any) {
      logError('[FilesCtxExportPanel] Error during exportSelectedFiles:', err);
      setNotification('Failed to export selected files context.');
    }
  };

  return {
    exportFormat,
    maxChunk,
    splitChunkByFileExtension,
    copyAsFilesToClipboard,
    setExportFormat,
    setMaxChunk,
    setSplitChunkByFileExtension,
    setCopyAsFilesToClipboard,
    handleCopyFilesCtx,
  };
}
EOF

# -----------------------------------------------------------------------------
# 2. Update files-context.tsx: Replace empty handleCopy fallback with functional clipboard & notify callback
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/components/files-selection/files-context.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { GitFork, FileText, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { useAppContextStore } from '@/store/useAppContextStore';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { useCodebaseDomainState } from '../../store/useCodebaseDomainState';
import { useFilesContext } from './hooks/use-files-context';
import { FilesCtxExportPanel } from '../files-ctx-export/files-ctx-export-panel';

export interface FilesContextPanelProps {
  initialCodebase?: CodebaseData;
  selectedEntity?: SelectedEntity | null;
  enableDownstream?: boolean;
  setEnableDownstream?: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream?: boolean;
  setEnableUpstream?: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet?: Set<string>;
  handleCopy?: (text: string, message: string) => void;
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

export function FilesContextPanel(props: FilesContextPanelProps = {}) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const storeCodebase = useCodebaseDomainState((s) => s.codebase);
  const storeSelectedEntity = useCodebaseDomainState((s) => s.selectedEntity);
  const storeEnableDownstream = useCodebaseDomainState((s) => s.enableDownstream);
  const storeSetEnableDownstream = useCodebaseDomainState((s) => s.setEnableDownstream);
  const storeEnableUpstream = useCodebaseDomainState((s) => s.enableUpstream);
  const storeSetEnableUpstream = useCodebaseDomainState((s) => s.setEnableUpstream);

  const initialCodebase = props.initialCodebase ?? storeCodebase;
  const selectedEntity = props.selectedEntity ?? storeSelectedEntity;
  const enableDownstream = props.enableDownstream ?? storeEnableDownstream;
  const setEnableDownstream = props.setEnableDownstream ?? storeSetEnableDownstream;
  const enableUpstream = props.enableUpstream ?? storeEnableUpstream;
  const setEnableUpstream = props.setEnableUpstream ?? storeSetEnableUpstream;

  const defaultHandleCopy = useCallback(async (text: string, message: string) => {
    if (text) {
      await vsCodeApiService.copyToClipboard(text);
    }
    setNotification(message);
  }, [setNotification]);

  const handleCopy = props.handleCopy ?? defaultHandleCopy;

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
    handleFileClick,
    handleFileDoubleClick,
  } = useFilesContext(
    initialCodebase,
    selectedEntity,
    enableDownstream,
    enableUpstream,
    props.impactedSet
  );

  const topContent = (
    <div className="space-y-1.5 mb-1 w-full">
      <div className="space-y-1.5 bg-muted/30 p-1.5 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[10px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-1.5 py-0.2 border border-amber-500/30 rounded font-mono text-[9px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-1.5 grid grid-cols-2">
          <Button
            onClick={() => setEnableUpstream((prev: any) => !prev)}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 font-mono text-xs font-bold rounded border transition-all h-7.5 cursor-pointer ${
              enableUpstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-xs'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={12} />
            Upstream ({upstreamCount})
          </Button>
          <Button
            onClick={() => setEnableDownstream((prev: any) => !prev)}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 font-mono text-xs font-bold rounded border transition-all h-7.5 cursor-pointer ${
              enableDownstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-xs'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={12} className="rotate-180" />
            Downstream ({downstreamCount})
          </Button>
        </div>
      </div>
    </div>
  );

  const middleContent = (
    <div className="flex flex-col py-1 pr-0 w-full h-full font-mono text-xs">
      <div className="flex flex-col flex-1 space-y-2 bg-orange-500/5 p-2 border border-orange-500/25 rounded-lg min-h-0 h-full">
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-500" />
            <h5 className="font-mono font-bold text-xs text-orange-500">Adjust Impact Plan</h5>
          </div>
          <span className="bg-orange-500/10 px-1.5 py-0.2 border border-orange-500/20 rounded font-mono font-bold text-[10px] text-orange-500">
            {selectedCount} Selected
          </span>
        </div>

        <div className="flex-1 space-y-1.5 pr-1 min-h-0 overflow-y-auto">
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
                  <div className={`flex items-center justify-between px-1.5 py-1 ${style.bgHeader} select-none`}>
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
                    <span className="bg-muted ml-2 px-1.5 py-0.2 rounded font-mono text-[9px] text-muted-foreground">
                      {groupFiles.filter((f) => selectedFiles[f.id]).length}/{groupFiles.length}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="space-y-0.5 bg-background/40 p-1">
                      {groupFiles.map((file) => {
                        const fileSizeKb = (((file as any).size || (file as any).content?.length || 0) / 1024).toFixed(1);

                        return (
                          <div
                            key={file.id}
                            className="flex justify-between items-center hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors"
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
                                onClick={() => handleFileClick(file)}
                                onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                              >
                                {file.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <span className="bg-muted px-1.5 py-0.2 rounded text-[9px] text-muted-foreground">
                                {file.language || 'unknown'}
                              </span>
                              <span className="bg-muted px-1.5 py-0.2 rounded font-mono text-[9px] text-muted-foreground">
                                {fileSizeKb}&nbsp;KB
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
    <div className="space-y-1.5 mt-1 w-full">
      <div className="space-y-1 bg-card p-1.5 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-primary" />
            <h4 className="font-mono font-bold text-xs text-foreground uppercase tracking-wider">
              Selected Files Context
            </h4>
          </div>
        </div>

        <div className="gap-1.5 grid grid-cols-10 text-center">
          <div className="col-span-2 bg-orange-500/10 p-1 border border-orange-500/20 rounded">
            <span className="block text-[9px] text-orange-500 truncate uppercase">Selected</span>
            <span className="font-bold text-xs text-orange-500">{selectedCount} / {initialCodebase?.files?.length || 0}</span>
          </div>
          <div className="col-span-2 bg-indigo-500/10 p-1 border border-indigo-500/20 rounded">
            <span className="block text-[9px] text-indigo-500 truncate uppercase">Upstream</span>
            <span className="font-bold text-xs text-indigo-500">{selectedUpstreamCount} / {upstreamCount}</span>
          </div>
          <div className="col-span-2 bg-blue-500/10 p-1 border border-blue-500/20 rounded">
            <span className="block text-[9px] text-blue-500 truncate uppercase">Downstream</span>
            <span className="font-bold text-xs text-blue-500">{selectedDownstreamCount} / {downstreamCount}</span>
          </div>

          <div className="col-span-4 bg-emerald-500/10 p-1 border border-emerald-500/20 rounded">
            <span className="block text-[9px] text-emerald-500 truncate uppercase">Token Size</span>
            <span className="font-bold text-xs text-emerald-500">
              {(combinedSelectedFilesContext.length / 1024).toFixed(1)} / {(totalFilesContext.length / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      </div>

      <div className="bg-background pt-1 w-full">
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
      className="font-mono text-xs animate-in duration-200 fade-in h-full"
    />
  );
}

export const FilesContextTab = FilesContextPanel;
EOF

echo "✅ feat/fix: Resolved 'Copy files ctx' button logic to copy exported context to clipboard and trigger notifications correctly!"
echo "💡 Next step: Run 'npm run build' to re-verify build cleanliness."
