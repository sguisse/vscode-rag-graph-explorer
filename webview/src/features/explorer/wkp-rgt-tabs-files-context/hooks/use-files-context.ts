import { useMemo, useEffect } from 'react';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';
import { useFilesCtxExportStore } from '../../components/files-ctx-export/use-files-ctx-export-store';
import { useExplorerStore } from '../../store/useExplorerStore';

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
  const setTargetFilePaths = useFilesCtxExportStore((s) => s.setTargetFilePaths);

  const selectedFiles = useExplorerStore((s) => s.selectedContextFiles);
  const setSelectedFiles = useExplorerStore((s) => s.setSelectedContextFiles);
  const expandedGroups = useExplorerStore((s) => s.expandedContextGroups);
  const setExpandedGroups = useExplorerStore((s) => s.setExpandedContextGroups);

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
  };
}
