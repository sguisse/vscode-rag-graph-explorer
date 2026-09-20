import { useCallback } from 'react';
import { TreeBookmarkNode, CheckboxState } from '../types/bookmarks.types';

export const useTreeSelection = () => {
  const updateCheckState = useCallback((nodes: TreeBookmarkNode[], targetId: string, newState: CheckboxState): TreeBookmarkNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        const setDescendants = (n: TreeBookmarkNode, st: CheckboxState): TreeBookmarkNode => ({
          ...n,
          selectionState: st,
          children: n.children ? n.children.map(c => setDescendants(c, st)) : undefined
        });
        return setDescendants(node, newState);
      }
      if (node.children) {
        const updatedChildren = updateCheckState(node.children, targetId, newState);
        const allChecked = updatedChildren.every(c => c.selectionState === 'checked');
        const allUnchecked = updatedChildren.every(c => c.selectionState === 'unchecked');
        const parentState = allChecked ? 'checked' : allUnchecked ? 'unchecked' : 'indeterminate';
        return {
          ...node,
          selectionState: parentState,
          children: updatedChildren
        };
      }
      return node;
    });
  }, []);

  return { updateCheckState };
};
