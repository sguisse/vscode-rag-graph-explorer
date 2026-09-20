import React, { useState, useEffect } from 'react';
import { X, Bookmark as BookmarkIcon } from 'lucide-react';
import { Bookmark } from '../../types/bookmarks.types';

interface BookmarkDialogProps {
  isOpen: boolean;
  bookmark?: Bookmark | null;
  cardId?: string | null;
  isUrlEditableOnly?: boolean;
  onClose: () => void;
  onSave: (bookmark: Bookmark) => void;
}

export const BookmarkDialog: React.FC<BookmarkDialogProps> = ({
  isOpen,
  bookmark,
  isUrlEditableOnly = false,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (bookmark) {
      setName(bookmark.name || '');
      setUrl(bookmark.url || '');
    } else {
      setName('');
      setUrl('');
    }
  }, [bookmark]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: bookmark?.id || `bm_${Date.now()}`,
      name: name || 'New Bookmark',
      description: bookmark?.description || '',
      url,
      icon: bookmark?.icon || 'Globe',
      iconType: bookmark?.iconType || 'lucide',
      tags: bookmark?.tags || [],
      isPrivate: bookmark?.isPrivate || false,
      isLocked: bookmark?.isLocked || false,
      healthStatus: bookmark?.healthStatus || 'healthy',
      clickCount: bookmark?.clickCount || 0,
      owner: bookmark?.owner || 'user-1',
      createdAt: bookmark?.createdAt || Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-brand-600 dark:text-brand-400"/>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
            </h2>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        {!isUrlEditableOnly && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bookmark Title
            </label>
            <input
              type="text"
              value={name}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onChange={handleNameChange}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            URL
          </label>
          <input
            type="text"
            value={url}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            onChange={handleUrlChange}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};