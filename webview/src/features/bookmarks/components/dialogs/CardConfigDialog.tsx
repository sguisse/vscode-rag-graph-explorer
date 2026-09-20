import React, { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import { BookmarkCard } from '../../types/bookmarks.types';

interface CardConfigDialogProps {
  isOpen: boolean;
  card: BookmarkCard | null;
  onClose: () => void;
  onSave: (updatedCard: BookmarkCard) => void;
}

export const CardConfigDialog: React.FC<CardConfigDialogProps> = ({
  isOpen,
  card,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'selfLocks' | 'bmLocks' | 'appearance'>('general');
  const [formData, setFormData] = useState<BookmarkCard | null>(null);

  useEffect(() => {
    if (card) {
      setFormData(JSON.parse(JSON.stringify(card)));
    }
  }, [card]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const selfLocks = formData.locks.cardLocks;
  const bmLocks = formData.locks.bookmarkLocks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-500"/>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Configure Card: {formData.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold">
          {[
            { id: 'general', label: 'General' },
            { id: 'selfLocks', label: 'Card Self-Locks' },
            { id: 'bmLocks', label: 'Bookmark Locks' },
            { id: 'appearance', label: 'Appearance' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`py-2.5 px-3 border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 flex-1 max-h-[420px] overflow-y-auto space-y-4 text-sm">
          {activeTab === 'general' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Card Name
                </label>
                <input
                  type="text"
                  disabled={selfLocks.lockedName}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
                />
                {selfLocks.lockedName && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    Card renaming is locked by policy.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bookmark Rows Display (bookmarkDisplayMode)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      (formData.bookmarkDisplayMode || 'compact') === 'compact'
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cardBookmarkDisplayMode"
                      value="compact"
                      checked={(formData.bookmarkDisplayMode || 'compact') === 'compact'}
                      onChange={() => setFormData({ ...formData, bookmarkDisplayMode: 'compact' })}
                      className="rounded text-brand-600"
                    />
                    <div>
                      <div className="text-xs font-semibold">
                        Compact (Default)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Only bookmark name is shown; URL in tooltip.
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.bookmarkDisplayMode === 'details'
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cardBookmarkDisplayMode"
                      value="details"
                      checked={formData.bookmarkDisplayMode === 'details'}
                      onChange={() => setFormData({ ...formData, bookmarkDisplayMode: 'details' })}
                      className="rounded text-brand-600"
                    />
                    <div>
                      <div className="text-xs font-semibold">
                        Details
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Shows name, description, and tags; URL in tooltip.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cardPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="rounded text-brand-600"
                />
                <label
                  htmlFor="cardPrivate"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Private Card (Only visible to you)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'selfLocks' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Enforce container-level lock restrictions on canvas interactions:
              </p>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={selfLocks.lockedPosition}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      cardLocks: { ...selfLocks, lockedPosition: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Lock Position
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prevents 2D canvas drag & reorder displacements.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={selfLocks.lockedSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      cardLocks: { ...selfLocks, lockedSize: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Lock Size
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Disables bottom-right corner and edge resize handles.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={selfLocks.lockedName}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      cardLocks: { ...selfLocks, lockedName: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Lock Name
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prevents renaming the card.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={selfLocks.lockedDeletion}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      cardLocks: { ...selfLocks, lockedDeletion: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Lock Deletion
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prevents removing this card container from the active tab.
                  </div>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'bmLocks' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Enforce inner bookmark behavior rules inside this container:
              </p>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={bmLocks.addable}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      bookmarkLocks: { ...bmLocks, addable: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Allow Adding
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Accepts '+' button, external drag-and-drop links, and paste actions.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={bmLocks.removable}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      bookmarkLocks: { ...bmLocks, removable: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Allow Removing
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Enables red trash button on bookmark row hover.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={bmLocks.editable}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      bookmarkLocks: { ...bmLocks, editable: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Allow Editing
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Enables edit button on bookmark row hover.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={bmLocks.urlEditableOnly}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      bookmarkLocks: { ...bmLocks, urlEditableOnly: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    URL Editable Only
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Restricts bookmark edit dialog strictly to URL changes; names/descriptions remain locked.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={bmLocks.reorderable}
                  onChange={(e) => setFormData({
                    ...formData,
                    locks: {
                      ...formData.locks,
                      bookmarkLocks: { ...bmLocks, reorderable: e.target.checked }
                    }
                  })}
                  className="mt-0.5 rounded text-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold">
                    Allow Reordering
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Permits sorting bookmarks within the card via drag-and-drop.
                  </div>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Header Background
                  </label>
                  <input
                    type="color"
                    value={formData.headerStyle?.backgroundColor || '#312e81'}
                    onChange={(e) => setFormData({
                      ...formData,
                      headerStyle: { ...formData.headerStyle, backgroundColor: e.target.value }
                    })}
                    className="w-full h-8 rounded border p-0 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Header Text Color
                  </label>
                  <input
                    type="color"
                    value={formData.headerStyle?.textColor || '#ffffff'}
                    onChange={(e) => setFormData({
                      ...formData,
                      headerStyle: { ...formData.headerStyle, textColor: e.target.value }
                    })}
                    className="w-full h-8 rounded border p-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Border Style
                  </label>
                  <select
                    value={formData.contentStyle?.borderStyle || 'solid'}
                    onChange={(e) => setFormData({
                      ...formData,
                      contentStyle: { ...formData.contentStyle, borderStyle: e.target.value as any }
                    })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={formData.contentStyle?.borderColor || '#4f46e5'}
                    onChange={(e) => setFormData({
                      ...formData,
                      contentStyle: { ...formData.contentStyle, borderColor: e.target.value }
                    })}
                    className="w-full h-8 rounded border p-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};