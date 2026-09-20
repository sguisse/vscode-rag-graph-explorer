import React from 'react';
import { X, BarChart2, Bookmark as BookmarkIcon, LayoutGrid } from 'lucide-react';
import { BookmarkTab, UserRole } from '../../types/bookmarks.types';

export interface UserProfile {
  id: string;
  name: string;
  role?: UserRole;
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  tabs?: BookmarkTab[];
  hidePrivate?: boolean;
  currentUser?: UserProfile;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  tabs = [],
}) => {
  if (!isOpen) return null;

  const totalCards = tabs.reduce((acc, tab) => acc + tab.cards.length, 0);
  const totalBookmarks = tabs.reduce(
    (acc, tab) => acc + tab.cards.reduce((cAcc, card) => cAcc + card.bookmarks.length, 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Bookmarks Analytics
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

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <LayoutGrid className="w-5 h-5 text-slate-400 mx-auto mb-1"/>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {tabs.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Tabs
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <LayoutGrid className="w-5 h-5 text-slate-400 mx-auto mb-1"/>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalCards}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Cards
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <BookmarkIcon className="w-5 h-5 text-slate-400 mx-auto mb-1"/>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalBookmarks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Bookmarks
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};