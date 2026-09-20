import React, { useRef } from 'react';
import { Sparkles, Upload, Download, Share2, Grid, EyeOff, Folder, Lock } from 'lucide-react';
import { useBookmarksStore } from '../store/useBookmarksStore';
import { exportWorkspaceJson } from '../utils/exportImport';
import { parseNetscapeHtml } from '../utils/chromeBookmarkParser';
import { useTreeStore } from '../store/useTreeStore';
import { useGridPhysics } from '../hooks/useGridPhysics';

interface BookmarksToolBarProps {
  onAiGroup?: () => void;
  onShare?: () => void;
}

export const BookmarksToolBar: React.FC<BookmarksToolBarProps> = ({
  onAiGroup = () => {},
  onShare = () => {}
}) => {
  const { tabs, setTabs, activeTabId, globalSettings, setGlobalSettings, isSidebarOpen, toggleSidebar } = useBookmarksStore();
  const { setTreeNodes } = useTreeStore();
  const { computeCompactPositions } = useGridPhysics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const overrides = activeTab?.overrides || {};
  const effectiveCols = overrides.nbCols ?? globalSettings.nbCols;
  const effectiveRowHeight = overrides.rowHeight ?? globalSettings.rowHeight;
  const effectiveGapX = overrides.gapX ?? globalSettings.gapX;
  const effectiveGapY = overrides.gapY ?? globalSettings.gapY;
  const effectiveShowGrid = overrides.showGridLines ?? globalSettings.showGridLines;
  const effectiveHidePrivate = overrides.hidePrivate ?? globalSettings.hidePrivate;
  const effectiveAlgo = overrides.cardsCollisionAlgo ?? globalSettings.cardsCollisionAlgo;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const html = event.target?.result as string;
        if (typeof html === 'string') {
          const { nodes } = parseNetscapeHtml(html);
          if (nodes && nodes.length > 0) {
            setTreeNodes(nodes);
            if (!isSidebarOpen) toggleSidebar();
          }
        }
      } catch (err) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSwitchAlgo = (newAlgo: 'Compact' | 'Grid') => {
    setGlobalSettings({ cardsCollisionAlgo: newAlgo });
    if (newAlgo === 'Compact' && activeTab) {
      setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id !== activeTabId) return tab;
        const compactPos = computeCompactPositions(tab.cards, effectiveCols, globalSettings.nbRowsMax);
        return {
          ...tab,
          cards: tab.cards.map(c => {
            const pos = compactPos[c.id];
            return pos ? { ...c, position: { ...c.position, x: pos.x, y: pos.y } } : c;
          })
        };
      }));
    }
  };

  return (
    <div className="flex-shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-3 text-xs flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onAiGroup}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5"/>
          <span>
            AI Smart Group
          </span>
        </button>

        <button
          type="button"
          title="Import Chrome Netscape HTML bookmarks file"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 font-semibold hover:bg-brand-100 transition-colors shadow-xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5"/>
          <span>
            Import Chrome
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          onChange={handleImportFile}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => exportWorkspaceJson(globalSettings, tabs)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5"/>
          <span>
            Export JSON
          </span>
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5"/>
          <span>
            Share
          </span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        <button
          type="button"
          title={effectiveShowGrid ? 'Hide Grid Pattern' : 'Show Grid Pattern'}
          onClick={() => setGlobalSettings({ showGridLines: !effectiveShowGrid })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer ${
            effectiveShowGrid
              ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          {effectiveShowGrid ? <Grid className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
          <span>
            {effectiveShowGrid ? 'Grid Visible' : 'Grid Hidden'}
          </span>
        </button>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 font-medium">
            Cols:
          </span>
          <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
            {effectiveCols}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 font-medium">
            Row:
          </span>
          <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
            {effectiveRowHeight}px
          </span>
        </div>

        <div
          title="Horizontal and Vertical Card Spacing"
          className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
        >
          <span className="text-slate-500 font-medium">
            Gap:
          </span>
          <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
            {effectiveGapX}×{effectiveGapY}px
          </span>
        </div>

        {effectiveHidePrivate && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            <Lock className="w-3 h-3"/>
            <span>
              Private Hidden
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          title="Collision Physics Algorithm: Compact (flow push) or Grid (nearest-space slot push)"
          className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700"
        >
          <span className="text-[10px] text-slate-400 px-1 font-mono">
            Algo:
          </span>
          <button
            type="button"
            onClick={() => handleSwitchAlgo('Compact')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              effectiveAlgo === 'Compact' ? 'bg-white dark:bg-slate-900 shadow-xs text-brand-600 dark:text-brand-400' : 'text-slate-400'
            }`}
          >
            Compact
          </button>
          <button
            type="button"
            onClick={() => handleSwitchAlgo('Grid')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              effectiveAlgo === 'Grid' ? 'bg-white dark:bg-slate-900 shadow-xs text-brand-600 dark:text-brand-400' : 'text-slate-400'
            }`}
          >
            Grid
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            isSidebarOpen
              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Folder className="w-3.5 h-3.5"/>
          <span>
            Treeview
          </span>
        </button>
      </div>
    </div>
  );
};