import { useEffect, useMemo, useCallback } from 'react';
import { CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { filterCodebaseFiles } from '@/services/view/graph-view.service';
import { useExplorerStore } from '../store/useExplorerStore';

export function useCodebaseFilter(allFiles: CodebaseFile[]) {
  const searchTerm = useExplorerStore((s) => s.searchTerm);
  const setSearchTerm = useExplorerStore((s) => s.setSearchTerm);
  const displayLevel = useExplorerStore((s) => s.displayLevel);
  const setDisplayLevel = useExplorerStore((s) => s.setDisplayLevel);
  const maxNodesLimit = useExplorerStore((s) => s.maxNodesLimit);
  const setMaxNodesLimit = useExplorerStore((s) => s.setMaxNodesLimit);
  const expandedFolders = useExplorerStore((s) => s.expandedFolders);
  const visibleFiles = useExplorerStore((s) => s.visibleFiles);
  const setVisibleFiles = useExplorerStore((s) => s.setVisibleFiles);
  const toggleFolder = useExplorerStore((s) => s.toggleFolder);
  const toggleFolderCheckboxStore = useExplorerStore((s) => s.toggleFolderCheckbox);
  const toggleFileCheckbox = useExplorerStore((s) => s.toggleFileCheckbox);
  const resetFiltersStore = useExplorerStore((s) => s.resetFilters);

  useEffect(() => {
    setVisibleFiles((prev) => {
      let changed = false;
      const updated = { ...prev };
      allFiles.forEach((f) => {
        if (updated[f.id] === undefined) {
          updated[f.id] = true;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [allFiles, setVisibleFiles]);

  const toggleFolderCheckbox = useCallback(
    (folderName: string) => {
      toggleFolderCheckboxStore(folderName, allFiles);
    },
    [allFiles, toggleFolderCheckboxStore]
  );

  const searchFilteredFiles = useMemo(() => {
    return filterCodebaseFiles(allFiles, searchTerm, displayLevel, visibleFiles, maxNodesLimit);
  }, [allFiles, searchTerm, displayLevel, visibleFiles, maxNodesLimit]);

  const resetFilters = useCallback(() => {
    resetFiltersStore(allFiles);
  }, [allFiles, resetFiltersStore]);

  return {
    searchTerm,
    setSearchTerm,
    displayLevel,
    setDisplayLevel,
    maxNodesLimit,
    setMaxNodesLimit,
    expandedFolders,
    visibleFiles,
    toggleFolder,
    toggleFolderCheckbox,
    toggleFileCheckbox,
    searchFilteredFiles,
    resetFilters,
  };
}
