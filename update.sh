#!/usr/bin/env bash
set -e

echo "🚀 Updating Codebase Explorer, Graph, and Files Context panels..."

mkdir -p webview/src/features/explorer/wkp-rgt-tabs-files-context/hooks
mkdir -p webview/src/features/explorer/wkp-lft-codebase-tree/hooks
mkdir -p webview/src/features/explorer/wksp-cnt-graph/hooks
mkdir -p webview/src/features/explorer/layout-ctns

# 1. Update use-files-context.ts with extracted handleFileClick and handleFileDoubleClick
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/hooks/use-files-context.ts
import { useMemo, useEffect, useCallback } from 'react';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';
import { useExplorerStore } from '../../store/useExplorerStore';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface DepthFileGroup {
  key: string;
  label: string;
  order: number;
  files: CodebaseFile[];
}

export function useFilesContext(
  initialCodebase: CodebaseData,
  selectedEntity: SelectedEntity | null,
  enableDownstream: boolean,
  enableUpstream: boolean,
  impactedSet: Set<string>
) {
  const setTargetFilePaths = useExplorerStore((s) => s.setTargetFilePaths);

  const selectedFiles = useExplorerStore((s) => s.selectedContextFiles);
  const setSelectedFiles = useExplorerStore((s) => s.setSelectedContextFiles);
  const expandedGroups = useExplorerStore((s) => s.expandedContextGroups);
  const setExpandedGroups = useExplorerStore((s) => s.setExpandedContextGroups);

  const handleFileClick = useCallback((file: CodebaseFile) => {
    if (file.path) {
      logInfo(`FilesContext file single-clicked: ${file.id} (${file.path}). Revealing in VS Code Explorer and copying path to clipboard...`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.copyToClipboard(file.path);
    }
  }, []);

  const handleFileDoubleClick = useCallback((file: CodebaseFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (file.path) {
      logInfo(`FilesContext file double-clicked: ${file.id} (${file.path}). Opening in VS Code...`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.openFile(file.path);
    }
  }, []);

  const downstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const dsSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, 20, 20, true, false);
    return initialCodebase.files.filter((f) => dsSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase]);

  const upstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const usSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, 20, 20, false, true);
    return initialCodebase.files.filter((f) => usSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase]);

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
    const initialSelected: Record<string, boolean> = {};
    const initialExpanded: Record<string, boolean> = {};

    depthGroups.forEach((group) => {
      initialExpanded[group.key] = true;
      group.files.forEach((file) => {
        initialSelected[file.id] = true;
      });
    });

    setSelectedFiles((prev) => {
      const updated = { ...initialSelected };
      Object.keys(prev).forEach((id) => {
        if (id in updated) {
          updated[id] = prev[id];
        }
      });
      return updated;
    });

    setExpandedGroups((prev) => ({ ...initialExpanded, ...prev }));
  }, [depthGroups, setSelectedFiles, setExpandedGroups]);

  const toggleGroupCheckbox = (groupKey: string, groupFiles: CodebaseFile[]) => {
    const isAllChecked = groupFiles.length > 0 && groupFiles.every((f) => selectedFiles[f.id]);
    const targetState = !isAllChecked;

    setSelectedFiles((prev) => {
      const updated = { ...prev };
      groupFiles.forEach((file) => {
        updated[file.id] = targetState;
      });
      return updated;
    });
  };

  const toggleFileCheckbox = (fileId: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedFiles).filter(Boolean).length;
  }, [selectedFiles]);

  const selectedUpstreamCount = useMemo(() => {
    return depthGroups
      .filter((g) => g.key.startsWith('upstream'))
      .reduce((acc, g) => acc + g.files.filter((f) => selectedFiles[f.id]).length, 0);
  }, [depthGroups, selectedFiles]);

  const selectedDownstreamCount = useMemo(() => {
    return depthGroups
      .filter((g) => g.key.startsWith('downstream'))
      .reduce((acc, g) => acc + g.files.filter((f) => selectedFiles[f.id]).length, 0);
  }, [depthGroups, selectedFiles]);

  const totalFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase]);

  const combinedSelectedFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .filter((file) => !!selectedFiles[file.id])
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase, selectedFiles]);

  const targetFilePaths = useMemo(() => {
    return combinedSelectedFilesContext
      ? combinedSelectedFilesContext.split('\n').map((p) => p.trim()).filter(Boolean)
      : [];
  }, [combinedSelectedFilesContext]);

  useEffect(() => {
    setTargetFilePaths(targetFilePaths);
  }, [targetFilePaths, setTargetFilePaths]);

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

# 2. Update files-context.tsx to consume handlers from useFilesContext
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/files-context.tsx
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
    handleFileClick,
    handleFileDoubleClick,
  } = useFilesContext(
    initialCodebase,
    selectedEntity,
    enableDownstream,
    enableUpstream,
    impactedSet
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
            onClick={() => setEnableUpstream((prev) => !prev)}
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
            onClick={() => setEnableDownstream((prev) => !prev)}
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
      <div className="flex flex-col flex-1 space-y-2 bg-orange-500/5 p-2 border border-orange-500/25 rounded-lg h-full min-h-0">
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-500" />
            <h5 className="font-mono font-bold text-orange-500 text-xs">Adjust Impact Plan</h5>
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
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Selected Files Context
            </h4>
          </div>
        </div>

        <div className="gap-1.5 grid grid-cols-10 text-center">
          <div className="col-span-2 bg-orange-500/10 p-1 border border-orange-500/20 rounded">
            <span className="block text-[9px] text-orange-500 truncate uppercase">Selected</span>
            <span className="font-bold text-orange-500 text-xs">{selectedCount} / {initialCodebase?.files?.length || 0}</span>
          </div>
          <div className="col-span-2 bg-indigo-500/10 p-1 border border-indigo-500/20 rounded">
            <span className="block text-[9px] text-indigo-500 truncate uppercase">Upstream</span>
            <span className="font-bold text-indigo-500 text-xs">{selectedUpstreamCount} / {upstreamCount}</span>
          </div>
          <div className="col-span-2 bg-blue-500/10 p-1 border border-blue-500/20 rounded">
            <span className="block text-[9px] text-blue-500 truncate uppercase">Downstream</span>
            <span className="font-bold text-blue-500 text-xs">{selectedDownstreamCount} / {downstreamCount}</span>
          </div>

          <div className="col-span-4 bg-emerald-500/10 p-1 border border-emerald-500/20 rounded">
            <span className="block text-[9px] text-emerald-500 truncate uppercase">Token Size</span>
            <span className="font-bold text-emerald-500 text-xs">
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
      className="h-full font-mono text-xs animate-in duration-200 fade-in"
    />
  );
}

export const FilesContextTab = FilesContextPanel;
EOF

# 3. Update use-codebase-explorer-panel.ts with robust Zustand state update for collapseAll on ViewMode change
cat << 'EOF' > webview/src/features/explorer/wkp-lft-codebase-tree/hooks/use-codebase-explorer-panel.ts
import { useState, useMemo, useEffect } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '../../constants/graph.constants';
import { useExplorerStore } from '../../store/useExplorerStore';

