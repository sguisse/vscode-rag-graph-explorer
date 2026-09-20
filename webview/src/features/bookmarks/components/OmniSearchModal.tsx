import React, { useState, useEffect } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { BookmarkTab, Bookmark } from '../types/bookmarks.types';
import { IconRenderer } from './IconRenderer';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: BookmarkTab[];
  onSelectBookmark: (bm: Bookmark) => void;
  hidePrivate?: boolean;
  currentUser: any;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({ isOpen, onClose, tabs, onSelectBookmark, hidePrivate = false, currentUser }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allBookmarks: (Bookmark & { tabName: string, cardName: string })[] = [];
  tabs.forEach(tab => {
    if (hidePrivate && tab.isPrivate) return;
    if (tab.isPrivate && currentUser && tab.owner !== currentUser.id) return;
    tab.cards.forEach(card => {
      if (hidePrivate && card.isPrivate) return;
      if (card.isPrivate && currentUser && card.owner !== currentUser.id) return;
      card.bookmarks.forEach(bm => {
        if (hidePrivate && bm.isPrivate) return;
        if (bm.isPrivate && currentUser && bm.owner !== currentUser.id) return;
        allBookmarks.push({
          ...bm,
          tabName: tab.name,
          cardName: card.name
        });
      });
    });
  });

  const results = allBookmarks.filter(bm => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      bm.name.toLowerCase().includes(q) ||
      bm.url.toLowerCase().includes(q) ||
      (bm.description && bm.description.toLowerCase().includes(q)) ||
      bm.tabName.toLowerCase().includes(q) ||
      bm.cardName.toLowerCase().includes(q) ||
      (bm.tags && bm.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400"/>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all bookmarks, cards, tags, and tabs... (Esc to close)"
            className="w-full text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No bookmarks matching "{query}"
            </div>
          ) : (
            results.map(bm => (
              <div
                key={bm.id}
                onClick={() => {
                  onSelectBookmark(bm);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700">
                    <IconRenderer className="w-5 h-5" icon={bm.icon} iconType={bm.iconType}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {bm.name}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {bm.tabName} › {bm.cardName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono">
                      {bm.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Enter</kbd> to open</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Esc</kbd> to dismiss</span>
          </div>
          <span>{results.length} total indexed matches</span>
        </div>
      </div>
    </div>
  );
};
