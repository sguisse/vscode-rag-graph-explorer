import { useState, useCallback } from 'react';

export function useContextPaths() {
  const [currentPath, setCurrentPath] = useState('/Users/workspace/path');
  const [pathsList, setPathsList] = useState<string[]>(['/Users/workspace/path']);

  const updatePath = useCallback((newPath: string) => {
    setCurrentPath(newPath);
    setPathsList((prev) => (prev.includes(newPath) ? prev : [...prev, newPath]));
  }, []);

  return {
    currentPath,
    pathsList,
    updatePath
  };
}
