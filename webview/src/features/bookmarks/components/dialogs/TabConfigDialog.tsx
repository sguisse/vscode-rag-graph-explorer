import React, { useState, useEffect } from 'react';
import { X, Settings, Layers } from 'lucide-react';
import { BookmarkTab, GlobalSettings } from '../../types/bookmarks.types';

interface TabConfigDialogProps {
  isOpen?: boolean;
  tab?: BookmarkTab | null;
  globalSettings?: GlobalSettings;
  onClose: () => void;
  onSave: (updatedTab: BookmarkTab) => void;
}

export const TabConfigDialog: React.FC<TabConfigDialogProps> = ({
  isOpen = true,
  tab,
  globalSettings = {
    nbCols: 4,
    nbRowsMax: 10,
    rowHeight: 130,
    gapX: 16,
    gapY: 16,
    showGridLines: true,
    cardsCollisionAlgo: 'Grid',
    defaultBookmarkDisplayMode: 'compact',
    defaultCardHeaderBgColor: '#312e81',
    defaultCardHeaderTextColor: '#ffffff',
    hidePrivate: false,
  },
  onClose,
  onSave,
}) => {
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'overrides'>('general');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    isLocked: false,
    tabNameBackgroundColor: '#4f46e5',
    tabNameTextColor: '#ffffff',
    overrides: {} as Record<string, any>,
  });

  useEffect(() => {
    if (tab) {
      setFormData({
        name: tab.name || '',
        description: tab.description || '',
        isPrivate: tab.isPrivate || false,
        isLocked: tab.isLocked || false,
        tabNameBackgroundColor: tab.style?.tabNameBackgroundColor || '#4f46e5',
        tabNameTextColor: tab.style?.tabNameTextColor || '#ffffff',
        overrides: tab.overrides ? JSON.parse(JSON.stringify(tab.overrides)) : {},
      });
    }
  }, [tab, isOpen]);

  if (!isOpen || !tab) return null;

  const isOverridden = (field: string) => {
    return formData.overrides && formData.overrides[field] !== undefined && formData.overrides[field] !== null;
  };

  const toggleOverride = (field: string, defaultVal: any) => {
    setFormData((prev) => {
      const nextOverrides = { ...prev.overrides };
      if (isOverridden(field)) {
        delete nextOverrides[field];
      } else {
        nextOverrides[field] = defaultVal;
      }
      return { ...prev, overrides: nextOverrides };
    });
  };

  const updateOverrideValue = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [field]: val,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...tab,
      name: formData.name,
      description: formData.description,
      isPrivate: formData.isPrivate,
      isLocked: formData.isLocked,
      style: {
        tabNameBackgroundColor: formData.tabNameBackgroundColor,
        tabNameTextColor: formData.tabNameTextColor,
      },
      overrides: formData.overrides as Partial<GlobalSettings>,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-500"/>
            <span>Configure Tab: {tab.name}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveConfigTab('general')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeConfigTab === 'general'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveConfigTab('overrides')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeConfigTab === 'overrides'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5"/>
            <span>Layout & Overrides</span>
            {Object.keys(formData.overrides || {}).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-mono">
                {Object.keys(formData.overrides).length}
              </span>
            )}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 flex-1 overflow-y-auto space-y-4 text-sm"
        >
          {activeConfigTab === 'general' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tab Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tab Header Color
                  </label>
                  <input
                    type="color"
                    value={formData.tabNameBackgroundColor}
                    onChange={(e) => setFormData({ ...formData, tabNameBackgroundColor: e.target.value })}
                    className="w-full h-8 rounded border p-0 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tab Text Color
                  </label>
                  <input
                    type="color"
                    value={formData.tabNameTextColor}
                    onChange={(e) => setFormData({ ...formData, tabNameTextColor: e.target.value })}
                    className="w-full h-8 rounded border p-0 cursor-pointer"
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
                  <span>Private Tab</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isLocked}
                    onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                    className="rounded text-brand-600"
                  />
                  <span>Lock Entire Tab</span>
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50/70 dark:bg-brand-950/40 rounded-lg border border-brand-200/80 dark:border-brand-800/80 text-xs text-brand-800 dark:text-brand-300">
                <p className="font-semibold mb-0.5">
                  Custom Workspace Overrides
                </p>
                <p className="text-[11px] opacity-90">
                  Override global layout, grid physics, and default color styling strictly for this tab.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('nbCols')}
                      onChange={() => toggleOverride('nbCols', globalSettings.nbCols)}
                      className="rounded text-brand-600"
                    />
                    <span>Override Grid Columns</span>
                  </label>
                  {isOverridden('nbCols') && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {isOverridden('nbCols') && (
                  <div className="relative">
                    <select
                      value={formData.overrides.nbCols}
                      onChange={(e) => updateOverrideValue('nbCols', Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pr-8"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                        <option
                          key={num}
                          value={num}
                        >
                          {num} Columns
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('cardsCollisionAlgo')}
                      onChange={() => toggleOverride('cardsCollisionAlgo', globalSettings.cardsCollisionAlgo || 'Grid')}
                      className="rounded text-brand-600"
                    />
                    <span>Override Collision Algorithm</span>
                  </label>
                  {isOverridden('cardsCollisionAlgo') && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {isOverridden('cardsCollisionAlgo') && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="tabCollisionAlgo"
                        checked={formData.overrides.cardsCollisionAlgo === 'Compact'}
                        onChange={() => updateOverrideValue('cardsCollisionAlgo', 'Compact')}
                      />
                      <span>Compact</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="tabCollisionAlgo"
                        checked={formData.overrides.cardsCollisionAlgo === 'Grid'}
                        onChange={() => updateOverrideValue('cardsCollisionAlgo', 'Grid')}
                      />
                      <span>Grid</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('rowHeight')}
                      onChange={() => toggleOverride('rowHeight', globalSettings.rowHeight)}
                      className="rounded text-brand-600"
                    />
                    <span>Override Row Height ({isOverridden('rowHeight') ? formData.overrides.rowHeight : globalSettings.rowHeight}px)</span>
                  </label>
                  {isOverridden('rowHeight') && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {isOverridden('rowHeight') && (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="100"
                      max="360"
                      step="10"
                      value={formData.overrides.rowHeight}
                      onChange={(e) => updateOverrideValue('rowHeight', Number(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};