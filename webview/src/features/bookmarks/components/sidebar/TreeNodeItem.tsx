import React, { memo } from 'react';
import { ChevronRight, ChevronDown, Check, Folder, FolderOpen } from 'lucide-react';
import { TreeBookmarkNode, CheckboxState } from '../../types/bookmarks.types';
import { IconRenderer } from '../IconRenderer';

interface TreeNodeItemProps {
  node: TreeBookmarkNode;
  level?: number;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  onNodeCheckChange: (id: string, state: CheckboxState) => void;
}

export const TreeNodeItem = memo(({
  node,
  level = 0,
  expandedFolders,
  toggleFolder,
  onNodeCheckChange
}: TreeNodeItemProps) => {
  const isFolder = Boolean(node.children && node.children.length >= 0);
  const isExpanded = expandedFolders.has(node.id);

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState: CheckboxState = node.selectionState === 'checked' ? 'unchecked' : 'checked';
    onNodeCheckChange(node.id, nextState);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/bookmark-tree-node', JSON.stringify(node));
  };

  return (
    <div className="text-xs select-none">
      <div
        draggable={true}
        onDragStart={handleDragStart}
        onClick={() => isFolder && toggleFolder(node.id)}
        style={{ paddingLeft: `${level * 16 + 6}px` }}
        className="flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer group"
      >
        {isFolder ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFolder(node.id); }}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <button
          type="button"
          onClick={handleCheckClick}
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
            node.selectionState === 'checked'
              ? 'bg-brand-600 border-brand-600 text-white'
              : node.selectionState === 'indeterminate'
              ? 'bg-brand-100 dark:bg-brand-950 border-brand-500 text-brand-600'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
          }`}
        >
          {node.selectionState === 'checked' && <Check className="w-2.5 h-2.5 stroke-[3]"/>}
          {node.selectionState === 'indeterminate' && <div className="w-2 h-0.5 bg-brand-600 rounded" />}
        </button>

        <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">
          {isFolder ? (
            isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-amber-500"/> : <Folder className="w-3.5 h-3.5 text-amber-500"/>
          ) : (
            <IconRenderer className="w-3.5 h-3.5" icon={node.icon} iconType={node.iconType}/>
          )}
        </span>

        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
          {node.name}
        </span>
      </div>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onNodeCheckChange={onNodeCheckChange}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNodeItem.displayName = 'TreeNodeItem';
