import React from 'react';
import { BarChart2, X } from 'lucide-react';
import { BookmarkTab } from '../types/bookmarks.types';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  tabs: BookmarkTab[];
  onClose: () => void;
  hidePrivate?: boolean;
  currentUser: any;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, tabs, onClose, hidePrivate = false, currentUser }) => {
  if (!isOpen) return null;

  let totalBookmarks = 0;
  let healthyCount = 0;
  let brokenCount = 0;
  let totalClicks = 0;
  const tagFrequency: Record<string, number> = {};

  tabs.forEach(tab => {
    if (hidePrivate && tab.isPrivate) return;
    if (tab.isPrivate && currentUser && tab.owner !== currentUser.id) return;
    tab.cards.forEach(card => {
      if (hidePrivate && card.isPrivate) return;
      if (card.isPrivate && currentUser && card.owner !== currentUser.id) return;
      card.bookmarks.forEach(bm => {
        if (hidePrivate && bm.isPrivate) return;
        if (bm.isPrivate && currentUser && bm.owner !== currentUser.id) return;
        totalBookmarks++;
        if (bm.healthStatus === 'healthy') healthyCount++;
        if (bm.healthStatus === 'broken') brokenCount++;
        totalClicks += (bm.clickCount || 0);
        if (bm.tags) {
          bm.tags.forEach(t => {
            tagFrequency[t] = (tagFrequency[t] || 0) + 1;
          });
        }
      });
    });
  });

  const topTags = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500"/>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Link Health & Telemetry Analytics</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4"/></button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Links</span>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalBookmarks}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Healthy</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{healthyCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-rose-500 uppercase font-semibold">Broken</span>
              <p className="text-2xl font-bold text-rose-500 mt-1">{brokenCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-brand-500 uppercase font-semibold">Total Clicks</span>
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">{totalClicks}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Most Popular Tags</h4>
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span>#{tag}</span>
                  <span className="text-[10px] bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-1 rounded-full">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
