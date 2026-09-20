import React, { useState, useMemo } from 'react';
import { TreeBookmarkNode } from '../../types/bookmarks.types';
import { TreeNodeItem } from './TreeNodeItem';
import { TreeToolbar } from './TreeToolbar';
import { useTreeSelection } from '../../hooks/useTreeSelection';

interface BookmarkTreeviewProps {
  treeNodes: TreeBookmarkNode[];
  onTreeNodesChange: (nodes: TreeBookmarkNode[]) => void;
  onImportChromeHtml: (parsed: TreeBookmarkNode[]) => void;
}

export const BookmarkTreeview: React.FC<BookmarkTreeviewProps> = ({ treeNodes, onTreeNodesChange, onImportChromeHtml }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['node_bar', 'node_eng']));
  const [importStatus, setImportStatus] = useState<{type: string, message: string} | null>(null);
  const { updateCheckState } = useTreeSelection();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCheckChange = (nodeId: string, newState: any) => {
    const updated = updateCheckState(treeNodes, nodeId, newState);
    onTreeNodesChange(updated);
  };

  const filterTreeNodes = (nodes: TreeBookmarkNode[], query: string): TreeBookmarkNode[] => {
    if (!query) return nodes;
    const q = query.toLowerCase();
    return nodes.reduce((acc, node) => {
      const nameMatches = node.name?.toLowerCase().includes(q);
      const urlMatches = node.url && node.url.toLowerCase().includes(q);
      const filteredChildren = node.children ? filterTreeNodes(node.children, query) : undefined;
      const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

      if (nameMatches || urlMatches || hasMatchingChildren) {
        acc.push({
          ...node,
          children: filteredChildren
        });
      }
      return acc;
    }, [] as TreeBookmarkNode[]);
  };

  const displayedNodes = useMemo(() => {
    return filterTreeNodes(treeNodes, searchTerm);
  }, [treeNodes, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full">
      <TreeToolbar importStatus={importStatus} onImportChromeHtml={onImportChromeHtml} searchTerm={searchTerm} setExpandedFolders={setExpandedFolders} setImportStatus={setImportStatus} setSearchTerm={setSearchTerm}/>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {displayedNodes.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {searchTerm ? 'No tree nodes match filter' : 'No bookmarks in treeview'}
          </div>
        ) : (
          displayedNodes.map(node => (
            <TreeNodeItem expandedFolders={expandedFolders} key={node.id} level={0} node={node} onNodeCheckChange={handleCheckChange} toggleFolder={toggleFolder}/>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <p className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 mb-0.5">
          💡 Drag & Drop Flattening
        </p>
        <p>
          Drag any folder or checked leaves directly onto an unlocked Card to flatten bookmarks into items with folder path tags.
        </p>
      </div>
    </div>
  );
};