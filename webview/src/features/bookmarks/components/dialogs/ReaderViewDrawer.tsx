import React from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import { Bookmark } from '../../types/bookmarks.types';

interface ReaderViewDrawerProps {
  bookmark?: Bookmark | null;
  onClose: () => void;
}

export const ReaderViewDrawer: React.FC<ReaderViewDrawerProps> = ({
  bookmark,
  onClose,
}) => {
  if (!bookmark) return null;

  const handleOpenExternal = () => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400"/>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
            {bookmark.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleOpenExternal}
          >
            <ExternalLink className="w-4 h-4"/>
          </button>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {bookmark.description || 'No description provided.'}
        </p>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-500 break-all">
          {bookmark.url}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          onClick={onClose}
        >
          Close Reader
        </button>
      </div>
    </div>
  );
};