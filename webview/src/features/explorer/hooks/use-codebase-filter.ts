import { useState, useMemo, useCallback, useEffect } from 'react';
import { CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { filterCodebaseFiles } from '@/services/view/graph-view.service';
import { INITIAL_VISIBLE_FILES_CONFIG } from '../constants/graph.constants';

export function useCodebaseFilter(allFiles: CodebaseFile[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLevel, setDisplayLevel] = useState('all');
  const [maxNodesLimit, setMaxNodesLimit] = useState(50);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    frontend: true,
    backend: true,
    config: true
  });
  const [visibleFiles, setVisibleFiles] = useState<Record<string, boolean>>(INITIAL_VISIBLE_FILES_CONFIG);

  useEffect(() => {
    setVisibleFiles(prev => {
      const updated = { ...prev };
      allFiles.forEach(f => {
        if (updated[f.id] === undefined) {
          updated[f.id] = true;
        }
      });
      return updated;
    });
  }, [allFiles]);

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
    const resetVisible: Record<string, boolean> = {};
    allFiles.forEach(f => { resetVisible[f.id] = true; });
    setVisibleFiles(resetVisible);
    setSearchTerm('');
    setDisplayLevel('all');
  }, [allFiles]);

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
