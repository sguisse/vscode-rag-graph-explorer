import { useCallback } from 'react';
import { CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function useCodebaseActions() {
  const revealAndCopyFile = useCallback((file: CodebaseFile) => {
    if (!file?.path) return;
    logInfo(`File single-clicked: ${file.path}. Revealing in VS Code Explorer and copying to clipboard...`);
    vsCodeApiService.revealInExplorer(file.path);
    vsCodeApiService.copyToClipboard(file.path);
  }, []);

  const openFileInEditor = useCallback((file: CodebaseFile) => {
    if (!file?.path) return;
    logInfo(`Double-clicked file item: ${file.id}. Opening in VS Code: ${file.path}`);
    vsCodeApiService.revealInExplorer(file.path);
    vsCodeApiService.openFile(file.path);
  }, []);

  const revealFolder = useCallback((folderPath: string) => {
    if (!folderPath) return;
    logInfo(`Folder clicked: ${folderPath}. Revealing in VS Code Explorer and copying to clipboard...`);
    vsCodeApiService.revealInExplorer(folderPath);
    vsCodeApiService.copyToClipboard(folderPath);
  }, []);

  const copyCypherQuery = useCallback(async (query: string, label: string) => {
    if (!query) return;
    await vsCodeApiService.copyToClipboard(query);
    logInfo(`Cypher query for '${label}' copied to clipboard:\n${query}`);
  }, []);

  return {
    revealAndCopyFile,
    openFileInEditor,
    revealFolder,
    copyCypherQuery,
  };
}
