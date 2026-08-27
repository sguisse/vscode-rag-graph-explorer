#!/usr/bin/env bash
set -e

echo "🚀 Updating bottomContent selectedCount to reflect checked items in Adjust Impact Plan block..."

# Ensure target directories exist
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/files-selection/hooks
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/files-selection

# -----------------------------------------------------------------------------
# 1. Update use-files-context.ts: Compute planFileIds, selectedCount, and totalPlanCount strictly for Impact Plan items
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/components/files-selection/hooks/use-files-context.ts
import { useMemo, useEffect, useCallback } from 'react';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';
import { useCodebaseDomainState, CodebaseDomainState } from '../../../store/useCodebaseDomainState';
import { useCodebaseActions } from '../../../handlers/useCodebaseActions';

export interface DepthFileGroup {
  key: string;
  label: string;
  order: number;
  files: CodebaseFile[];
}

export function useFilesContext(
  initialCodebase: CodebaseData,
  selectedEntity: SelectedEntity | null,
  propEnableDownstream?: boolean,
  propEnableUpstream?: boolean,
  propImpactedSet?: Set<string>
) {
  const setTargetFilePaths = useCodebaseDomainState((s: CodebaseDomainState) => s.setTargetFilePaths);
  const setFocusedNodeId = useCodebaseDomainState((s: CodebaseDomainState) => s.setFocusedNodeId);

  const storeEnableDownstream = useCodebaseDomainState((s: CodebaseDomainState) => s.enableDownstream);
  const storeEnableUpstream = useCodebaseDomainState((s: CodebaseDomainState) => s.enableUpstream);
  const callersDepth = useCodebaseDomainState((s: CodebaseDomainState) => s.callersDepth) ?? 2;
  const calleesDepth = useCodebaseDomainState((s: CodebaseDomainState) => s.calleesDepth) ?? 2;

  const enableDownstream = propEnableDownstream ?? storeEnableDownstream;
  const enableUpstream = propEnableUpstream ?? storeEnableUpstream;

  const selectedFiles = useCodebaseDomainState((s: CodebaseDomainState) => s.selectedContextFiles);
  const setSelectedFiles = useCodebaseDomainState((s: CodebaseDomainState) => s.setSelectedContextFiles);
  const expandedGroups = useCodebaseDomainState((s: CodebaseDomainState) => s.expandedContextGroups);
  const setExpandedGroups = useCodebaseDomainState((s: CodebaseDomainState) => s.setExpandedContextGroups);

  const { revealAndCopyFile, openFileInEditor } = useCodebaseActions();

  // Clicking a file in Adjust Impact Plan highlights & centers node temporarily without selecting it
  const handleFileClick = useCallback((file: CodebaseFile) => {
    if (file.path) {
      revealAndCopyFile(file);
    }
    setFocusedNodeId(file.id);
  }, [revealAndCopyFile, setFocusedNodeId]);

  const handleFileDoubleClick = useCallback((file: CodebaseFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (file.path) {
      openFileInEditor(file);
    }
  }, [openFileInEditor]);

  const impactedSet = useMemo(() => {
    if (propImpactedSet && propImpactedSet.size > 0) return propImpactedSet;
    if (!selectedEntity || !initialCodebase?.dependencies) return new Set<string>();
    return calculateTransitiveImpact(
      selectedEntity,
      initialCodebase.dependencies,
      callersDepth,
      calleesDepth,
      enableDownstream,
      enableUpstream
    );
  }, [propImpactedSet, selectedEntity, initialCodebase?.dependencies, callersDepth, calleesDepth, enableDownstream, enableUpstream]);

  const downstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const dsSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, callersDepth, calleesDepth, true, false);
    return initialCodebase.files.filter((f) => dsSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase, callersDepth, calleesDepth]);

  const upstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const usSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, callersDepth, calleesDepth, false, true);
    return initialCodebase.files.filter((f) => usSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase, callersDepth, calleesDepth]);

  const depthGroups = useMemo<DepthFileGroup[]>(() => {
    if (!selectedEntity || !initialCodebase?.files) return [];

    const targetId = selectedEntity.nodeId;
    const deps = initialCodebase.dependencies || [];

    const dsDepthMap = new Map<string, number>();
    const dsQueue: Array<{ id: string; depth: number }> = [{ id: targetId, depth: 0 }];
    dsDepthMap.set(targetId, 0);

    while (dsQueue.length > 0) {
      const { id, depth } = dsQueue.shift()!;
      deps.forEach((dep) => {
        const src = dep.sourceNode || dep.source;
        const tgt = dep.targetNode || dep.target;
        if (src === id && tgt) {
          if (!dsDepthMap.has(tgt) || dsDepthMap.get(tgt)! > depth + 1) {
            dsDepthMap.set(tgt, depth + 1);
            dsQueue.push({ id: tgt, depth: depth + 1 });
          }
        }
      });
    }

    const usDepthMap = new Map<string, number>();
    const usQueue: Array<{ id: string; depth: number }> = [{ id: targetId, depth: 0 }];
    usDepthMap.set(targetId, 0);

    while (usQueue.length > 0) {
      const { id, depth } = usQueue.shift()!;
      deps.forEach((dep) => {
        const src = dep.sourceNode || dep.source;
        const tgt = dep.targetNode || dep.target;
        if (tgt === id && src) {
          if (!usDepthMap.has(src) || usDepthMap.get(src)! > depth + 1) {
            usDepthMap.set(src, depth + 1);
            usQueue.push({ id: src, depth: depth + 1 });
          }
        }
      });
    }

    const groupsMap = new Map<string, DepthFileGroup>();

    const getOrCreateGroup = (key: string, label: string, order: number) => {
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { key, label, order, files: [] });
      }
      return groupsMap.get(key)!;
    };

    initialCodebase.files.forEach((file) => {
      const isTarget = file.id === targetId;
      const isImpacted =
        impactedSet.has(file.id) ||
        Array.from(impactedSet).some((item) => item === file.id || item.startsWith(file.id + '::'));

      if (!isImpacted && !isTarget) return;

      if (isTarget) {
        getOrCreateGroup('target', 'Selected Target File', 150).files.push(file);
      } else {
        const usDepth = usDepthMap.get(file.id);
        const dsDepth = dsDepthMap.get(file.id);

        if (enableUpstream && usDepth !== undefined && usDepth > 0) {
          const key = `upstream-${usDepth}`;
          const label = `Upstream Depth ${usDepth} (Callers)`;
          getOrCreateGroup(key, label, 100 + usDepth).files.push(file);
        } else if (enableDownstream && dsDepth !== undefined && dsDepth > 0) {
          const key = `downstream-${dsDepth}`;
          const label = `Downstream Depth ${dsDepth} (Callees)`;
          getOrCreateGroup(key, label, 200 + dsDepth).files.push(file);
        } else if (usDepth !== undefined && usDepth > 0) {
          const key = `upstream-${usDepth}`;
          const label = `Upstream Depth ${usDepth} (Callers)`;
          getOrCreateGroup(key, label, 100 + usDepth).files.push(file);
        } else if (dsDepth !== undefined && dsDepth > 0) {
          const key = `downstream-${dsDepth}`;
          const label = `Downstream Depth ${dsDepth} (Callees)`;
          getOrCreateGroup(key, label, 200 + dsDepth).files.push(file);
        } else {
          getOrCreateGroup('other-impacted', 'Other Impacted Files', 300).files.push(file);
        }
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);
  }, [selectedEntity, initialCodebase, impactedSet, enableUpstream, enableDownstream]);

  // Unique set of file IDs belonging to the Adjust Impact Plan block
  const planFileIds = useMemo(() => {
    const set = new Set<string>();
    depthGroups.forEach((group) => {
      group.files.forEach((file) => set.add(file.id));
    });
    return set;
  }, [depthGroups]);

  // Number of file items checked specifically in the Adjust Impact Plan block
  const selectedCount = useMemo(() => {
    return Array.from(planFileIds).filter((id) => selectedFiles[id] !== false).length;
  }, [planFileIds, selectedFiles]);

  // Total file items present in the Adjust Impact Plan block
  const totalPlanCount = useMemo(() => {
    return planFileIds.size;
  }, [planFileIds]);

  const selectedUpstreamCount = useMemo(() => {
    return depthGroups
      .filter((g) => g.key.startsWith('upstream'))
      .reduce((acc, g) => acc + g.files.filter((f) => selectedFiles[f.id] !== false).length, 0);
  }, [depthGroups, selectedFiles]);

  const selectedDownstreamCount = useMemo(() => {
    return depthGroups
      .filter((g) => g.key.startsWith('downstream'))
      .reduce((acc, g) => acc + g.files.filter((f) => selectedFiles[f.id] !== false).length, 0);
  }, [depthGroups, selectedFiles]);

  const totalFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .filter((file) => planFileIds.has(file.id))
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase, planFileIds]);

  const combinedSelectedFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .filter((file) => planFileIds.has(file.id) && selectedFiles[file.id] !== false)
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase, planFileIds, selectedFiles]);

  const targetFilePaths = useMemo(() => {
    return combinedSelectedFilesContext
      ? combinedSelectedFilesContext.split('\n').map((p) => p.trim()).filter(Boolean)
      : [];
  }, [combinedSelectedFilesContext]);

  useEffect(() => {
    setTargetFilePaths(targetFilePaths);
  }, [targetFilePaths, setTargetFilePaths]);

  const getGroupStyle = (key: string) => {
    if (key === 'target') {
      return {
        border: 'border-orange-500/20 dark:border-orange-500/30',
        bgHeader: 'bg-orange-500/10 border-b border-orange-500/20',
        text: 'text-orange-500',
        icon: 'text-orange-500',
      };
    }
    if (key.startsWith('upstream')) {
      return {
        border: 'border-indigo-500/30 dark:border-indigo-500/40',
        bgHeader: 'bg-indigo-500/10 border-b border-indigo-500/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        icon: 'text-indigo-500 dark:text-indigo-400',
      };
    }
    if (key.startsWith('downstream')) {
      return {
        border: 'border-blue-500/30 dark:border-blue-500/40',
        bgHeader: 'bg-blue-500/10 border-b border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500 dark:text-blue-400',
      };
    }
    return {
      border: 'border-emerald-500/40 dark:border-emerald-500/50',
      bgHeader: 'bg-emerald-500/15 border-b border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400 font-bold',
      icon: 'text-emerald-500 dark:text-emerald-400',
    };
  };

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    depthGroups.forEach((group) => {
      initialExpanded[group.key] = true;
    });

    setExpandedGroups((prev: Record<string, boolean>) => {
      const next = { ...initialExpanded, ...prev };
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      let hasChanged = prevKeys.length !== nextKeys.length;

      if (!hasChanged) {
        for (const key of nextKeys) {
          if (prev[key] !== next[key]) {
            hasChanged = true;
            break;
          }
        }
      }

      return hasChanged ? next : prev;
    });
  }, [depthGroups, setExpandedGroups]);

  const toggleGroupCheckbox = (groupKey: string, groupFiles: CodebaseFile[]) => {
    const isAllChecked = groupFiles.length > 0 && groupFiles.every((f) => selectedFiles[f.id] !== false);
    const targetState = !isAllChecked;

    setSelectedFiles((prev: Record<string, boolean>) => {
      const updated = { ...prev };
      groupFiles.forEach((file) => {
        updated[file.id] = targetState;
      });
      return updated;
    });
  };

  const toggleFileCheckbox = (fileId: string) => {
    setSelectedFiles((prev: Record<string, boolean>) => ({
      ...prev,
      [fileId]: prev[fileId] === false ? true : false,
    }));
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev: Record<string, boolean>) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return {
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
    totalPlanCount,
    selectedUpstreamCount,
    selectedDownstreamCount,
    totalFilesContext,
    combinedSelectedFilesContext,
    targetFilePaths,
    handleFileClick,
    handleFileDoubleClick,
  };
}
EOF

