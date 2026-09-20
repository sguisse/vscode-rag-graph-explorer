import React, { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { BookmarkTab } from '../../types/bookmarks.types';

interface ShareSnapshotModalProps {
  isOpen: boolean;
  tab: BookmarkTab | null;
  onClose: () => void;
}

export const ShareSnapshotModal: React.FC<ShareSnapshotModalProps> = ({ isOpen, tab, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !tab) return null;

  const shareUrl = `[https://enterprise-bookmarks.internal/share/$](https://enterprise-bookmarks.internal/share/$){tab.id}?token=${btoa(tab.name).slice(0, 10)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-500"/>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Share Snapshot: {tab.name}
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

        <div className="p-5 space-y-4 text-center">
          <div className="inline-block p-4 rounded-xl bg-white border border-slate-200 shadow-inner">
            <svg
              width="140"
              height="140"
              viewBox="0 0 100 100"
              fill="currentColor"
              className="text-slate-900"
            >
              <rect
                x="10"
                y="10"
                width="25"
                height="25"
                rx="3"
              />
              <rect
                x="15"
                y="15"
                width="15"
                height="15"
                fill="white"
              />
              <rect
                x="18"
                y="18"
                width="9"
                height="9"
              />

              <rect
                x="65"
                y="10"
                width="25"
                height="25"
                rx="3"
              />
              <rect
                x="70"
                y="15"
                width="15"
                height="15"
                fill="white"
              />
              <rect
                x="73"
                y="18"
                width="9"
                height="9"
              />

              <rect
                x="10"
                y="65"
                width="25"
                height="25"
                rx="3"
              />
              <rect
                x="15"
                y="70"
                width="15"
                height="15"
                fill="white"
              />
              <rect
                x="18"
                y="73"
                width="9"
                height="9"
              />

              <rect
                x="42"
                y="12"
                width="6"
                height="18"
              />
              <rect
                x="52"
                y="15"
                width="6"
                height="10"
              />
              <rect
                x="42"
                y="42"
                width="16"
                height="16"
              />
              <rect
                x="65"
                y="45"
                width="25"
                height="6"
              />
              <rect
                x="42"
                y="65"
                width="6"
                height="25"
              />
              <rect
                x="55"
                y="75"
                width="15"
                height="6"
              />
              <rect
                x="75"
                y="65"
                width="15"
                height="25"
              />
            </svg>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Anyone with this magic token link can access this view-only workspace snapshot.
            </p>
            <div className="mt-2 flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                readOnly
                type="text"
                value={shareUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-md flex-shrink-0 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};