import { useState, useCallback } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { initialCodebase } from '@/features/explorer/wksp-cnt-graph/components/graph/GraphData';

export function useContextPaths(defaultCodebase: CodebaseData = initialCodebase) {
  const [currentPath, setCurrentPath] = useState('/Users/workspace/path');
  const [pathsList, setPathsList] = useState<string[]>(['/Users/workspace/path']);
  const [codebaseData, setCodebaseData] = useState<CodebaseData>(defaultCodebase);

  const updatePath = useCallback((newPath: string) => {
    setCurrentPath(newPath);
    setPathsList((prev) => (prev.includes(newPath) ? prev : [...prev, newPath]));
  }, []);

  const updateCodebaseData = useCallback((data: CodebaseData) => {
    setCodebaseData(data);
  }, []);

  return {
    currentPath,
    pathsList,
    codebaseData,
    updatePath,
    setCodebaseData: updateCodebaseData
  };
}
