import { useState, useMemo, useCallback, useEffect } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '@/features/explorer/store/useExplorerStore';
import { useFinderBase } from './useFinderBase';
import { getFileFolderKey } from '@/features/explorer/wkp-lft-codebase-tree/hooks/use-codebase-explorer-panel';

export function useFinderTree(
  codebase: CodebaseData,
  onFocusNode?: (nodeId: string) => void
) {
  const finderBase = useFinderBase();
  const {
    isFinderOpen,
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    currentMatchIndex,
    setCurrentMatchIndex,
  } = finderBase;

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [collapseNodeSearchNotCompliantEnabled, setCollapseNodeSearchNotCompliantEnabled] = useState(false);

  const allSearchableFiles = useMemo(() => codebase.files || [], [codebase]);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];

    let pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    try {
      const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      return allSearchableFiles.filter((f) => {
        regex.lastIndex = 0;
        return regex.test(f.name) || regex.test(f.path || '');
      });
    } catch (e) {
      return [];
    }
  }, [allSearchableFiles, searchQuery, caseSensitive, wholeWord, useRegex]);

  const matchingFileIds = useMemo(() => new Set(matches.map((f) => f.id)), [matches]);
  const totalMatches = matches.length;

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, caseSensitive, wholeWord, useRegex, setCurrentMatchIndex]);

  const getParentFolderKeys = useCallback((file: CodebaseFile): string[] => {
    const keys: string[] = [];
    const scopeKey = getFileFolderKey(file);
    keys.push(scopeKey);

    const filePath = file.path || '';
    const parts = filePath.split('/').filter(Boolean);
    let currentAcc = scopeKey;

    for (let i = 0; i < parts.length - 1; i++) {
      currentAcc += `/${parts[i]}`;
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

    if (collapseNodeSearchNotCompliantEnabled && searchQuery.trim()) {
      const compliantFolderKeys = new Set<string>();
      matches.forEach((file) => {
        getParentFolderKeys(file).forEach((key) => compliantFolderKeys.add(key));
      });

      useExplorerStore.setState((s) => {
        const updatedExpanded: Record<string, boolean> = {};
        Object.keys(s.expandedFolders).forEach((key) => {
          updatedExpanded[key] = compliantFolderKeys.has(key);
        });
        compliantFolderKeys.forEach((key) => {
          updatedExpanded[key] = true;
        });
        return { expandedFolders: updatedExpanded };
      });
    } else {
      const folderKeysToExpand: Record<string, boolean> = {};
      matches.forEach((file) => {
        getParentFolderKeys(file).forEach((key) => {
          folderKeysToExpand[key] = true;
        });
      });

      useExplorerStore.setState((s) => ({
        expandedFolders: {
          ...s.expandedFolders,
          ...folderKeysToExpand,
        },
      }));
    }

    setTimeout(() => {
      const element = document.getElementById(`tree-file-node-${activeMatch.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [
    currentMatchIndex,
    matches,
    isFinderOpen,
    searchQuery,
    collapseNodeSearchNotCompliantEnabled,
    getParentFolderKeys,
    onFocusNode,
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
    collapseNodeSearchNotCompliantEnabled,
    setCollapseNodeSearchNotCompliantEnabled,
    totalMatches,
    matches,
    matchingFileIds,
    handleNextMatch,
    handlePrevMatch,
  };
}