export type ViewMode = 'scope' | 'folder' | 'tags' | 'layer' | 'typology';

export const ALLOWED_TAGS = [
  'config', 'api', 'database', 'ui', 'core', 'model',
  'Service', 'Controller', 'Repository', 'Component', 'RestController', 'Config',
  'Model / Entity', 'DTO', 'Utility', 'Helper', 'Test', 'Integration', 'UnitTest',
  'FunctionalTest', 'PerformanceTest', 'SecurityTest', 'AcceptanceTest', 'EndToEndTest',
  'Mock', 'Stub', 'Adapter', 'Decorator', 'Factory', 'Builder', 'Singleton',
  'Observer', 'Strategy', 'Command', 'Mediator', 'Proxy', 'Visitor'
];
export const LAYER_GROUPS = ["domain.model", "application", "infrastructure", "domain"];
export const TYPOLOGY_GROUPS = [
  "Front-Component",
  "Component",
  "Service",
  "RestController",
  "Controller",
  "Repository",
  "Config",
  "Model / Entity"
];

export interface FolderTreeNode {
  id: string;
  name: string;
  folderPath: string;
  files: CodebaseFile[];
  children: FolderTreeNode[];
}

export interface SubFolderGroup {
  key: string;
  label: string;
  folderPath: string;
  files: CodebaseFile[];
}

export interface ScopeGroup {
  key: string;
  label: string;
  folderPath: string;
  files: CodebaseFile[];
  rootFiles?: CodebaseFile[];
  subFolders?: SubFolderGroup[];
  folderTree?: FolderTreeNode[];
}

export interface FolderKeyWithDepth {
  key: string;
  level: number;
}

export function getCommonFolderPath(files: CodebaseFile[]): string {
  if (!files || files.length === 0) return '';

  const fileDirPaths = files
    .map((f) => {
      const p = f.path || '';
      const lastSlash = p.lastIndexOf('/');
      return lastSlash >= 0 ? p.substring(0, lastSlash) : '';
    })
    .filter(Boolean);

  if (fileDirPaths.length === 0) return '';

  const splitDirs = fileDirPaths.map((d) => d.split('/'));
  let commonParts: string[] = [...splitDirs[0]];

  for (let i = 1; i < splitDirs.length; i++) {
    const current = splitDirs[i];
    let j = 0;
    while (j < commonParts.length && j < current.length && commonParts[j] === current[j]) {
      j++;
    }
    commonParts = commonParts.slice(0, j);
    if (commonParts.length === 0) break;
  }

  return commonParts.join('/');
}

export function resolvePhysicalFolderPath(file: CodebaseFile, partName: string, fallbackScope: string): string {
  if (!file || !file.path) return fallbackScope;

  const lastSlash = file.path.lastIndexOf('/');
  const fileDir = lastSlash >= 0 ? file.path.substring(0, lastSlash) : file.path;

  if (!partName || partName === fallbackScope) {
    return fileDir.startsWith(fallbackScope) ? fallbackScope : fileDir;
  }

  const slashPart = partName.replace(/\./g, '/');

  const idx = fileDir.indexOf(slashPart);
  if (idx !== -1) {
    return fileDir.substring(0, idx + slashPart.length);
  }

  const lastSegmentIdx = fileDir.lastIndexOf('/' + partName);
  if (lastSegmentIdx !== -1) {
    return fileDir.substring(0, lastSegmentIdx + partName.length + 1);
  }

  return fileDir;
}

export function getFileFolderKey(file: CodebaseFile): string {
  const tags = file.tags as any;
  if (Array.isArray(tags)) {
    if (tags.some((t: any) => String(t).toLowerCase() === 'frontend')) return 'frontend';
    if (tags.some((t: any) => String(t).toLowerCase() === 'backend')) return 'backend';
    if (tags.some((t: any) => String(t).toLowerCase() === 'config')) return 'config';
  } else if (typeof tags === 'string') {
    const lower = tags.toLowerCase();
    if (lower.includes('frontend')) return 'frontend';
    if (lower.includes('backend')) return 'backend';
    if (lower.includes('config')) return 'config';
  }
  if (file.path?.toLowerCase().startsWith('frontend')) return 'frontend';
  if (file.path?.toLowerCase().startsWith('backend')) return 'backend';
  if (file.path?.toLowerCase().startsWith('config')) return 'config';
  return 'other';
}

export function cleanRelativeFilePath(file: CodebaseFile): string {
  const filePath = file.path || '';
  if (!filePath) return '';

  let relative = filePath;

  const srcMarkers = [
    '/src/main/java/', 'src/main/java/',
    '/src/test/java/', 'src/test/java/',
    '/src/main/kotlin/', 'src/main/kotlin/',
    '/src/test/kotlin/', 'src/test/kotlin/',
    '/src/main/resources/', 'src/main/resources/',
    '/src/test/resources/', 'src/test/resources/',
    '/src/', 'src/'
  ];

  let found = false;
  for (const marker of srcMarkers) {
    const idx = relative.indexOf(marker);
    if (idx !== -1) {
      relative = relative.substring(idx + marker.length);
      found = true;
      break;
    }
  }

  if (!found) {
    const pkgMarkers = ['/com/', 'com/', '/org/', 'org/', '/net/', 'net/', '/io/', 'io/', '/fr/', 'fr/', '/de/', 'de/'];
    for (const marker of pkgMarkers) {
      const idx = relative.indexOf(marker);
      if (idx !== -1) {
        const cleanMarker = marker.startsWith('/') ? marker.substring(1) : marker;
        relative = cleanMarker + relative.substring(idx + marker.length);
        found = true;
        break;
      }
    }
  }

  if (!found) {
    const scopeMarkers = ['/frontend/', 'frontend/', '/backend/', 'backend/', '/config/', 'config/'];
    for (const marker of scopeMarkers) {
      const idx = relative.indexOf(marker);
      if (idx !== -1) {
        relative = relative.substring(idx + marker.length);
        found = true;
        break;
      }
    }
  }

  relative = relative.replace(/^\/+|\/+$/g, '').trim();
  return relative;
}

export function getFileTypology(f: CodebaseFile): string {
  const name = f.name.toLowerCase();
  const path = f.path.toLowerCase();
  const type = (f.type || '').toLowerCase();
  const tags = typeof f.tags === 'string'
    ? [(f.tags as string).toLowerCase()]
    : [];

  if (type === 'config' || path.includes('config') || tags.includes('config') || name.endsWith('.yml') || name.endsWith('.yaml') || name.endsWith('.json') || name.endsWith('.properties')) {
    return 'Config';
  }
  if (name.includes('restcontroller') || tags.includes('restcontroller')) {
    return 'RestController';
  }
  if (name.includes('controller') || path.includes('controller') || tags.includes('controller')) {
    return 'Controller';
  }
  if (name.includes('repository') || path.includes('repository') || name.includes('repo') || tags.includes('repository')) {
    return 'Repository';
  }
  if (name.includes('service') || name.includes('api') || path.includes('service') || tags.includes('service')) {
    return 'Service';
  }
  const isFront = path.startsWith('frontend') || tags.includes('frontend') || name.endsWith('.tsx') || name.endsWith('.jsx') || name.endsWith('.vue');
  if (isFront && (type === 'component' || path.includes('component') || tags.includes('component'))) {
    return 'Front-Component';
  }
  if (type === 'component' || tags.includes('component')) {
    return 'Component';
  }
  if ((type === 'class' || type === 'model' || type === 'entity') && (path.includes('model') || path.includes('domain') || path.includes('entity') || tags.includes('model') || tags.includes('entity'))) {
    return 'Model / Entity';
  }

  const matchedGroup = TYPOLOGY_GROUPS.find((group) => {
    const gLower = group.toLowerCase();
    return name.includes(gLower) || path.includes(gLower) || type === gLower || tags.includes(gLower);
  });

  return matchedGroup || 'Other';
}

