import { useCallback } from 'react';
import { TreeBookmarkNode } from '../types/bookmarks.types';

export const useExternalDnD = () => {
  const extractUrlsFromUriList = useCallback((uriList: string): string[] => {
    return uriList.split('\n').map(line => line.trim()).filter(line =>
      line && !line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('file://'))
    );
  }, []);

  const flattenTreeNodes = useCallback((node: TreeBookmarkNode): TreeBookmarkNode[] => {
    let leaves: TreeBookmarkNode[] = [];
    if (node.url) {
      leaves.push(node);
    }
    if (node.children) {
      node.children.forEach(c => {
        leaves = leaves.concat(flattenTreeNodes(c));
      });
    }
    return leaves;
  }, []);

  return { extractUrlsFromUriList, flattenTreeNodes };
};
