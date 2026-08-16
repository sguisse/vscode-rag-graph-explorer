import { useMemo } from 'react';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';

export function useGraphPanel(
  folderPositions: Record<string, { label: string }>,
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>,
  showSelectedOnly: boolean,
  selectedEntity: SelectedEntity | null,
  searchFilteredFiles: CodebaseFile[],
  impactedSet: Set<string>
) {
  const effectiveFolderPositions = useMemo(() => {
    const folderMap: Record<string, { label: string }> = { ...folderPositions };

    Object.keys(nodePositions).forEach((nodeKey) => {
      if (nodeKey.startsWith('folder__')) {
        const folderKey = nodeKey.replace('folder__', '');
        if (!folderMap[folderKey]) {
          folderMap[folderKey] = {
            label: `📂 ${folderKey.charAt(0).toUpperCase() + folderKey.slice(1)}`
          };
        }
      }
    });

    return folderMap;
  }, [folderPositions, nodePositions]);

  const effectiveSearchFilteredFiles = useMemo(() => {
    if (showSelectedOnly && selectedEntity) {
      return searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id));
    }
    return searchFilteredFiles;
  }, [searchFilteredFiles, showSelectedOnly, selectedEntity, impactedSet]);

  return {
    effectiveFolderPositions,
    effectiveSearchFilteredFiles,
  };
}