function compactFolderTree(nodes: FolderTreeNode[]): FolderTreeNode[] {
  return nodes.map((node) => {
    let compactedChildren = compactFolderTree(node.children);
    let currentNode: FolderTreeNode = {
      ...node,
      children: compactedChildren,
    };

    while (currentNode.files.length === 0 && currentNode.children.length === 1) {
      const singleChild = currentNode.children[0];
      currentNode = {
        id: singleChild.id,
        name: `${currentNode.name}.${singleChild.name}`,
        folderPath: singleChild.folderPath || currentNode.folderPath,
        files: singleChild.files,
        children: singleChild.children,
      };
    }

    return currentNode;
  });
}

function buildFolderTreeForScope(scopeKey: string, scopeFiles: CodebaseFile[]): { rootFiles: CodebaseFile[]; folderTree: FolderTreeNode[] } {
  interface TempNode {
    id: string;
    name: string;
    folderPath: string;
    files: CodebaseFile[];
    childrenMap: Map<string, TempNode>;
  }

  const rootChildrenMap = new Map<string, TempNode>();
  const rootFiles: CodebaseFile[] = [];

  scopeFiles.forEach((file) => {
    const relPath = cleanRelativeFilePath(file);
    const lastSlash = relPath.lastIndexOf('/');
    const dirPath = lastSlash >= 0 ? relPath.substring(0, lastSlash) : '';
    const parts = dirPath ? dirPath.split('/').filter(Boolean) : [];

    if (parts.length === 0) {
      rootFiles.push(file);
    } else {
      let currentMap = rootChildrenMap;
      let currentPath = scopeKey;

      parts.forEach((part, idx) => {
        currentPath += `/${part}`;
        if (!currentMap.has(part)) {
          const physicalPath = resolvePhysicalFolderPath(file, part, scopeKey);
          currentMap.set(part, {
            id: currentPath,
            name: part,
            folderPath: physicalPath,
            files: [],
            childrenMap: new Map(),
          });
        }
        const node = currentMap.get(part)!;
        if (idx === parts.length - 1) {
          node.files.push(file);
        } else {
          currentMap = node.childrenMap;
        }
      });
    }
  });

  function convertMapToArray(map: Map<string, TempNode>): FolderTreeNode[] {
    const result: FolderTreeNode[] = [];
    map.forEach((node) => {
      result.push({
        id: node.id,
        name: node.name,
        folderPath: node.folderPath,
        files: node.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
        children: convertMapToArray(node.childrenMap),
      });
    });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  const uncompressedTree = convertMapToArray(rootChildrenMap);
  const compactedTree = compactFolderTree(uncompressedTree);

  return {
    rootFiles: rootFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
    folderTree: compactedTree,
  };
}

export function collectFolderKeysWithDepth(scopes: ScopeGroup[]): FolderKeyWithDepth[] {
  const result: FolderKeyWithDepth[] = [];

  function traverseTree(nodes: FolderTreeNode[], currentLevel: number) {
    nodes.forEach((node) => {
      result.push({ key: node.id, level: currentLevel });
      if (node.children && node.children.length > 0) {
        traverseTree(node.children, currentLevel + 1);
      }
    });
  }

  scopes.forEach((scope) => {
    result.push({ key: scope.key, level: 1 });
    if (scope.folderTree) {
      traverseTree(scope.folderTree, 2);
    }
    if (scope.subFolders) {
      scope.subFolders.forEach((sub) => {
        result.push({ key: sub.key, level: 2 });
      });
    }
  });

  return result;
}

export function calculateCollapseState(scopes: ScopeGroup[], mode: ViewMode): Record<string, boolean> {
  const keysWithDepth = collectFolderKeysWithDepth(scopes);
  let targetCollapseLevel = 2;

  if (mode === 'folder') {
    targetCollapseLevel = 3;
  } else if (mode === 'scope') {
    targetCollapseLevel = 1;
  }

  const newExpanded: Record<string, boolean> = {};
  keysWithDepth.forEach(({ key, level }) => {
    newExpanded[key] = level < targetCollapseLevel;
  });

  return newExpanded;
}

export function useCodebaseExplorerPanel(
  codebase: CodebaseData,
  expandedFolders?: Record<string, boolean>,
  toggleFolder?: (folder: string) => void
) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('scope');

  const handleExportCodebase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codebase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "codebase-ast.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const { groupedScopes, duplicateFileIds } = useMemo(() => {
    const duplicates = new Set<string>();
    const scopesList: ScopeGroup[] = [];
    const scopeKeys = [...FOLDER_KEYS_REGISTERED_CONFIG];

    scopeKeys.forEach((scopeKey) => {
      const scopeFiles = codebase.files.filter((f) => getFileFolderKey(f) === scopeKey);
      if (scopeFiles.length === 0) return;

      const scopeFolderPath = getCommonFolderPath(scopeFiles) || scopeKey;

      if (viewMode === 'scope') {
        scopesList.push({
          key: scopeKey,
          label: scopeKey,
          folderPath: scopeFolderPath,
          files: scopeFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
        });
      } else if (viewMode === 'folder') {
        const { rootFiles, folderTree } = buildFolderTreeForScope(scopeKey, scopeFiles);
        scopesList.push({
          key: scopeKey,
          label: scopeKey,
          folderPath: scopeFolderPath,
          files: scopeFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
          rootFiles,
          folderTree,
        });
      } else {
        const subMap = new Map<string, CodebaseFile[]>();

        if (viewMode === 'tags') {
          const dynamicTagsMap = new Map<string, string>();
          ALLOWED_TAGS.forEach((t) => dynamicTagsMap.set(t.toLowerCase(), t));

          codebase.files.forEach((f) => {
            const tags = f.tags as any;
            if (Array.isArray(tags)) {
              tags.forEach((t) => {
                if (typeof t === 'string' && t.trim()) {
                  const raw = t.trim();
                  if (!dynamicTagsMap.has(raw.toLowerCase())) {
                    dynamicTagsMap.set(raw.toLowerCase(), raw);
                  }
                }
              });
            } else if (typeof tags === 'string' && tags.trim()) {
              const raw = tags.trim();
              if (!dynamicTagsMap.has(raw.toLowerCase())) {
                dynamicTagsMap.set(raw.toLowerCase(), raw);
              }
            }
          });

          dynamicTagsMap.forEach((displayTag) => subMap.set(displayTag, []));
          subMap.set('untagged', []);

          const fileTagCounts = new Map<string, number>();

          scopeFiles.forEach((f) => {
            const tags = f.tags as any;
            const fileTagsList: string[] = Array.isArray(tags)
              ? tags.map((t) => String(t).trim())
              : typeof tags === 'string' && tags.trim()
              ? [tags.trim()]
              : [];

            let matchedCount = 0;
            const matchedDisplayTags = new Set<string>();

            fileTagsList.forEach((rawTag) => {
              const lower = rawTag.toLowerCase();
              if (dynamicTagsMap.has(lower)) {
                const displayTag = dynamicTagsMap.get(lower)!;
                if (!matchedDisplayTags.has(displayTag)) {
                  matchedDisplayTags.add(displayTag);
                  subMap.get(displayTag)!.push(f);
                  matchedCount++;
                }
              }
            });

            if (matchedCount > 0) {
              fileTagCounts.set(f.id, (fileTagCounts.get(f.id) || 0) + matchedCount);
            } else {
              subMap.get('untagged')!.push(f);
            }
          });

          fileTagCounts.forEach((count, id) => {
            if (count > 1) duplicates.add(id);
          });
        } else if (viewMode === 'layer') {
          LAYER_GROUPS.forEach((p) => subMap.set(p, []));
          subMap.set('other', []);
          scopeFiles.forEach((f) => {
            const pathLower = f.path.toLowerCase();
            const nameLower = f.name.toLowerCase();
            const matchedPkg = LAYER_GROUPS.find((p) => {
              const pLower = p.toLowerCase();
              return pathLower.includes(pLower) || nameLower.includes(pLower);
            });
            if (matchedPkg) {
              subMap.get(matchedPkg)!.push(f);
            } else {
              subMap.get('other')!.push(f);
            }
          });
        } else if (viewMode === 'typology') {
          TYPOLOGY_GROUPS.forEach((t) => subMap.set(t, []));
          subMap.set('Other', []);
          scopeFiles.forEach((f) => {
            const typo = getFileTypology(f);
            if (!subMap.has(typo)) subMap.set(typo, []);
            subMap.get(typo)!.push(f);
          });
        }

        const subFolders: SubFolderGroup[] = [];
        subMap.forEach((files, subKey) => {
          if (files.length > 0) {
            const subFolderPath = getCommonFolderPath(files) || scopeKey;
            subFolders.push({
              key: `${scopeKey}__${subKey}`,
              label: subKey,
              folderPath: subFolderPath,
              files: files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
            });
          }
        });

        subFolders.sort((a, b) => a.label.localeCompare(b.label));

        scopesList.push({
          key: scopeKey,
          label: scopeKey,
          folderPath: scopeFolderPath,
          files: scopeFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
          subFolders,
        });
      }
    });

    return { groupedScopes: scopesList, duplicateFileIds: duplicates };
  }, [codebase.files, viewMode]);

  const handleExpandAll = () => {
    const keysWithDepth = collectFolderKeysWithDepth(groupedScopes);
    const newExpanded: Record<string, boolean> = {};
    keysWithDepth.forEach(({ key }) => {
      newExpanded[key] = true;
    });
    useExplorerStore.setState((s) => ({
      expandedFolders: {
        ...s.expandedFolders,
        ...newExpanded,
      },
    }));
  };

  const handleCollapseAll = (overrideMode?: ViewMode) => {
    const mode = overrideMode || viewMode;
    const newExpanded = calculateCollapseState(groupedScopes, mode);
    useExplorerStore.setState((s) => ({
      expandedFolders: {
        ...s.expandedFolders,
        ...newExpanded,
      },
    }));
  };

  // Directly collapse folders whenever ViewMode or groupedScopes change
  useEffect(() => {
    handleCollapseAll(viewMode);
  }, [viewMode, groupedScopes]);

  return {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    viewMode,
    setViewMode,
    groupedScopes,
    duplicateFileIds,
    handleExpandAll,
    handleCollapseAll,
  };
}
EOF

