#!/usr/bin/env bash
set -e

# Create necessary directory paths
mkdir -p webview/src/components/app/core/finder/hooks
mkdir -p webview/src/features/explorer-old/wkp-lft-codebase-tree/hooks

# 1. Update useFinderTree.ts to use a ref for expandedKeys and prevent redundant state updates
cat << 'EOF' > webview/src/components/app/core/finder/hooks/useFinderTree.ts
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FindableTreeItem } from '../model/findable-tree-item';
import { useFinderBase, UseFinderBaseOptions } from './useFinderBase';

export interface UseFinderTreeOptions<T extends FindableTreeItem> extends UseFinderBaseOptions {
  treeData: T[];
  onFocusNode?: (nodeId: string) => void;
  expandedKeys?: Record<string, boolean>;
  onExpandedKeysChange?: (expanded: Record<string, boolean>) => void;
  getNodeDomId?: (nodeId: string) => string;
}

export function useFinderTree<T extends FindableTreeItem>({
  treeData,
  onFocusNode,
  expandedKeys,
  onExpandedKeysChange,
  getNodeDomId = (id: string) => `tree-file-node-${id}`,
  ...baseOptions
}: UseFinderTreeOptions<T>) {
  const finderBase = useFinderBase(baseOptions);
  const {
    isFinderOpen,
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    currentMatchIndex,
    setCurrentMatchIndex,
    activeRegex,
  } = finderBase;

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [collapseNotMatchingNodes, setCollapseNotMatchingNodes] = useState(false);

  const expandedKeysRef = useRef(expandedKeys);
  useEffect(() => {
    expandedKeysRef.current = expandedKeys;
  }, [expandedKeys]);

  const lastFocusedNodeIdRef = useRef<string | null>(null);

  const allSearchableItems = useMemo(() => {
    const list: T[] = [];
    const traverse = (items: T[]) => {
      for (const item of items) {
        list.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children as T[]);
        }
      }
    };
    traverse(treeData || []);
    return list;
  }, [treeData]);

  const matches = useMemo(() => {
    if (!searchQuery.trim() || !activeRegex) return [];

    return allSearchableItems.filter((item) => {
      const regex = new RegExp(activeRegex.source, activeRegex.flags);
      const matchName = regex.test(item.name);
      regex.lastIndex = 0;
      const matchPath = item.path ? regex.test(item.path) : false;
      return matchName || matchPath;
    });
  }, [allSearchableItems, searchQuery, activeRegex]);

  const matchingIds = useMemo(() => new Set(matches.map((item) => item.id)), [matches]);
  const totalMatches = matches.length;

  const getParentFolderKeys = useCallback((item: T): string[] => {
    const keys: string[] = [];
    if (item.parentId) {
      keys.push(item.parentId);
    }
    const pathStr = item.path || '';
    const parts = pathStr.split('/').filter(Boolean);
    let currentAcc = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentAcc += (i === 0 ? '' : '/') + parts[i];
      keys.push(currentAcc);
    }
    return keys;
  }, []);

  useEffect(() => {
    if (!isFinderOpen || matches.length === 0) return;
    const activeMatch = matches[currentMatchIndex];
    if (!activeMatch) return;

    if (onFocusNode && lastFocusedNodeIdRef.current !== activeMatch.id) {
      lastFocusedNodeIdRef.current = activeMatch.id;
      onFocusNode(activeMatch.id);
    }

    if (onExpandedKeysChange) {
      const currentExpanded = expandedKeysRef.current || {};
      if (collapseNotMatchingNodes && searchQuery.trim()) {
        const compliantFolderKeys = new Set<string>();
        matches.forEach((item) => {
          getParentFolderKeys(item).forEach((key) => compliantFolderKeys.add(key));
        });

        let hasChanged = false;
        const updatedExpanded: Record<string, boolean> = {};

        Object.keys(currentExpanded).forEach((key) => {
          const shouldExpand = compliantFolderKeys.has(key);
          updatedExpanded[key] = shouldExpand;
          if (currentExpanded[key] !== shouldExpand) {
            hasChanged = true;
          }
        });

        compliantFolderKeys.forEach((key) => {
          if (!updatedExpanded[key]) {
            updatedExpanded[key] = true;
            hasChanged = true;
          }
        });

        if (hasChanged) {
          onExpandedKeysChange(updatedExpanded);
        }
      } else {
        const folderKeysToExpand: string[] = [];
        matches.forEach((item) => {
          getParentFolderKeys(item).forEach((key) => {
            if (!currentExpanded[key]) {
              folderKeysToExpand.push(key);
            }
          });
        });

        if (folderKeysToExpand.length > 0) {
          const updatedExpanded = { ...currentExpanded };
          folderKeysToExpand.forEach((key) => {
            updatedExpanded[key] = true;
          });
          onExpandedKeysChange(updatedExpanded);
        }
      }
    }

    const domId = getNodeDomId(activeMatch.id);
    const element = document.getElementById(domId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [
    currentMatchIndex,
    matches,
    isFinderOpen,
    searchQuery,
    collapseNotMatchingNodes,
    getParentFolderKeys,
    onFocusNode,
    onExpandedKeysChange,
    getNodeDomId,
  ]);

  const handleNextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
  }, [totalMatches, setCurrentMatchIndex]);

  const handlePrevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  }, [totalMatches, setCurrentMatchIndex]);

  return {
    ...finderBase,
    isFilterActive,
    setIsFilterActive,
    collapseNotMatchingNodes,
    setCollapseNotMatchingNodes,
    totalMatches,
    matches,
    matchingIds,
    handleNextMatch,
    handlePrevMatch,
  };
}
EOF

# 2. Update use-treeview-finder.ts with shallow state change guards
cat << 'EOF' > webview/src/features/explorer-old/wkp-lft-codebase-tree/hooks/use-treeview-finder.ts
import { useMemo, useCallback } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '@/features/explorer-old/store/useExplorerStore';
import { ScopeGroup, ViewMode } from '../model-ui';
import { useFinderTree } from '@/components/app/core/finder/hooks/useFinderTree';
import { FindableTreeItem } from '@/components/app/core/finder/model/findable-tree-item';

export function useTreeviewFinder(
  codebase: CodebaseData,
  _viewMode: ViewMode,
  _groupedScopes: ScopeGroup[],
  onFocusNode?: (nodeId: string) => void
) {
  const treeData = useMemo<FindableTreeItem[]>(() => {
    return (codebase.files || []).map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      isFolder: false,
    }));
  }, [codebase.files]);

  const expandedFolders = useExplorerStore((s) => s.expandedFolders);
  const handleExpandedKeysChange = useCallback((newExpanded: Record<string, boolean>) => {
    const current = useExplorerStore.getState().expandedFolders || {};

    const currentKeys = Object.keys(current);
    const newKeys = Object.keys(newExpanded);
    if (currentKeys.length === newKeys.length && newKeys.every((k) => current[k] === newExpanded[k])) {
      return;
    }

    useExplorerStore.setState({ expandedFolders: newExpanded });
  }, []);

  const finderTree = useFinderTree({
    treeData,
    onFocusNode,
    expandedKeys: expandedFolders,
    onExpandedKeysChange: handleExpandedKeysChange,
    getNodeDomId: (id: string) => `tree-file-node-${id}`,
  });

  return {
    ...finderTree,
    matchingFileIds: finderTree.matchingIds,
  };
}
EOF

echo "✅ fix: Resolved infinite update loop in treeview finder and Zustand store!"
