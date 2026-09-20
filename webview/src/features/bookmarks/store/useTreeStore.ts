import { create } from 'zustand';
import { TreeBookmarkNode, CheckboxState } from '../types/bookmarks.types';
import initialData from '../data/initialBookmarks.json';

interface TreeStoreState {
  treeNodes: TreeBookmarkNode[];
  expandedFolders: Set<string>;
  searchTerm: string;
  setTreeNodes: (nodes: TreeBookmarkNode[]) => void;
  setSearchTerm: (term: string) => void;
  toggleFolder: (folderId: string) => void;
  expandFolders: (folderIds: string[]) => void;
  handleCheckChange: (nodeId: string, newState: CheckboxState) => void;
}

// 3-state checkbox updater recursive helper
const updateCheckState = (nodes: TreeBookmarkNode[], targetId: string, newState: CheckboxState): TreeBookmarkNode[] => {
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
};

export const useTreeStore = create<TreeStoreState>((set) => ({
  treeNodes: initialData.INITIAL_TREE_NODES as TreeBookmarkNode[],
  expandedFolders: new Set<string>(['node_bar', 'node_eng']),
  searchTerm: '',

  setTreeNodes: (nodes) => set({ treeNodes: nodes }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  toggleFolder: (folderId) => set((state) => {
    const next = new Set(state.expandedFolders);
    if (next.has(folderId)) next.delete(folderId);
    else next.add(folderId);
    return { expandedFolders: next };
  }),

  expandFolders: (folderIds) => set((state) => {
    const next = new Set(state.expandedFolders);
    folderIds.forEach(id => next.add(id));
    return { expandedFolders: next };
  }),

  handleCheckChange: (nodeId, newState) => set((state) => ({
    treeNodes: updateCheckState(state.treeNodes, nodeId, newState)
  })),
}));