# 4. Update CodebaseExplorerPanel.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx
import React, { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database, Download, Upload, LayoutList, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportAstDialog } from './import-ast-dialog';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import {
  CodebaseFile,
  CodebaseData,
  SelectedEntity
} from '@/shared/services/graph-rag-explorer';
import { FOLDER_THEME_REGISTRY_CONFIG } from '../constants/graph.constants';
import {
  useCodebaseExplorerPanel,
  ViewMode,
  ScopeGroup,
  SubFolderGroup,
  FolderTreeNode,
  getCommonFolderPath
} from './hooks/use-codebase-explorer-panel';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { CODEBASE_GROUPING_LIST, CODEBASE_GROUPING_ICON_MAP } from './type-codebase-grouping';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

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

const DYNAMIC_COLORS = [
  { fill: 'fill-blue-500/20', text: 'text-blue-500', iconColor: 'text-blue-500' },
  { fill: 'fill-emerald-500/20', text: 'text-emerald-500', iconColor: 'text-emerald-500' },
  { fill: 'fill-amber-500/20', text: 'text-amber-500', iconColor: 'text-amber-500' },
  { fill: 'fill-purple-500/20', text: 'text-purple-500', iconColor: 'text-purple-500' },
  { fill: 'fill-pink-500/20', text: 'text-pink-500', iconColor: 'text-pink-500' },
  { fill: 'fill-indigo-500/20', text: 'text-indigo-500', iconColor: 'text-indigo-500' },
  { fill: 'fill-rose-500/20', text: 'text-rose-500', iconColor: 'text-rose-500' },
  { fill: 'fill-cyan-500/20', text: 'text-cyan-500', iconColor: 'text-cyan-500' },
];

function getAllFilesFromNode(node: FolderTreeNode): CodebaseFile[] {
  let files = [...node.files];
  node.children.forEach((child) => {
    files = files.concat(getAllFilesFromNode(child));
  });
  return files;
}

interface RecursiveFolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  onFocusNode?: (nodeId: string) => void;
  theme: any;
  toggleFileListCheckbox: (files: CodebaseFile[]) => void;
  handleFileDoubleClick: (file: CodebaseFile, e?: React.MouseEvent) => void;
  handleFolderDoubleClick: (folderPath: string, files?: CodebaseFile[], e?: React.MouseEvent) => void;
  handleFileClick: (file: CodebaseFile) => void;
  handleFolderClick: (folderKey: string, folderPath?: string) => void;
}

