import React from 'react';
import { X, Share2, Copy } from 'lucide-react';
import { BookmarkTab } from '../../types/bookmarks.types';

interface ShareSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab?: BookmarkTab | null;
}

export const ShareSnapshotModal: React.FC<ShareSnapshotModalProps> = ({
  isOpen,
  onClose,
  tab,
}) => {
  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (tab) {
      navigator.clipboard.writeText(JSON.stringify(tab, null, 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Share Tab Snapshot
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

        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Export layout and card bookmarks for <span className="font-semibold text-slate-900 dark:text-slate-200">{tab?.name || 'Active Tab'}</span> as a JSON snapshot.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              onClick={handleCopyJson}
            >
              <Copy className="w-4 h-4"/>
              <span>Copy Tab JSON</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
