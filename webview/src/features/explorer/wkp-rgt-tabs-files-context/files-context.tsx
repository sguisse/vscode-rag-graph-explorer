import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GitFork, FileText, Copy, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';
import { codebaseExporterApiService } from '@/services/api/codebase-exporter-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';

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

interface DepthFileGroup {
  key: string;
  label: string;
  order: number;
  files: CodebaseFile[];
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

  const downstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const dsSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, 20, 20, true, false);
    return initialCodebase.files.filter(f => dsSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase]);

  const upstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const usSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, 20, 20, false, true);
    return initialCodebase.files.filter(f => usSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase]);

  // Compute depth and direction groups for impacted / target files
  const depthGroups = useMemo<DepthFileGroup[]>(() => {
    if (!selectedEntity || !initialCodebase?.files) return [];

    const targetId = selectedEntity.nodeId;
    const deps = initialCodebase.dependencies || [];

    // Downstream BFS
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

    // Upstream BFS
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
      const isImpacted = impactedSet.has(file.id) || Array.from(impactedSet).some(item => item === file.id || item.startsWith(file.id + '::'));

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

  // Distinct Theme Color Token provider per group key
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

  // Selection state for files
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Sync selected files when depthGroups change
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
  }, [depthGroups]);

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

  // Build context containing ALL files in codebase
  const totalFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase]);

  // Build final context containing ONLY selected files
  const combinedSelectedFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .filter((file) => !!selectedFiles[file.id])
      .map((file: CodebaseFile) => {

        let content = `${file.path}`;

        return content;
      })
      .join('\n');
  }, [initialCodebase, selectedFiles, impactedSet, selectedEntity]);

  const copyContext = async () => {
    const targetFilePaths = combinedSelectedFilesContext
                          ? combinedSelectedFilesContext.split('\n').map((p) => p.trim()).filter(Boolean)
                          : [];

    const exportFormat: ExportFormat = 'YAML';
    logInfo(`[FilesContextPanel] Exporting ${targetFilePaths} selected file(s) for context export in format '${exportFormat}'...`);
    const exportedFilePath = await codebaseExporterApiService.exportSelectedFiles(targetFilePaths, exportFormat);
    logInfo(`[FilesContextPanel] exportedFilePath ${exportedFilePath} for context export in format '${exportFormat}'...`);

    let combinedFilesContent = '';
    try {
        combinedFilesContent = await codebaseExporterApiService.readExportedFileContent(exportedFilePath);
        logInfo(`[FilesContextPanel] Successfully read content (${combinedFilesContent.length} chars) from exportedFilePath: ${exportedFilePath}`);
    } catch (err: any) {
      logError('Failed to read content from exportedFilePath:', err);
    }

    handleCopy(combinedFilesContent, "Selected Files Content copied to clipboard!");
  };

  return (
    <div className="space-y-4 font-mono text-xs animate-in duration-200 fade-in">
      {/* Impact Propagation Controls */}
      <div className="space-y-2 bg-muted/30 p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-2 grid grid-cols-2">
          <Button
            onClick={() => setEnableUpstream(prev => !prev)}
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
            onClick={() => setEnableDownstream(prev => !prev)}
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

      {/* Fluorescent Impact Plan with Collapsible Depth Groups & 3-State Checkboxes */}
      <div className="space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-500" />
            <h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5>
          </div>
          <span className="bg-orange-500/10 px-2 py-0.5 border border-orange-500/20 rounded font-mono font-bold text-[10px] text-orange-500">
            {selectedCount} Selected
          </span>
        </div>

        <div className="space-y-2 pr-1 max-h-60 overflow-y-auto">
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
                  {/* Group Header */}
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

                  {/* Group File Items with Filename, File Type & File Size Columns */}
                  {isExpanded && (
                    <div className="space-y-1 bg-background/40 p-1">
                      {groupFiles.map((file) => {
                        const fileSizeKb = (((file as any).size || file.content?.length || 0) / 1024).toFixed(1);

                        return (
                          <div
                            key={file.id}
                            className="flex justify-between items-center hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                          >
                            {/* Column 1: Filename & Checkbox */}
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

                            {/* Column 2 & 3: File Type & File Size */}
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

      {/* Unified Files Context Preview & Meta */}
      <div className="space-y-3 bg-card p-4 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Unified Files Context
            </h4>
          </div>
          <Button
            size="sm"
            onClick={copyContext}
            className="flex items-center gap-1.5 h-7 font-mono text-[11px] cursor-pointer"
          >
            <Copy size={12} /> Copy Context
          </Button>
        </div>

        {/* Row 1: Total Codebase Summary */}
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
            <span className="block text-[9px] text-yellow-600 dark:text-yellow-400 truncate uppercase">
                Token Size
            </span>
            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xs">
                {(totalFilesContext.length / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {/* Row 2: Selected Context Summary */}
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

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase">
            <span>Context Preview ({selectedCount} files)</span>
            <span>All-In-One Unified File</span>
          </div>
          <pre className="bg-slate-950 p-3 border border-slate-800 rounded-md max-h-64 overflow-x-auto overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
            {combinedSelectedFilesContext || '// No files selected for context generation.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
