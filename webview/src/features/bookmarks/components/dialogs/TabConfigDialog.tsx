import React, { useState, useEffect } from 'react';
import { Settings, Layers, X } from 'lucide-react';
import { BookmarkTab, GlobalSettings } from '../../types/bookmarks.types';

interface TabConfigDialogProps {
  isOpen: boolean;
  tab: BookmarkTab | null;
  globalSettings: GlobalSettings;
  onClose: () => void;
  onSave: (updatedTab: BookmarkTab) => void;
}

export const TabConfigDialog: React.FC<TabConfigDialogProps> = ({ isOpen, tab, globalSettings, onClose, onSave }) => {
  const [activeConfigTab, setActiveConfigTab] = useState('general');
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    isPrivate: false,
    isLocked: false,
    tabNameBackgroundColor: '#4f46e5',
    tabNameTextColor: '#ffffff',
    overrides: {}
  });

  useEffect(() => {
    if (tab) {
      setFormData({
        name: tab.name,
        description: tab.description || '',
        isPrivate: tab.isPrivate,
        isLocked: tab.isLocked,
        tabNameBackgroundColor: tab.style?.tabNameBackgroundColor || '#4f46e5',
        tabNameTextColor: tab.style?.tabNameTextColor || '#ffffff',
        overrides: tab.overrides ? JSON.parse(JSON.stringify(tab.overrides)) : {}
      });
    }
  }, [tab, isOpen]);

  if (!isOpen || !tab) return null;

  const isOverridden = (field: string) => {
    return formData.overrides && formData.overrides[field] !== undefined && formData.overrides[field] !== null;
  };

  const toggleOverride = (field: string, defaultVal: any) => {
    setFormData((prev: any) => {
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
    setFormData((prev: any) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [field]: val
      }
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
        tabNameTextColor: formData.tabNameTextColor
      },
      overrides: formData.overrides
    });
    onClose();
  };

  const activeOverrideCount = Object.keys(formData.overrides || {}).length;

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
            {activeOverrideCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-mono">
                {activeOverrideCount}
              </span>
            )}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 flex-1 overflow-y-auto space-y-4 text-sm"
        >
          {activeConfigTab === 'general' ? (
            <div className="space-y-4">
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50/70 dark:bg-brand-950/40 rounded-lg border border-brand-200/80 dark:border-brand-800/80 text-xs text-brand-800 dark:text-brand-300">
                <p className="font-semibold mb-0.5">Custom Workspace Overrides</p>
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
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(num => (
                        <option key={num} value={num}>{num} Columns</option>
                      ))}
                    </select>
                    <Layers className="w-3.5 h-3.5 text-brand-500 absolute right-2.5 top-2 pointer-events-none"/>
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
                    <span>Override Cards Collision Algorithm (cardsCollisionAlgo)</span>
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
                      <span>Compact (Flow push)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="tabCollisionAlgo"
                        checked={formData.overrides.cardsCollisionAlgo === 'Grid'}
                        onChange={() => updateOverrideValue('cardsCollisionAlgo', 'Grid')}
                      />
                      <span>Grid (Nearest-space push)</span>
                    </label>
                    <Layers className="w-3.5 h-3.5 text-brand-500 ml-auto"/>
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
                    <span className="text-xs font-mono text-brand-600 dark:text-brand-400 flex items-center gap-1">
                      {formData.overrides.rowHeight}px
                      <Layers className="w-3.5 h-3.5"/>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('gapX') || isOverridden('gapY')}
                      onChange={() => {
                        if (isOverridden('gapX') || isOverridden('gapY')) {
                          toggleOverride('gapX', globalSettings.gapX);
                          toggleOverride('gapY', globalSettings.gapY);
                        } else {
                          toggleOverride('gapX', globalSettings.gapX);
                          toggleOverride('gapY', globalSettings.gapY);
                        }
                      }}
                      className="rounded text-brand-600"
                    />
                    <span>Override Card Gaps (gap-x & gap-y)</span>
                  </label>
                  {(isOverridden('gapX') || isOverridden('gapY')) && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {(isOverridden('gapX') || isOverridden('gapY')) && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Gap X ({formData.overrides.gapX ?? globalSettings.gapX}px)</span>
                        <Layers className="w-3 h-3 text-brand-500"/>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        step="2"
                        value={formData.overrides.gapX ?? globalSettings.gapX}
                        onChange={(e) => updateOverrideValue('gapX', Number(e.target.value))}
                        className="w-full cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Gap Y ({formData.overrides.gapY ?? globalSettings.gapY}px)</span>
                        <Layers className="w-3 h-3 text-brand-500"/>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        step="2"
                        value={formData.overrides.gapY ?? globalSettings.gapY}
                        onChange={(e) => updateOverrideValue('gapY', Number(e.target.value))}
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('showGridLines')}
                      onChange={() => toggleOverride('showGridLines', globalSettings.showGridLines)}
                      className="rounded text-brand-600"
                    />
                    <span>Override Grid Background Pattern</span>
                  </label>
                  {isOverridden('showGridLines') && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {isOverridden('showGridLines') && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="tabShowGridLines"
                        checked={formData.overrides.showGridLines === true}
                        onChange={() => updateOverrideValue('showGridLines', true)}
                      />
                      <span>Always Show Grid</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="tabShowGridLines"
                        checked={formData.overrides.showGridLines === false}
                        onChange={() => updateOverrideValue('showGridLines', false)}
                      />
                      <span>Hide Grid</span>
                    </label>
                    <Layers className="w-3.5 h-3.5 text-brand-500 ml-auto"/>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('defaultCardHeaderBgColor')}
                      onChange={() => {
                        toggleOverride('defaultCardHeaderBgColor', globalSettings.defaultCardHeaderBgColor);
                        toggleOverride('defaultCardHeaderTextColor', globalSettings.defaultCardHeaderTextColor);
                      }}
                      className="rounded text-brand-600"
                    />
                    <span>Override Default Card Header Colors</span>
                  </label>
                  {isOverridden('defaultCardHeaderBgColor') && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {isOverridden('defaultCardHeaderBgColor') && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Header BG</span>
                        <Layers className="w-3 h-3 text-brand-500"/>
                      </div>
                      <input
                        type="color"
                        value={formData.overrides.defaultCardHeaderBgColor || globalSettings.defaultCardHeaderBgColor}
                        onChange={(e) => updateOverrideValue('defaultCardHeaderBgColor', e.target.value)}
                        className="w-full h-8 rounded border p-0 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Header Text</span>
                        <Layers className="w-3 h-3 text-brand-500"/>
                      </div>
                      <input
                        type="color"
                        value={formData.overrides.defaultCardHeaderTextColor || globalSettings.defaultCardHeaderTextColor}
                        onChange={(e) => updateOverrideValue('defaultCardHeaderTextColor', e.target.value)}
                        className="w-full h-8 rounded border p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isOverridden('hidePrivate')}
                      onChange={() => toggleOverride('hidePrivate', globalSettings.hidePrivate)}
                      className="rounded text-brand-600"
                    />
                    <span>Override Hide Private Entities</span>
                  </label>
                  {isOverridden('hidePrivate') && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      <Layers className="w-3 h-3"/>
                      <span>Overridden</span>
                    </span>
                  )}
                </div>
                {isOverridden('hidePrivate') && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Hide private items in this tab:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.overrides.hidePrivate)}
                        onChange={(e) => updateOverrideValue('hidePrivate', e.target.checked)}
                        className="rounded text-brand-600 w-4 h-4 cursor-pointer"
                      />
                      <Layers className="w-3.5 h-3.5 text-brand-500"/>
                    </div>
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