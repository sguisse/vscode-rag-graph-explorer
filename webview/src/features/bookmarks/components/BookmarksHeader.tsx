import React, { useEffect } from 'react';
import { Globe, Search, EyeOff, Eye, Sliders, User, BarChart2, Sun, Moon, Maximize2, History, Copy } from 'lucide-react';
import { useBookmarksStore } from '../store/useBookmarksStore';
import initialData from '../data/initialBookmarks.json';
import { User as UserType } from '../types/bookmarks.types';

interface BookmarksHeaderProps {
  onOpenGlobalConfig?: () => void;
  onOpenOmniSearch?: () => void;
  onOpenAnalytics?: () => void;
  onOpenAuditHistory?: () => void;
  onOpenDuplicateResolver?: () => void;
}

export const BookmarksHeader: React.FC<BookmarksHeaderProps> = ({
  onOpenGlobalConfig = () => {},
  onOpenOmniSearch = () => {},
  onOpenAnalytics = () => {},
  onOpenAuditHistory = () => {},
  onOpenDuplicateResolver = () => {},
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    toggleZenMode,
    globalSettings,
    setGlobalSettings,
    currentUser,
    setCurrentUser
  } = useBookmarksStore();

  const users = initialData.INITIAL_USERS as UserType[];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <header className="flex-shrink-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
          <Globe className="w-5 h-5"/>
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Enterprise Bookmark Platform
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
              v4.4 PROD
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            2D Grid Physics • Netscape Integration • WCAG AA
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenOmniSearch}
        className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-72 cursor-pointer"
      >
        <Search className="w-3.5 h-3.5"/>
        <span className="flex-1 text-left">
          Cmd+K Omni-Search...
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          title={globalSettings.hidePrivate ? "Private elements are hidden. Click to show." : "Private elements are visible. Click to hide."}
          onClick={() => setGlobalSettings({ hidePrivate: !globalSettings.hidePrivate })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            globalSettings.hidePrivate
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 shadow-inner'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          {globalSettings.hidePrivate ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"/>
              <span className="hidden sm:inline">
                Private Hidden
              </span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"/>
              <span className="hidden sm:inline">
                Private Visible
              </span>
            </>
          )}
        </button>

        <button
          type="button"
          title="Configure Global Workspace Parameters"
          onClick={onOpenGlobalConfig}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 font-medium text-xs border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5"/>
          <span className="hidden sm:inline">
            Global Config
          </span>
        </button>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <User className="w-4 h-4 text-brand-500"/>
          <select
            value={currentUser?.id}
            onChange={(e) => {
              const u = users.find(usr => usr.id === e.target.value);
              if (u) setCurrentUser(u);
            }}
            className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option
                key={u.id}
                value={u.id}
              >
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          title="Audit Log History"
          onClick={onOpenAuditHistory}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <History className="w-4 h-4"/>
        </button>

        <button
          type="button"
          title="Find Duplicates"
          onClick={onOpenDuplicateResolver}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Copy className="w-4 h-4"/>
        </button>

        <button
          type="button"
          title="Telemetry & Health Metrics"
          onClick={onOpenAnalytics}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <BarChart2 className="w-4 h-4"/>
        </button>

        <button
          type="button"
          title="Toggle Theme"
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
        </button>

        <button
          type="button"
          title="Zen Canvas Mode"
          onClick={toggleZenMode}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4"/>
        </button>
      </div>
    </header>
  );
};