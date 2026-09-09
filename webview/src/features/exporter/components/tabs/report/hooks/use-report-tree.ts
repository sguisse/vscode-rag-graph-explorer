import { useState, useMemo } from 'react';
import { TreeManifestNode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface ExtensionItem {
  node: TreeManifestNode;
  fileName: string;
}

export interface ExtensionGroup {
  ext: string;
  displayLabel: string;
  items: ExtensionItem[];
}

export type ViewMode = 'standard' | 'extension' | 'heavy';
export type ExtSortKey = 'name' | 'size';
export type SortDirection = 'asc' | 'desc';

export function formatBytes(bytes: number = 0): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getNodeTotalSize(node: TreeManifestNode): number {
  if (node.type === 'file') return (node as TreeManifestNode & { size?: number }).size || 0;
  if (!node.children) return 0;
  let total = 0;
  for (const child of Object.values(node.children)) {
    total += getNodeTotalSize(child);
  }
  return total;
}

export function getGroupTotalSize(grp: ExtensionGroup): number {
  return grp.items.reduce((acc, item) => {
    const s = (item.node as TreeManifestNode & { size?: number }).size || 0;
    return acc + s;
  }, 0);
}

export function getRealFileNameAndExtension(node: TreeManifestNode): { fileName: string; ext: string } {
  let fileName = node.name || '';
  if (node.absolute_path) {
    const pathBase = node.absolute_path.split(/[/\\]/).pop();
    if (pathBase) {
      fileName = pathBase;
    }
  }

  const lastDot = fileName.lastIndexOf('.');
  let ext = 'no_ext';
  if (lastDot > 0 && lastDot < fileName.length - 1) {
    ext = fileName.slice(lastDot + 1).toLowerCase();
  } else if (lastDot === 0 && fileName.length > 1) {
    ext = fileName.slice(1).toLowerCase();
  }

  return { fileName, ext };
}

export function collectAllFiles(node: TreeManifestNode | null): TreeManifestNode[] {
  if (!node) return [];
  if (node.type === 'file') return [node];
  const results: TreeManifestNode[] = [];
  if (node.children) {
    for (const child of Object.values(node.children)) {
      results.push(...collectAllFiles(child));
    }
  }
  return results;
}

export function collectAllNodes(node: TreeManifestNode | null): TreeManifestNode[] {
  if (!node) return [];
  const results: TreeManifestNode[] = [node];
  if (node.children) {
    for (const child of Object.values(node.children)) {
      results.push(...collectAllNodes(child));
    }
  }
  return results;
}

export function groupFilesByExtension(files: TreeManifestNode[]): ExtensionGroup[] {
  const map = new Map<string, ExtensionItem[]>();

  for (const file of files) {
    const { fileName, ext } = getRealFileNameAndExtension(file);
    if (!map.has(ext)) {
      map.set(ext, []);
    }
    map.get(ext)!.push({ node: file, fileName });
  }

  const groups: ExtensionGroup[] = [];
  for (const [ext, items] of map.entries()) {
    items.sort((a, b) => a.fileName.localeCompare(b.fileName));
    const displayLabel = ext === 'no_ext' ? 'no extension' : `.${ext}`;
    groups.push({
      ext,
      displayLabel: `${displayLabel} (${items.length})`,
      items,
    });
  }

  return groups;
}

export function getNodeCheckState(node: TreeManifestNode, checkedKeys: Record<string, boolean>): boolean | 'indeterminate' {
  if (node.type === 'file') {
    return Boolean(checkedKeys[node.absolute_path]);
  }
  const files = collectAllFiles(node);
  if (files.length === 0) return false;
  let checkedCount = 0;
  for (const f of files) {
    if (checkedKeys[f.absolute_path]) checkedCount++;
  }
  if (checkedCount === 0) return false;
  if (checkedCount === files.length) return true;
  return 'indeterminate';
}

export function getGroupCheckState(grp: ExtensionGroup, checkedKeys: Record<string, boolean>): boolean | 'indeterminate' {
  if (grp.items.length === 0) return false;
  let checkedCount = 0;
  for (const { node } of grp.items) {
    if (checkedKeys[node.absolute_path]) checkedCount++;
  }
  if (checkedCount === 0) return false;
  if (checkedCount === grp.items.length) return true;
  return 'indeterminate';
}

interface UseReportTreeProps {
  rootNode?: TreeManifestNode | null;
  onExcludePattern?: (pattern: string, isExt: boolean) => void;
  onCaptureSelectedPaths?: (paths: string[]) => void;
}

export function useReportTree({ rootNode = null, onExcludePattern, onCaptureSelectedPaths }: UseReportTreeProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [extSortKey, setExtSortKey] = useState<ExtSortKey>('name');
  const [extSortDir, setExtSortDir] = useState<SortDirection>('asc');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>({});

  const allFiles = useMemo(() => collectAllFiles(rootNode), [rootNode]);
  const allNodes = useMemo(() => collectAllNodes(rootNode), [rootNode]);

  const rawExtensionGroups = useMemo(() => groupFilesByExtension(allFiles), [allFiles]);

  const extensionGroups = useMemo(() => {
    return [...rawExtensionGroups].sort((a, b) => {
      if (extSortKey === 'name') {
        const comp = a.ext.localeCompare(b.ext);
        return extSortDir === 'asc' ? comp : -comp;
      } else {
        const sizeA = getGroupTotalSize(a);
        const sizeB = getGroupTotalSize(b);
        const comp = sizeA - sizeB;
        return extSortDir === 'asc' ? comp : -comp;
      }
    });
  }, [rawExtensionGroups, extSortKey, extSortDir]);

  const heavyFiles = useMemo(() => {
    let filtered = [...allFiles];
    if (searchQuery.trim()) {
      filtered = filtered.filter((node) => {
        const { fileName } = getRealFileNameAndExtension(node);
        return useRegex
          ? new RegExp(searchQuery, 'i').test(fileName)
          : fileName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    return filtered.sort((a, b) => {
      const sizeA = (a as TreeManifestNode & { size?: number }).size || 0;
      const sizeB = (b as TreeManifestNode & { size?: number }).size || 0;
      return sizeB - sizeA;
    });
  }, [allFiles, searchQuery, useRegex]);

  const allFilePathsSet = useMemo(() => {
    return new Set(allFiles.map((f) => f.absolute_path));
  }, [allFiles]);

  const checkedPaths = useMemo(() => {
    return Object.entries(checkedKeys)
      .filter(([path, isChecked]) => isChecked && allFilePathsSet.has(path))
      .map(([path]) => path);
  }, [checkedKeys, allFilePathsSet]);

  const toggleExpand = (pathKey: string) => {
    logInfo('[ReportTreePanel] toggleExpand handler triggered', [pathKey]);
    setExpandedKeys((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  const toggleCheck = (pathKey: string, node: TreeManifestNode) => {
    logInfo('[ReportTreePanel] toggleCheck handler triggered', [pathKey]);
    const currentState = getNodeCheckState(node, checkedKeys);
    const nextChecked = currentState !== true;
    const newChecked = { ...checkedKeys };

    const updateChildChecks = (n: TreeManifestNode) => {
      newChecked[n.absolute_path] = nextChecked;
      if (n.children) {
        Object.values(n.children).forEach(updateChildChecks);
      }
    };

    updateChildChecks(node);
    setCheckedKeys(newChecked);
  };

  const toggleGroupCheck = (extGroup: ExtensionGroup) => {
    logInfo('[ReportTreePanel] toggleGroupCheck handler triggered', [extGroup.ext]);
    const currentState = getGroupCheckState(extGroup, checkedKeys);
    const nextChecked = currentState !== true;
    const newChecked = { ...checkedKeys };
    for (const { node } of extGroup.items) {
      newChecked[node.absolute_path] = nextChecked;
    }
    setCheckedKeys(newChecked);
  };

  const handleOpenFile = (path: string) => {
    logInfo('[ReportTreePanel] handleOpenFile handler triggered', [path]);
    fileExporterApiService.openPathAtCursor(path);
  };

  const handleRevealNode = (path: string) => {
    logInfo('[ReportTreePanel] handleRevealNode handler triggered', [path]);
    fileExporterApiService.openPathAtCursor(path);
  };

  const handleExcludePattern = (pattern: string, isExt: boolean) => {
    logInfo('[ReportTreePanel] handleExcludePattern handler triggered', [{ pattern, isExt }]);
    if (onExcludePattern) {
      onExcludePattern(pattern, isExt);
    }
  };

  const handleExcludeExtension = (ext: string) => {
    const pattern = ext === 'no_ext' ? '^[^.]+$' : `.*\\.${ext}$`;
    logInfo('[ReportTreePanel] handleExcludeExtension triggered', [{ ext, pattern }]);
    if (onExcludePattern) {
      onExcludePattern(pattern, true);
    }
  };

  const handleToggleViewMode = () => {
    const modes: ViewMode[] = ['standard', 'extension', 'heavy'];
    const nextIdx = (modes.indexOf(viewMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    logInfo('[ReportTreePanel] handleToggleViewMode handler triggered', [nextMode]);
    setViewMode(nextMode);
  };

  const handleToggleExtSortByName = () => {
    if (extSortKey === 'name') {
      setExtSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setExtSortKey('name');
      setExtSortDir('asc');
    }
  };

  const handleToggleExtSortBySize = () => {
    if (extSortKey === 'size') {
      setExtSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setExtSortKey('size');
      setExtSortDir('desc');
    }
  };

  const handleExpandAll = () => {
    logInfo('[ReportTreePanel] handleExpandAll triggered', [{ viewMode, checkedCount: checkedPaths.length }]);
    const newExpanded = { ...expandedKeys };

    if (viewMode === 'extension') {
      const selectedSet = new Set(checkedPaths);
      for (const grp of extensionGroups) {
        const groupKey = `ext:${grp.ext}`;
        if (selectedSet.size > 0) {
          const hasSelectedChild = grp.items.some(({ node }) => selectedSet.has(node.absolute_path));
          if (hasSelectedChild) {
            newExpanded[groupKey] = true;
          }
        } else {
          newExpanded[groupKey] = true;
        }
      }
    } else if (viewMode === 'standard') {
      const selectedSet = new Set(checkedPaths);
      for (const node of allNodes) {
        if (node.type === 'directory') {
          if (selectedSet.size > 0) {
            const descendantFiles = collectAllFiles(node);
            const hasSelected = descendantFiles.some((f) => selectedSet.has(f.absolute_path));
            if (hasSelected) {
              newExpanded[node.absolute_path] = true;
            }
          } else {
            newExpanded[node.absolute_path] = true;
          }
        }
      }
    }
    setExpandedKeys(newExpanded);
  };

  const handleCollapseAll = () => {
    logInfo('[ReportTreePanel] handleCollapseAll triggered', [{ viewMode, checkedCount: checkedPaths.length }]);
    const newExpanded = { ...expandedKeys };

    if (viewMode === 'extension') {
      const selectedSet = new Set(checkedPaths);
      for (const grp of extensionGroups) {
        const groupKey = `ext:${grp.ext}`;
        if (selectedSet.size > 0) {
          const hasSelectedChild = grp.items.some(({ node }) => selectedSet.has(node.absolute_path));
          if (hasSelectedChild) {
            newExpanded[groupKey] = false;
          }
        } else {
          newExpanded[groupKey] = false;
        }
      }
    } else if (viewMode === 'standard') {
      const selectedSet = new Set(checkedPaths);
      for (const node of allNodes) {
        if (node.type === 'directory') {
          if (selectedSet.size > 0) {
            const descendantFiles = collectAllFiles(node);
            const hasSelected = descendantFiles.some((f) => selectedSet.has(f.absolute_path));
            if (hasSelected) {
              newExpanded[node.absolute_path] = false;
            }
          } else {
            newExpanded[node.absolute_path] = false;
          }
        }
      }
    }
    setExpandedKeys(newExpanded);
  };

  const handleCaptureSelected = () => {
    logInfo('[ReportTreePanel] handleCaptureSelected handler triggered');
    if (onCaptureSelectedPaths) {
      onCaptureSelectedPaths(checkedPaths);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    useRegex,
    setUseRegex,
    viewMode,
    extSortKey,
    extSortDir,
    expandedKeys,
    checkedKeys,
    checkedPaths,
    extensionGroups,
    heavyFiles,
    toggleExpand,
    toggleCheck,
    toggleGroupCheck,
    handleOpenFile,
    handleRevealNode,
    handleExcludePattern,
    handleExcludeExtension,
    handleToggleViewMode,
    handleToggleExtSortByName,
    handleToggleExtSortBySize,
    handleExpandAll,
    handleCollapseAll,
    handleCaptureSelected,
  };
}
