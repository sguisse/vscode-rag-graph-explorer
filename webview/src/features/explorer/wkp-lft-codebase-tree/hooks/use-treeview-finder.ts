import { useMemo, useCallback } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '@/features/explorer/store/useExplorerStore';
import { ScopeGroup, ViewMode } from '../model-ui';
import { useFinderTree } from '@/components/app/core/finder/hooks/useFinderTree';
import { FindableTreeItem } from '@/components/app/core/finder/model/findable-tree-item';

export function useTreeviewFinder(
  codebase: CodebaseData,
  _viewMode: ViewMode,
  _groupedScopes: ScopeGroup[],
  onFocusNode?: (nodeId: string) => void
) {
  const treeData = useMemo<FindableTreeItem[]>(() => {
    return (codebase.files || []).map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      isFolder: false,
    }));
  }, [codebase.files]);

  const expandedFolders = useExplorerStore((s) => s.expandedFolders);
  const handleExpandedKeysChange = useCallback((newExpanded: Record<string, boolean>) => {
    useExplorerStore.setState({ expandedFolders: newExpanded });
  }, []);

  const finderTree = useFinderTree({
    treeData,
    onFocusNode,
    expandedKeys: expandedFolders,
    onExpandedKeysChange: handleExpandedKeysChange,
    getNodeDomId: (id: string) => `tree-file-node-${id}`,
  });

  return {
    ...finderTree,
    matchingFileIds: finderTree.matchingIds,
  };
}