function RecursiveFolderNode({
  node,
  depth,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFileCheckbox,
  setSelectedEntity,
  onFocusNode,
  theme,
  toggleFileListCheckbox,
  handleFileDoubleClick,
  handleFolderDoubleClick,
  handleFileClick,
  handleFolderClick,
}: RecursiveFolderNodeProps) {
  const isExpanded = expandedFolders[node.id] ?? true;
  const allNodeFiles = getAllFilesFromNode(node);

  const isAllChecked = allNodeFiles.length > 0 && allNodeFiles.every((f) => visibleFiles[f.id]);
  const isSomeChecked = allNodeFiles.some((f) => visibleFiles[f.id]);
  const isIndeterminate = isSomeChecked && !isAllChecked;

  return (
    <div key={node.id} className="mb-1">
      <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
        <TriStateCheckbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onChange={() => toggleFileListCheckbox(allNodeFiles)}
          className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
        />
        <div
          className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
          onClick={() => handleFolderClick(node.id, node.folderPath)}
          onDoubleClick={(e) => handleFolderDoubleClick(node.folderPath, allNodeFiles, e)}
        >
          {isExpanded ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )}
          <Folder size={14} className={`${theme.fill} ${theme.text} shrink-0`} />
          <span className="font-semibold text-foreground/90 truncate" title={node.name}>
            {node.name}/
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
          {node.files.map((file) => (
            <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
              <input
                type="checkbox"
                checked={!!visibleFiles[file.id]}
                onChange={() => toggleFileCheckbox(file.id)}
                className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
              />
              <span
                className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${
                  visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                }`}
                onClick={() => handleFileClick(file)}
                onDoubleClick={(e) => handleFileDoubleClick(file, e)}
              >
                {file.type === 'config' ? (
                  <Database size={13} className="text-amber-500 shrink-0" />
                ) : (
                  <FileCode
                    size={13}
                    className={
                      file.type === 'interface'
                        ? 'text-indigo-400 shrink-0'
                        : theme.iconColor || 'text-slate-400'
                    }
                  />
                )}
                <span className="truncate">{file.name}</span>
              </span>
            </div>
          ))}

          {node.children.map((childNode, childIdx) => (
            <RecursiveFolderNode
              key={childNode.id}
              node={childNode}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              visibleFiles={visibleFiles}
              toggleFolder={toggleFolder}
              toggleFileCheckbox={toggleFileCheckbox}
              setSelectedEntity={setSelectedEntity}
              onFocusNode={onFocusNode}
              theme={DYNAMIC_COLORS[(depth + childIdx) % DYNAMIC_COLORS.length]}
              toggleFileListCheckbox={toggleFileListCheckbox}
              handleFileDoubleClick={handleFileDoubleClick}
              handleFolderDoubleClick={handleFolderDoubleClick}
              handleFileClick={handleFileClick}
              handleFolderClick={handleFolderClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CodebaseExplorerPanelProps {
  codebase: CodebaseData;
  searchFilteredFiles: CodebaseFile[];
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFolderCheckbox: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  onFocusNode?: (nodeId: string) => void;
  onImportCodebase?: (importedData: CodebaseData) => void;
}

export function CodebaseExplorerPanel({
  codebase,
  searchFilteredFiles,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFolderCheckbox,
  toggleFileCheckbox,
  setSelectedEntity,
  onFocusNode,
  onImportCodebase
}: CodebaseExplorerPanelProps) {
  const {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    viewMode,
    setViewMode,
    groupedScopes,
    duplicateFileIds,
    handleExpandAll,
    handleCollapseAll,
  } = useCodebaseExplorerPanel(codebase, expandedFolders, toggleFolder);

  const handleToggleFolder = (folderKey: string, folderPath?: string) => {
    if (expandedFolders[folderKey] === undefined) {
      toggleFolder(folderKey);
      toggleFolder(folderKey);
    } else {
      toggleFolder(folderKey);
    }
    if (folderPath) {
      logInfo(`Folder single-clicked: ${folderPath}. Revealing in VS Code Explorer and copying to clipboard...`);
      vsCodeApiService.revealInExplorer(folderPath);
      vsCodeApiService.copyToClipboard(folderPath);
    }
  };

  const handleFileClick = (file: CodebaseFile) => {
    if (file.path) {
      logInfo(`File single-clicked: ${file.path}. Revealing in VS Code Explorer and copying to clipboard...`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.copyToClipboard(file.path);
    }
    if (onFocusNode) {
      onFocusNode(file.id);
    } else {
      setSelectedEntity({ type: 'node', nodeId: file.id });
    }
  };

  const handleFileDoubleClick = (file: CodebaseFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (file?.path) {
      logInfo(`Double-clicked file item: ${file.id}. Opening in VS Code: ${file.path}`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.openFile(file.path);
    }
  };

  const handleFolderDoubleClick = (folderPath: string, files?: CodebaseFile[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetPath = folderPath || getCommonFolderPath(files || []);
    if (targetPath) {
      logInfo(`Double-clicked folder item. Revealing directory in VS Code Explorer: ${targetPath}`);
      vsCodeApiService.revealInExplorer(targetPath);
    }
  };

  const toggleFileListCheckbox = (files: CodebaseFile[]) => {
    const isAllChecked = files.length > 0 && files.every((f) => visibleFiles[f.id]);
    const targetState = !isAllChecked;
    files.forEach((f) => {
      if (!!visibleFiles[f.id] !== targetState) {
        toggleFileCheckbox(f.id);
      }
    });
  };

  return (
    <div id="panel-codebase-explorer" className="flex flex-col bg-card h-full">
      <div className="flex justify-between items-center bg-muted/20 p-0.5 border-border border-b">
        <div className="flex items-center gap-1.5 pl-2 w-full">
          <LayoutList size={14} className="text-muted-foreground shrink-0" />
          <SelectFromTypeBuilder
            id="select-display-level"
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            className="py-0"
            triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
            options={CODEBASE_GROUPING_LIST.map((key) => ({
              value: key,
              icon: CODEBASE_GROUPING_ICON_MAP[key].icon,
              label: CODEBASE_GROUPING_ICON_MAP[key].label,
            }))}
          />
        </div>

        <div className="flex items-center gap-0.5 pr-1 shrink-0">
          <Button
            id="btn-collapse-all"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseAll()}
            data-tooltip="Collapse All"
          >
            <ChevronsUp size={12} />
          </Button>
          <Button
            id="btn-expand-all"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={() => handleExpandAll()}
            data-tooltip="Expand All"
          >
            <ChevronsDown size={12} />
          </Button>

          <ToolbarSeparator />
          <Button
            id="btn-open-import-ast-dialog"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={() => setIsImportOpen(true)}
            data-tooltip="Open AST Codebase import dialog"
          >
            <Upload size={12} />
          </Button>

          <Button
            id="btn-export-ast-json"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleExportCodebase}
            data-tooltip="Export current session structure as AST Codebase to JSON file"
          >
            <Download size={12} />
          </Button>
        </div>
      </div>

      <ImportAstDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(data) => {
          if (onImportCodebase) onImportCodebase(data);
        }}
      />

      <div id="tree-codebase-files" className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        {groupedScopes.map((scope: ScopeGroup) => {
          const scopeTheme = FOLDER_THEME_REGISTRY_CONFIG[scope.key] || FOLDER_THEME_REGISTRY_CONFIG.default;
          const isScopeExpanded = expandedFolders[scope.key] ?? true;

          const allScopeFiles = scope.files;
          const isScopeAllChecked = allScopeFiles.length > 0 && allScopeFiles.every((f) => visibleFiles[f.id]);
          const isScopeSomeChecked = allScopeFiles.some((f) => visibleFiles[f.id]);
          const isScopeIndeterminate = isScopeSomeChecked && !isScopeAllChecked;

          return (
            <div key={scope.key} className="mb-4">
              <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                <TriStateCheckbox
                  checked={isScopeAllChecked}
                  indeterminate={isScopeIndeterminate}
                  onChange={() => toggleFileListCheckbox(allScopeFiles)}
                  className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                />
                <div
                  className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
                  onClick={() => handleToggleFolder(scope.key, scope.folderPath)}
                  onDoubleClick={(e) => handleFolderDoubleClick(scope.folderPath, allScopeFiles, e)}
                >
                  {isScopeExpanded ? (
                    <ChevronDown size={14} className="shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="shrink-0" />
                  )}
                  <Folder size={15} className={`${scopeTheme.fill} ${scopeTheme.text} shrink-0`} />
                  <span className="font-bold truncate" title={scope.label}>
                    {scope.label}/
                  </span>
                </div>
              </div>

              {isScopeExpanded && (
                <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
                  {/* ViewMode: Scope -> direct files list */}
                  {viewMode === 'scope' &&
                    scope.files.map((file) => (
                      <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={!!visibleFiles[file.id]}
                          onChange={() => toggleFileCheckbox(file.id)}
                          className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                        />
                        <span
                          className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${
                            visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                          }`}
                          onClick={() => handleFileClick(file)}
                          onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                        >
                          {scope.key === 'config' ? (
                            <Database size={13} className="text-amber-500 shrink-0" />
                          ) : (
                            <FileCode
                              size={13}
                              className={
                                file.type === 'interface'
                                  ? 'text-indigo-400 shrink-0'
                                  : scope.key === 'frontend'
                                  ? 'text-emerald-500 shrink-0'
                                  : scope.key === 'backend'
                                  ? 'text-blue-500 shrink-0'
                                  : 'text-slate-400 shrink-0'
                              }
                            />
                          )}
                          <span className="truncate">{file.name}</span>
                        </span>
                      </div>
                    ))}

                  {/* ViewMode: Folder -> Recursive VS Code-style tree */}
                  {viewMode === 'folder' && scope.folderTree && (
                    <>
                      {scope.rootFiles &&
                        scope.rootFiles.map((file) => (
                          <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={!!visibleFiles[file.id]}
                              onChange={() => toggleFileCheckbox(file.id)}
                              className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                            />
                            <span
                              className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${
                                visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                              }`}
                              onClick={() => handleFileClick(file)}
                              onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                            >
                              <FileCode size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </span>
                          </div>
                        ))}

                      {scope.folderTree.map((rootNode, rootIdx) => (
                        <RecursiveFolderNode
                          key={rootNode.id}
                          node={rootNode}
                          depth={1}
                          expandedFolders={expandedFolders}
                          visibleFiles={visibleFiles}
                          toggleFolder={handleToggleFolder}
                          toggleFileCheckbox={toggleFileCheckbox}
                          setSelectedEntity={setSelectedEntity}
                          onFocusNode={onFocusNode}
                          theme={DYNAMIC_COLORS[rootIdx % DYNAMIC_COLORS.length]}
                          toggleFileListCheckbox={toggleFileListCheckbox}
                          handleFileDoubleClick={handleFileDoubleClick}
                          handleFolderDoubleClick={handleFolderDoubleClick}
                          handleFileClick={handleFileClick}
                          handleFolderClick={handleToggleFolder}
                        />
                      ))}
                    </>
                  )}

                  {/* ViewMode: Tags / Package / Typology -> flat subfolders */}
                  {viewMode !== 'scope' &&
                    viewMode !== 'folder' &&
                    scope.subFolders &&
                    scope.subFolders.map((sub: SubFolderGroup, subIdx: number) => {
                      const isSubExpanded = expandedFolders[sub.key] ?? true;
                      const subTheme = DYNAMIC_COLORS[subIdx % DYNAMIC_COLORS.length];

                      const isSubAllChecked = sub.files.length > 0 && sub.files.every((f) => visibleFiles[f.id]);
                      const isSubSomeChecked = sub.files.some((f) => visibleFiles[f.id]);
                      const isSubIndeterminate = isSubSomeChecked && !isSubAllChecked;

                      return (
                        <div key={sub.key} className="mb-2">
                          <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                            <TriStateCheckbox
                              checked={isSubAllChecked}
                              indeterminate={isSubIndeterminate}
                              onChange={() => toggleFileListCheckbox(sub.files)}
                              className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                            />
                            <div
                              className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
                              onClick={() => handleToggleFolder(sub.key, sub.folderPath)}
                              onDoubleClick={(e) => handleFolderDoubleClick(sub.folderPath, sub.files, e)}
                            >
                              {isSubExpanded ? (
                                <ChevronDown size={14} className="shrink-0" />
                              ) : (
                                <ChevronRight size={14} className="shrink-0" />
                              )}
                              <Folder size={14} className={`${subTheme.fill} ${subTheme.text} shrink-0`} />
                              <span className="font-semibold text-foreground/90 truncate" title={sub.label}>
                                {sub.label}/
                              </span>
                            </div>
                          </div>

                          {isSubExpanded && (
                            <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
                              {sub.files.map((file) => {
                                const isDuplicate = viewMode === 'tags' && duplicateFileIds.has(file.id);
                                const textStyle = isDuplicate
                                  ? 'text-orange-500 font-bold'
                                  : visibleFiles[file.id]
                                  ? 'text-foreground font-medium'
                                  : 'text-muted-foreground line-through';

                                return (
                                  <div
                                    key={file.id}
                                    className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!visibleFiles[file.id]}
                                      onChange={() => toggleFileCheckbox(file.id)}
                                      className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                                    />
                                    <span
                                      className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${textStyle}`}
                                      onClick={() => handleFileClick(file)}
                                      onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                                    >
                                      {file.type === 'config' ? (
                                        <Database size={13} className="text-amber-500 shrink-0" />
                                      ) : (
                                        <FileCode
                                          size={13}
                                          className={
                                            file.type === 'interface'
                                              ? 'text-indigo-400 shrink-0'
                                              : subTheme.iconColor || 'text-slate-400'
                                          }
                                        />
                                      )}
                                      <span className="truncate">{file.name}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div id="panel-codebase-explorer-bottom" className="bg-muted/20 p-2 border-border border-t h-9 shrink-0">
        <div>
          <h3 className="flex items-center gap-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
            <span>Explorer</span>
            <span id="badge-file-count" className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">
              {searchFilteredFiles.length}/{codebase.files.length}
            </span>
          </h3>
        </div>
      </div>
    </div>
  );
}
EOF

# 5. Restore GraphPanel.tsx to exact original UML structure with single click (reveal + copy) & double click (reveal + open)
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanel.tsx
import React from 'react';
import { Info } from 'lucide-react';
import { FolderNode, UmlClassNode, ConfigNode, UmlClassNodeData } from './components/GraphUmlShapes';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/view/graph-view.service';
import { useGraphPanel } from './hooks/use-graph-panel';
import { GraphToolbar } from './Graph-toolbar';

interface GraphPanelProps {
  folderPositions: Record<string, { label: string }>;
  containerRef: (node: HTMLDivElement | null) => void;
  showGrid: boolean;
  isDarkMode: boolean;
  graphState: {
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  selectedEntity: SelectedEntity | null;
  focusedNodeId?: string | null;
  searchFilteredFiles: CodebaseFile[];
  impactedSet: Set<string>;
  handleSelectMember: (nodeId: string, memberId: string) => void;
  attributesVisible: boolean;
  methodsVisible: boolean;
  showSelectedOnly?: boolean;
}

export function GraphPanel({
  folderPositions,
  containerRef,
  showGrid,
  isDarkMode,
  graphState,
  selectedEntity,
  focusedNodeId,
  searchFilteredFiles,
  impactedSet,
  handleSelectMember,
  attributesVisible,
  methodsVisible,
  showSelectedOnly = false
}: GraphPanelProps) {
  const {
    effectiveFolderPositions,
    effectiveSearchFilteredFiles,
  } = useGraphPanel(
    folderPositions,
    graphState.nodePositions,
    showSelectedOnly,
    selectedEntity,
    searchFilteredFiles,
    impactedSet
  );

  return (
    <div className="relative inset-0 outline-none w-full h-full overflow-hidden">
      <GraphToolbar />

      <div
        ref={containerRef}
        className="z-0 absolute inset-0 w-full h-full"
        style={showGrid ? {
          backgroundImage: isDarkMode
            ? 'radial-gradient(#334155 1.2px, transparent 1.2px)'
            : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
          backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`
        } : undefined}
      />

      <div
        className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none"
        style={{ transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})` }}
      >
        {Object.entries(effectiveFolderPositions).map(([folderKey, initialPos]) => {
          const bounds = graphState.nodePositions[`folder__${folderKey}`];
          if (!bounds) return null;
          const isSelected = selectedEntity?.nodeId === `folder__${folderKey}`;
          return (
            <div
              key={`folder-box-${folderKey}`}
              className="z-10 absolute transition-all duration-75 ease-out"
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              <FolderNode data={{ label: initialPos.label }} isSelected={isSelected} />
            </div>
          );
        })}

        {effectiveSearchFilteredFiles.map((file: CodebaseFile) => {
          const bounds = graphState.nodePositions[file.id];
          if (!bounds) return null;

          const impactedMembers: string[] = [];
          impactedSet.forEach(item => {
            if (isMemberKeyForFileToken(item, file.id)) {
              impactedMembers.push(extractMemberIdFromKeyToken(item));
            }
          });

          const isOrigin = selectedEntity?.nodeId === file.id;
          const isDependency = impactedSet.has(file.id) && !isOrigin;
          const isFocused = focusedNodeId === file.id;

          const nodeData: UmlClassNodeData = {
            ...file,
            isOrigin,
            isDependency,
            isFocused,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember,
            attributesVisible,
            methodsVisible
          };

          return (
            <div
              key={file.id}
              className={`absolute transition-all duration-75 ease-out pointer-events-none ${isFocused ? 'z-30' : 'z-20'}`}
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              {file.type === 'config' ? (
                <ConfigNode id={file.id} data={nodeData} />
              ) : (
                <UmlClassNode id={file.id} data={nodeData} />
              )}
            </div>
          );
        })}
      </div>

      <div
        id="cytoscape-engine-info"
        className="top-10 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto"
      >
        <div className="flex justify-between items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="font-bold">Surgical Analysis (Cytoscape Engine)</span>
          </div>
          <button
            onClick={() => {
              const infoDiv = document.getElementById('cytoscape-engine-info');
              if (infoDiv) infoDiv.style.display = 'none';
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Drag-and-drop on headers and wheel zoom use Cytoscape's responsive architecture.
        </p>
      </div>
    </div>
  );
}
EOF

# 6. Update CenterPanelContainer.tsx (single click -> revealInExplorer + copyToClipboard, double click -> revealInExplorer + openFile)
cat << 'EOF' > webview/src/features/explorer/layout-ctns/CenterPanelContainer.tsx
import React, { useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { GraphPanel } from '../wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from '../wksp-cnt-graph/GraphPanelHeader';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useGraph } from '../wksp-cnt-graph/hooks/use-graph';
import { useExplorerStore } from '../store/useExplorerStore';

export function CenterPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const folderPositions = useExplorerStore((s) => s.folderPositions);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const focusedNodeId = useExplorerStore((s) => s.focusedNodeId);

  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);

  const showGrid = useExplorerStore((s) => s.showGrid);
  const setShowGrid = useExplorerStore((s) => s.setShowGrid);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const setCallersDepth = useExplorerStore((s) => s.setCallersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setCalleesDepth = useExplorerStore((s) => s.setCalleesDepth);
  const currentLayout = useExplorerStore((s) => s.currentLayout);
  const setCurrentLayout = useExplorerStore((s) => s.setCurrentLayout);

  const attributesVisible = useExplorerStore((s) => s.attributesVisible);
  const setAttributesVisible = useExplorerStore((s) => s.setAttributesVisible);
  const methodsVisible = useExplorerStore((s) => s.methodsVisible);
  const setMethodsVisible = useExplorerStore((s) => s.setMethodsVisible);
  const showSelectedOnly = useExplorerStore((s) => s.showSelectedOnly);
  const setShowSelectedOnly = useExplorerStore((s) => s.setShowSelectedOnly);

  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setSelectedEntity({ type: 'node', nodeId });
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Single-clicked graph item: ${nodeId}. Revealing path & copying to clipboard: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.copyToClipboard(targetFile.path);
      }
    },
    [codebase.files, setSelectedEntity]
  );

  const handleSelectMember = useCallback(
    (nodeId: string, memberId: string) => {
      setSelectedEntity({ type: 'member', nodeId, memberId });
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Single-clicked member item: ${memberId} in ${nodeId}. Revealing path & copying to clipboard: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.copyToClipboard(targetFile.path);
      }
    },
    [codebase.files, setSelectedEntity]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Double-clicked graph item: ${nodeId}. Opening file in VS Code: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.openFile(targetFile.path);
      }
    },
    [codebase.files]
  );

  const handleNodeCmdClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      const pathToAdd = targetFile?.path || nodeId;
      logInfo(`Cmd+Clicked graph item: ${nodeId}. Appending path to context paths panel: ${pathToAdd}`);
      vsCodeHandleMessage.emit('addPathToTop', { command: 'addPathToTop', payload: pathToAdd });
    },
    [codebase.files]
  );

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick,
    handleNodeCmdClick
  );

  useEffect(() => {
    if (!isReady || Object.keys(folderPositions).length === 0) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
    attributesVisible,
    methodsVisible,
    selectedEntity,
    showSelectedOnly,
    updateGraphTopology,
  ]);

  return (
    <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.center"
        isHiddable={true}
        headerLeft={<GraphPanelHeaderLeft />}
        headerCenter={
          <GraphPanelHeaderCenter
            maxNodesLimit={filter.maxNodesLimit}
            setMaxNodesLimit={filter.setMaxNodesLimit}
            callersDepth={callersDepth}
            setCallersDepth={setCallersDepth}
            calleesDepth={calleesDepth}
            setCalleesDepth={setCalleesDepth}
            displayLevel={filter.displayLevel}
            setDisplayLevel={filter.setDisplayLevel}
            currentLayout={currentLayout}
            setCurrentLayout={setCurrentLayout}
          />
        }
        headerRight={
          <GraphPanelHeaderRight
            cyRef={cyRef}
            isGraphMaximized={false}
            setIsGraphMaximized={() => toggleContainerMaximized('workspace.center')}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            attributesVisible={attributesVisible}
            setAttributesVisible={setAttributesVisible}
            methodsVisible={methodsVisible}
            setMethodsVisible={setMethodsVisible}
            showSelectedOnly={showSelectedOnly}
            setShowSelectedOnly={setShowSelectedOnly}
          />
        }
      />
      <div className="relative flex-1 w-full h-full min-h-0">
        <GraphPanel
          folderPositions={folderPositions}
          containerRef={containerRef}
          showGrid={showGrid}
          isDarkMode={isDarkMode}
          graphState={graphState}
          selectedEntity={selectedEntity}
          focusedNodeId={focusedNodeId}
          searchFilteredFiles={filter.searchFilteredFiles}
          impactedSet={impactedSet}
          handleSelectMember={handleSelectMember}
          attributesVisible={attributesVisible}
          methodsVisible={methodsVisible}
          showSelectedOnly={showSelectedOnly}
        />
      </div>
    </div>
  );
}
EOF

