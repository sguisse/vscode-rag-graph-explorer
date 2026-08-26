import { useState, useMemo, useCallback, useEffect } from 'react';
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

    if (onFocusNode) {
      onFocusNode(activeMatch.id);
    }

    if (onExpandedKeysChange) {
      if (collapseNotMatchingNodes && searchQuery.trim()) {
        const compliantFolderKeys = new Set<string>();
        matches.forEach((item) => {
          getParentFolderKeys(item).forEach((key) => compliantFolderKeys.add(key));
        });

        const updatedExpanded: Record<string, boolean> = {};
        if (expandedKeys) {
          Object.keys(expandedKeys).forEach((key) => {
            updatedExpanded[key] = compliantFolderKeys.has(key);
          });
        }
        compliantFolderKeys.forEach((key) => {
          updatedExpanded[key] = true;
        });
        onExpandedKeysChange(updatedExpanded);
      } else {
        const folderKeysToExpand: Record<string, boolean> = {};
        matches.forEach((item) => {
          getParentFolderKeys(item).forEach((key) => {
            folderKeysToExpand[key] = true;
          });
        });

        onExpandedKeysChange({
          ...(expandedKeys || {}),
          ...folderKeysToExpand,
        });
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
    expandedKeys,
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
