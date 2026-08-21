import { useState, useMemo } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '../../constants/graph.constants';

export function getFileFolderKey(file: CodebaseFile): string {
  const tags = file.tags as any;
  if (Array.isArray(tags)) {
    if (tags.includes('frontend')) return 'frontend';
    if (tags.includes('backend')) return 'backend';
    if (tags.includes('config')) return 'config';
  } else if (typeof tags === 'string') {
    if (tags.includes('frontend')) return 'frontend';
    if (tags.includes('backend')) return 'backend';
    if (tags.includes('config')) return 'config';
  }
  if (file.path?.startsWith('frontend')) return 'frontend';
  if (file.path?.startsWith('backend')) return 'backend';
  if (file.path?.startsWith('config')) return 'config';
  return 'other';
}

export function useCodebaseExplorerPanel(codebase: CodebaseData) {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExportCodebase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codebase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "codebase-ast.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const registeredFolders = useMemo(() => [...FOLDER_KEYS_REGISTERED_CONFIG], []);
  const allFolderKeys = useMemo(() => {
    const hasOtherFiles = codebase.files.some(
      (f: CodebaseFile) => getFileFolderKey(f) === 'other'
    );
    return hasOtherFiles ? [...registeredFolders] : registeredFolders.filter((rf) => rf !== 'other');
  }, [codebase.files, registeredFolders]);

  return {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    registeredFolders,
    allFolderKeys,
    getFileFolderKey,
  };
}
