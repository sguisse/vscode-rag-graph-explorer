import { useState, useMemo, useCallback, useEffect } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '@/features/explorer/store/useExplorerStore';
import {
  ScopeGroup,
  FolderTreeNode,
  ViewMode
} from '../model-ui';
import { useFinderBase } from '@/components/app/core/finder/useFinderBase';

export function useTreeviewFinder(
  codebase: CodebaseData,
  viewMode: ViewMode,
  groupedScopes: ScopeGroup[],
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

  const { fileParentFoldersMap, allFolderKeys } = useMemo(() => {
    const fileParentFoldersMap = new Map<string, string[]>();
    const allFolderKeys = new Set<string>();

    groupedScopes.forEach((scope) => {
      allFolderKeys.add(scope.key);

      if (viewMode === 'scope') {
        scope.files.forEach((file) => {
          fileParentFoldersMap.set(file.id, [scope.key]);
        });
      } else if (viewMode === 'folder') {
        if (scope.rootFiles) {
          scope.rootFiles.forEach((file) => {
            fileParentFoldersMap.set(file.id, [scope.key]);
          });
        }

        function traverseTree(nodes: FolderTreeNode[], ancestors: string[]) {
          nodes.forEach((node) => {
            allFolderKeys.add(node.id);
            const currentAncestors = [...ancestors, node.id];

            node.files.forEach((file) => {
              fileParentFoldersMap.set(file.id, currentAncestors);
            });

            if (node.children && node.children.length > 0) {
              traverseTree(node.children, currentAncestors);
            }
          });
        }

        if (scope.folderTree) {
          traverseTree(scope.folderTree, [scope.key]);
        }
      } else {
        if (scope.subFolders) {
          scope.subFolders.forEach((sub) => {
            allFolderKeys.add(sub.key);
            sub.files.forEach((file) => {
              fileParentFoldersMap.set(file.id, [scope.key, sub.key]);
            });
          });
        }
      }
    });

    return { fileParentFoldersMap, allFolderKeys };
  }, [groupedScopes, viewMode]);

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
        const parentKeys = fileParentFoldersMap.get(file.id) || [];
        parentKeys.forEach((key) => compliantFolderKeys.add(key));
      });

      useExplorerStore.setState((s) => {
        const updatedExpanded: Record<string, boolean> = {};
        allFolderKeys.forEach((key) => {
          updatedExpanded[key] = compliantFolderKeys.has(key);
        });
        return {
          expandedFolders: {
            ...s.expandedFolders,
            ...updatedExpanded,
          },
        };
      });
    } else {
      const folderKeysToExpand: Record<string, boolean> = {};
      matches.forEach((file) => {
        const parentKeys = fileParentFoldersMap.get(file.id) || [];
        parentKeys.forEach((key) => {
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

    // Safely scroll ONLY inside the middle container without moving outer window/layout
    setTimeout(() => {
      const container = document.getElementById('tree-codebase-files');
      const element = document.getElementById(`tree-file-node-${activeMatch.id}`);
      if (container && element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = relativeTop - containerRect.height / 2 + elementRect.height / 2;
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
    }, 120);
  }, [
    currentMatchIndex,
    matches,
    isFinderOpen,
    searchQuery,
    collapseNodeSearchNotCompliantEnabled,
    fileParentFoldersMap,
    allFolderKeys,
    onFocusNode,
  ]);

  const handleNextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev >= totalMatches - 1 ? 0 : prev + 1));
  }, [totalMatches, setCurrentMatchIndex]);

  const handlePrevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev <= 0 ? totalMatches - 1 : prev - 1));
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
