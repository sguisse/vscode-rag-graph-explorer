import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Bookmark } from '../../types/bookmarks.types';

interface BookmarkDialogProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  isUrlEditableOnly?: boolean;
  onClose: () => void;
  onSave: (bmData: any) => void;
}

export const BookmarkDialog: React.FC<BookmarkDialogProps> = ({ isOpen, bookmark, isUrlEditableOnly = false, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon: 'Globe',
    iconType: 'lucide' as any,
    tags: '',
    isPrivate: false,
    isLocked: false
  });

  useEffect(() => {
    if (bookmark) {
      setFormData({
        ...bookmark,
        tags: bookmark.tags ? bookmark.tags.join(', ') : ''
      });
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        icon: 'Globe',
        iconType: 'lucide',
        tags: '',
        isPrivate: false,
        isLocked: false
      });
    }
  }, [bookmark, isOpen]);

  if (!isOpen) return null;

  const handleAutoMetadata = () => {
    if (!formData.url) return;
    try {
      const parsed = new URL(formData.url);
      const domain = parsed.hostname.replace('www.', '');
      const guessedName = formData.name || domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
      const guessedFavicon = `[https://www.google.com/s2/favicons?domain=$](https://www.google.com/s2/favicons?domain=$){domain}&sz=64`;
      setFormData(prev => ({
        ...prev,
        name: guessedName,
        icon: guessedFavicon,
        iconType: 'url',
        description: prev.description || `Enterprise link reference to ${domain}`
      }));
    } catch (e) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags
      ? formData.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
      : [];

    onSave({
      ...formData,
      tags: tagsArray
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            {bookmark ? (isUrlEditableOnly ? 'Edit URL (Restricted)' : 'Edit Bookmark') : 'Create Bookmark'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">URL Target</label>
              <button
                type="button"
                onClick={handleAutoMetadata}
                className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3"/> Auto-fetch Metadata
              </button>
            </div>
            <input
              required
              type="text"
              placeholder="[https://example.corp](https://example.corp)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bookmark Name</label>
            <input
              required
              type="text"
              disabled={isUrlEditableOnly}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              disabled={isUrlEditableOnly}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Icon (Emoji, Lucide, URL)</label>
              <input
                type="text"
                disabled={isUrlEditableOnly}
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                disabled={isUrlEditableOnly}
                placeholder="react, docs, core"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="rounded text-brand-600"
              />
              <span>Private Link</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isLocked}
                onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                className="rounded text-brand-600"
              />
              <span>Lock Bookmark</span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
            >
              {bookmark ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