# -----------------------------------------------------------------------------
# 2. Update files-context.tsx: Display selectedCount and totalPlanCount in bottomContent
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
    totalPlanCount,
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
              const isAllChecked = groupFiles.length > 0 && groupFiles.every((f) => selectedFiles[f.id] !== false);
              const isSomeChecked = groupFiles.some((f) => selectedFiles[f.id] !== false);
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
                      {groupFiles.filter((f) => selectedFiles[f.id] !== false).length}/{groupFiles.length}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="space-y-0.5 bg-background/40 p-1">
                      {groupFiles.map((file) => {
                        const fileSizeKb = (((file as any).size || (file as any).content?.length || 0) / 1024).toFixed(1);
                        const isChecked = selectedFiles[file.id] !== false;

                        return (
                          <div
                            key={file.id}
                            className="flex justify-between items-center hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors"
                          >
                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFileCheckbox(file.id)}
                                className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                              />
                              <span
                                className={`truncate text-[11px] cursor-pointer ${
                                  isChecked ? 'font-semibold text-foreground' : 'text-muted-foreground line-through'
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
            <span className="font-bold text-xs text-orange-500">{selectedCount} / {totalPlanCount}</span>
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

echo "✅ feat/fix: In bottomContent of files-context.tsx, selectedCount now strictly represents the number of checked file items within the Adjust Impact Plan block ({selectedCount} / {totalPlanCount})!"
echo "💡 Next step: Run 'npm run build' to re-verify build cleanliness."
