import { useState, useMemo, useCallback } from 'react';
import { CodebaseFile, filterCodebaseFiles } from '@/services/codebase';

const INITIAL_VISIBLE_FILES: Record<string, boolean> = {
  'OrderButton.tsx': true,
  'orderApi.ts': true,
  'OrderController.java': true,
  'Order.java': true,
  'OrderRepository.java': true,
  'JpaOrderRepository.java': true,
  'application.yml': true
};

export function useCodebaseFilter(allFiles: CodebaseFile[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLevel, setDisplayLevel] = useState('all');
  const [maxNodesLimit, setMaxNodesLimit] = useState(50);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    frontend: true,
    backend: true,
    config: true
  });
  const [visibleFiles, setVisibleFiles] = useState<Record<string, boolean>>(INITIAL_VISIBLE_FILES);

  const toggleFolder = useCallback((folderName: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  }, []);

  const toggleFolderCheckbox = useCallback((folderName: string) => {
    const folderFiles = allFiles.filter(f => f.path.startsWith(folderName));
    const isCurrentlyChecked = folderFiles.every(f => visibleFiles[f.id]);
    const targetState = !isCurrentlyChecked;

    setVisibleFiles(prev => {
      const updated = { ...prev };
      folderFiles.forEach(file => { updated[file.id] = targetState; });
      return updated;
    });
  }, [allFiles, visibleFiles]);

  const toggleFileCheckbox = useCallback((fileId: string) => {
    setVisibleFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  }, []);

  const searchFilteredFiles = useMemo(() => {
    return filterCodebaseFiles(allFiles, searchTerm, displayLevel, visibleFiles, maxNodesLimit);
  }, [allFiles, searchTerm, displayLevel, visibleFiles, maxNodesLimit]);

  const resetFilters = useCallback(() => {
    setVisibleFiles(INITIAL_VISIBLE_FILES);
    setSearchTerm('');
    setDisplayLevel('all');
  }, []);

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
    resetFilters
  };
}
