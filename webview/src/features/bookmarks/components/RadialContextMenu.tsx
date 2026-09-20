import React from 'react';
import { BookOpen, Copy, Edit, Trash } from 'lucide-react';
import { Bookmark } from '../types/bookmarks.types';
import { IconRenderer } from './IconRenderer';

interface RadialContextMenuProps {
  position: { x: number; y: number } | null;
  bookmark: Bookmark;
  onClose: () => void;
  onAction: (actionKey: string, bm: Bookmark) => void;
}

export const RadialContextMenu: React.FC<RadialContextMenuProps> = ({ position, bookmark, onClose, onAction }) => {
  if (!position) return null;

  const actions = [
    { key: 'read', label: 'Reader', icon: BookOpen, color: 'hover:bg-indigo-500 hover:text-white' },
    { key: 'copy', label: 'Copy', icon: Copy, color: 'hover:bg-emerald-500 hover:text-white' },
    { key: 'edit', label: 'Edit', icon: Edit, color: 'hover:bg-blue-500 hover:text-white' },
    { key: 'delete', label: 'Delete', icon: Trash, color: 'hover:bg-rose-500 hover:text-white' },
  ];

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-90 duration-150"
      style={{ left: position.x, top: position.y }}
      onMouseLeave={onClose}
    >
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-slate-900/60 dark:bg-black/80 backdrop-blur-md border border-slate-700 shadow-2xl"></div>

        <div className="relative z-10 w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shadow-inner">
          <IconRenderer className="w-4 h-4" icon={bookmark.icon} iconType={bookmark.iconType}/>
        </div>

        {actions.map((act, i) => {
          const angles = [-90, 0, 90, 180];
          const rad = (angles[i] * Math.PI) / 180;
          const radius = 40;
          const x = Math.round(Math.cos(rad) * radius);
          const y = Math.round(Math.sin(rad) * radius);

          const ActionIcon = act.icon;
          return (
            <button
              key={act.key}
              onClick={(e) => {
                e.stopPropagation();
                onAction(act.key, bookmark);
                onClose();
              }}
              title={act.label}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className={`absolute z-20 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 flex items-center justify-center shadow-lg transition-all transform hover:scale-125 active:scale-95 ${act.color}`}
            >
              <ActionIcon className="w-3.5 h-3.5"/>
            </button>
          );
        })}
      </div>
    </div>
  );
};
