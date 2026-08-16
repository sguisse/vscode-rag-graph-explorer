import { useState, useMemo } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '../../constants/graph.constants';

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
      (f: CodebaseFile) => !registeredFolders.some((rf) => f.path.startsWith(rf))
    );
    return hasOtherFiles ? [...registeredFolders, 'other'] : registeredFolders;
  }, [codebase.files, registeredFolders]);

  return {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    registeredFolders,
    allFolderKeys,
  };
}