# 7. Update Cytoscape instance with single click reveal + copy to clipboard & double click open file
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/hooks/useCytoscapeInstance.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(
  isDarkMode: boolean,
  onNodeSelect: (nodeId: string) => void,
  onNodeDoubleClick?: (nodeId: string) => void,
  onNodeCmdClick?: (nodeId: string) => void
) {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const onNodeSelectRef = useRef(onNodeSelect);
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  const onNodeDoubleClickRef = useRef(onNodeDoubleClick);
  useEffect(() => {
    onNodeDoubleClickRef.current = onNodeDoubleClick;
  }, [onNodeDoubleClick]);

  const onNodeCmdClickRef = useRef(onNodeCmdClick);
  useEffect(() => {
    onNodeCmdClickRef.current = onNodeCmdClick;
  }, [onNodeCmdClick]);

  const [graphState, setGraphState] = useState<GraphState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodePositions: {}
  });

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setContainerNode(node);
    }
  }, []);

  useEffect(() => {
    if (!containerNode) return;

    const cy = cytoscape({
      container: containerNode,
      style: [
        { selector: 'node[width][height]', style: { 'shape': 'rectangle', 'opacity': 0.0, 'width': 'data(width)', 'height': 'data(height)' } },
        { selector: 'node.folder', style: { 'shape': 'rectangle', 'opacity': 1.0, 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -12, 'font-size': '12px', 'font-family': 'monospace', 'font-weight': 'bold', 'color': isDarkMode ? '#94a3b8' : '#475569', 'background-opacity': 0.02, 'background-color': isDarkMode ? '#475569' : '#94a3b8', 'border-width': '2px', 'border-color': isDarkMode ? '#334155' : '#cbd5e1', 'border-style': 'dashed', 'padding': '40' } },
        { selector: 'edge', style: { 'width': 2, 'line-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'font-family': 'monospace', 'color': isDarkMode ? '#94a3b8' : '#475569', 'text-background-opacity': 1, 'text-background-color': isDarkMode ? '#18181b' : '#ffffff', 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle' } },
        { selector: 'edge.impacted', style: { 'line-color': '#eab308', 'target-arrow-color': '#eab308', 'width': 3.5, 'color': isDarkMode ? '#fef08a' : '#854d0e', 'text-background-color': isDarkMode ? '#422006' : '#fef9c3', 'text-background-opacity': 1 } }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    // Single / Cmd + Click: Handle node selection, reveal in VS Code Explorer, and copy path to clipboard
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (!node.hasClass('folder')) {
        const nodeId = node.id();
        const nodePath = node.data('path') || node.data('absolutePath') || node.data('filePath') || nodeId;
        if (nodePath) {
          logInfo(`Cytoscape node single-clicked: ${nodeId} (${nodePath}). Revealing in VS Code Explorer & copying...`);
          vsCodeApiService.revealInExplorer(nodePath);
          vsCodeApiService.copyToClipboard(nodePath);
        }
        const origEvt = evt.originalEvent as MouseEvent | undefined;
        if (origEvt && (origEvt.metaKey || origEvt.ctrlKey)) {
          onNodeCmdClickRef.current?.(nodeId);
        } else {
          onNodeSelectRef.current(nodeId);
        }
      }
    });

    // Double Click: Open file and reveal in VS Code Explorer
    cy.on('dbltap', 'node', (evt) => {
      if (!evt.target.hasClass('folder')) {
        const nodeId = evt.target.id();
        const nodePath = evt.target.data('path') || evt.target.data('absolutePath') || evt.target.data('filePath') || nodeId;
        if (nodePath) {
          logInfo(`Cytoscape node double-clicked: ${nodeId} (${nodePath}). Opening in VS Code...`);
          vsCodeApiService.revealInExplorer(nodePath);
          vsCodeApiService.openFile(nodePath);
        }
        onNodeDoubleClickRef.current?.(nodeId);
      }
    });

    const syncGraph = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (!cyRef.current || cyRef.current.destroyed()) return;

        const currentCy = cyRef.current;
        const zoom = currentCy.zoom();
        const pan = currentCy.pan();
        const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};

        currentCy.nodes().forEach(node => {
          if (node.hasClass('folder')) return;
          const bb = node.boundingBox({ includeLabels: false, includeEdges: false });
          positions[node.id()] = {
            x: Math.round(bb.x1),
            y: Math.round(bb.y1),
            w: Math.round(bb.w),
            h: Math.round(bb.h)
          };
        });

        setGraphState(prev => {
          const zoomDiff = Math.abs(prev.zoom - zoom);
          const panXDiff = Math.abs(prev.pan.x - pan.x);
          const panYDiff = Math.abs(prev.pan.y - pan.y);

          let positionsChanged = Object.keys(prev.nodePositions).length !== Object.keys(positions).length;
          if (!positionsChanged) {
            for (const key of Object.keys(positions)) {
              const p1 = prev.nodePositions[key];
              const p2 = positions[key];
              if (!p1 || Math.abs(p1.x - p2.x) > 1 || Math.abs(p1.y - p2.y) > 1 || Math.abs(p1.w - p2.w) > 1 || Math.abs(p1.h - p2.h) > 1) {
                positionsChanged = true;
                break;
              }
            }
          }

          if (zoomDiff < 0.001 && panXDiff < 0.5 && panYDiff < 0.5 && !positionsChanged) {
            return prev;
          }

          return { zoom, pan: { x: pan.x, y: pan.y }, nodePositions: positions };
        });
      });
    };

    cy.on('dragfree pan zoom layoutstop', syncGraph);

    requestAnimationFrame(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
      }
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      cy.destroy();
      cyRef.current = null;
    };
  }, [containerNode, isDarkMode]);

  return { containerRef, cyRef, graphState, isReady: !!containerNode };
}
EOF

echo "✅ Extracted click handlers to use-files-context.ts, enabled clipboard copy on single-click, and fixed ViewMode auto-collapse!"
