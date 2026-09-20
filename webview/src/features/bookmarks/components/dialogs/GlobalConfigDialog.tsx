import React, { useState, useEffect } from 'react';
import { Sliders, X, Lock } from 'lucide-react';
import { GlobalSettings } from '../../types/bookmarks.types';

interface GlobalConfigDialogProps {
  isOpen: boolean;
  settings: GlobalSettings;
  onClose: () => void;
  onSave: (newSettings: GlobalSettings) => void;
}

export const GlobalConfigDialog: React.FC<GlobalConfigDialogProps> = ({ isOpen, settings, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);

  useEffect(() => {
    if (settings) setLocalSettings({ ...settings });
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-500"/>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Global Workspace Parameters
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

        <form
          onSubmit={handleSave}
          className="p-5 space-y-4 text-sm max-h-[75vh] overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grid Columns (nbCols)
              </label>
              <select
                value={localSettings.nbCols}
                onChange={(e) => setLocalSettings({ ...localSettings, nbCols: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              >
                {[2, 3, 4, 5, 6, 8, 10, 12].map(num => (
                  <option key={num} value={num}>{num} Columns</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Max Rows (nbRowsMax)
              </label>
              <select
                value={localSettings.nbRowsMax}
                onChange={(e) => setLocalSettings({ ...localSettings, nbRowsMax: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              >
                {[4, 6, 8, 10, 12, 16, 20, 24, 30].map(num => (
                  <option key={num} value={num}>{num} Rows</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Row Height ({localSettings.rowHeight}px)
              </label>
              <span className="text-[11px] font-mono text-slate-400">100px - 360px</span>
            </div>
            <input
              type="range"
              min="100"
              max="360"
              step="10"
              value={localSettings.rowHeight}
              onChange={(e) => setLocalSettings({ ...localSettings, rowHeight: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Default Cards Collision Algorithm (cardsCollisionAlgo)
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="globalCardsCollisionAlgo"
                  value="Compact"
                  checked={localSettings.cardsCollisionAlgo === 'Compact'}
                  onChange={() => setLocalSettings({ ...localSettings, cardsCollisionAlgo: 'Compact' })}
                />
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">Compact</span>
                  <span className="text-[10px] text-slate-400">Sequential flow auto-packing and displacement.</span>
                </div>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="globalCardsCollisionAlgo"
                  value="Grid"
                  checked={localSettings.cardsCollisionAlgo === 'Grid'}
                  onChange={() => setLocalSettings({ ...localSettings, cardsCollisionAlgo: 'Grid' })}
                />
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">Grid</span>
                  <span className="text-[10px] text-slate-400">Freeform slots; pushes collisions to nearest free space.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Card Gap X ({localSettings.gapX ?? 16}px)
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="2"
                value={localSettings.gapX ?? 16}
                onChange={(e) => setLocalSettings({ ...localSettings, gapX: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Horizontal spacing</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Card Gap Y ({localSettings.gapY ?? 16}px)
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="2"
                value={localSettings.gapY ?? 16}
                onChange={(e) => setLocalSettings({ ...localSettings, gapY: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Vertical spacing</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Grid Background Visibility
              </span>
              <span className="text-[11px] text-slate-400">
                Display explicit column and row grid cells on canvas
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.showGridLines}
              onChange={(e) => setLocalSettings({ ...localSettings, showGridLines: e.target.checked })}
              className="rounded text-brand-600 w-4 h-4 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Default View Mode
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="globalViewMode"
                  value="compact"
                  checked={localSettings.defaultViewMode === 'compact'}
                  onChange={() => setLocalSettings({ ...localSettings, defaultViewMode: 'compact' })}
                />
                <span>Compact Mode</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="globalViewMode"
                  value="grid"
                  checked={localSettings.defaultViewMode === 'grid'}
                  onChange={() => setLocalSettings({ ...localSettings, defaultViewMode: 'grid' })}
                />
                <span>Grid Mode</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Card Header BG
              </label>
              <input
                type="color"
                value={localSettings.defaultCardHeaderBgColor}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultCardHeaderBgColor: e.target.value })}
                className="w-full h-8 rounded border p-0 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Card Header Text
              </label>
              <input
                type="color"
                value={localSettings.defaultCardHeaderTextColor}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultCardHeaderTextColor: e.target.value })}
                className="w-full h-8 rounded border p-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5"/>
                Hide Private Entities
              </span>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                Omit private cards, bookmarks, and tabs completely from UI
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.hidePrivate}
              onChange={(e) => setLocalSettings({ ...localSettings, hidePrivate: e.target.checked })}
              className="rounded text-amber-600 w-4 h-4 cursor-pointer"
            />
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
              Apply Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};