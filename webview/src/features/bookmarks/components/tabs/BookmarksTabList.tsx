import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Plus, Settings, Lock, Trash, Check, X, Layers } from 'lucide-react';
import { useBookmarksStore } from '../../store/useBookmarksStore';
import { BookmarkTab } from '../../types/bookmarks.types';

interface BookmarksTabListProps {
  onOpenTabConfig?: () => void;
  onRequestDeleteTab?: (tab: BookmarkTab) => void;
}

export const BookmarksTabList: React.FC<BookmarksTabListProps> = ({
  onOpenTabConfig = () => {},
  onRequestDeleteTab
}) => {
  const { tabs, setTabs, activeTabId, setActiveTabId, currentUser } = useBookmarksStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabNameInput, setTabNameInput] = useState('');
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [tabHoverTargetId, setTabHoverTargetId] = useState<string | null>(null);
  const [tabHoverDirection, setTabHoverDirection] = useState<'left' | 'right' | null>(null);
  const [previewTabOrder, setPreviewTabOrder] = useState<string[] | null>(null);
  const tabInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId && tabInputRef.current) {
      tabInputRef.current.focus();
      tabInputRef.current.select();
    }
  }, [editingTabId]);

  const handleSaveInlineTabName = (tabId: string) => {
    const trimmed = tabNameInput.trim();
    if (trimmed) {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, name: trimmed } : t));
    }
    setEditingTabId(null);
  };

  const handleCancelInlineTabName = () => {
    setEditingTabId(null);
  };

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isLocked) {
      e.preventDefault();
      return;
    }
    setDraggedTabId(tabId);
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTabDragOver = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTabId || draggedTabId === targetTabId) return;

    const targetTab = tabs.find(t => t.id === targetTabId);
    if (targetTab?.isLocked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isHoveringRight = (e.clientX - rect.left) > (rect.width / 2);
    const direction = isHoveringRight ? 'right' : 'left';

    setTabHoverTargetId(targetTabId);
    setTabHoverDirection(direction);

    const currentOrder = tabs.map(t => t.id);
    const dragIdx = currentOrder.indexOf(draggedTabId);
    let targetIdx = currentOrder.indexOf(targetTabId);

    if (dragIdx !== -1 && targetIdx !== -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(dragIdx, 1);

      targetIdx = newOrder.indexOf(targetTabId);
      const insertIdx = direction === 'right' ? targetIdx + 1 : targetIdx;
      newOrder.splice(insertIdx, 0, draggedTabId);
      setPreviewTabOrder(newOrder);
    }
  };

  const handleTabDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (previewTabOrder && previewTabOrder.length > 0) {
      const tabMap = new Map(tabs.map(t => [t.id, t]));
      const committedTabs = previewTabOrder.map(id => tabMap.get(id)).filter(Boolean) as BookmarkTab[];
      tabs.forEach(t => {
        if (!previewTabOrder.includes(t.id)) committedTabs.push(t);
      });
      setTabs(committedTabs);
    }

    setDraggedTabId(null);
    setTabHoverTargetId(null);
    setTabHoverDirection(null);
    setPreviewTabOrder(null);
  };

  const handleAddNewTab = () => {
    const newTab: BookmarkTab = {
      id: `tab_${Date.now()}`,
      name: 'New Tab',
      description: 'Custom workspace',
      isPrivate: false,
      owner: currentUser.id,
      isLocked: false,
      userRolePermissions: { admin: true, editor: true, viewer: true },
      style: { tabNameBackgroundColor: '#059669', tabNameTextColor: '#ffffff' },
      cards: [],
      overrides: {}
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const visibleTabs = React.useMemo(() => {
    if (!previewTabOrder || previewTabOrder.length === 0) return tabs;
    const tabMap = new Map(tabs.map(t => [t.id, t]));
    const reordered = previewTabOrder.map(id => tabMap.get(id)).filter(Boolean) as BookmarkTab[];
    tabs.forEach(t => {
      if (!previewTabOrder.includes(t.id)) reordered.push(t);
    });
    return reordered;
  }, [tabs, previewTabOrder]);

  return (
    <div className="flex-shrink-0 bg-slate-200/60 dark:bg-slate-950 px-4 pt-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <div className="flex items-center gap-1">
        {visibleTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const isBeingDragged = draggedTabId === tab.id;
          const isHoverTarget = tabHoverTargetId === tab.id;
          const isEditingThisTab = editingTabId === tab.id;
          const hasOverrides = tab.overrides && Object.keys(tab.overrides).length > 0;

          return (
            <div
              key={tab.id}
              draggable={!tab.isLocked && !isEditingThisTab}
              title={tab.isLocked ? 'Tab locked' : 'Double-click to rename tab, drag to reorder'}
              onDragStart={(e) => handleTabDragStart(e, tab.id)}
              onDragOver={(e) => handleTabDragOver(e, tab.id)}
              onDragLeave={() => {
                if (tabHoverTargetId === tab.id) {
                  setTabHoverTargetId(null);
                  setTabHoverDirection(null);
                }
              }}
              onDrop={(e) => handleTabDrop(e, tab.id)}
              onDragEnd={() => {
                setDraggedTabId(null);
                setTabHoverTargetId(null);
                setTabHoverDirection(null);
                setPreviewTabOrder(null);
              }}
              onClick={() => setActiveTabId(tab.id)}
              onDoubleClick={(e) => {
                if (!tab.isLocked) {
                  e.stopPropagation();
                  setEditingTabId(tab.id);
                  setTabNameInput(tab.name);
                }
              }}
              style={{
                backgroundColor: isActive ? (tab.style?.tabNameBackgroundColor || '#4f46e5') : undefined,
                color: isActive ? (tab.style?.tabNameTextColor || '#ffffff') : undefined
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-semibold cursor-pointer border-t border-l border-r transition-all select-none relative ${
                isBeingDragged ? 'opacity-40 scale-95' : ''
              } ${
                isHoverTarget && tabHoverDirection === 'left' ? '-translate-x-1.5 border-l-2 border-l-brand-500' : ''
              } ${
                isHoverTarget && tabHoverDirection === 'right' ? 'translate-x-1.5 border-r-2 border-r-brand-500' : ''
              } ${
                isActive
                  ? 'border-transparent shadow-xs'
                  : 'bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              {isEditingThisTab ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1"
                >
                  <input
                    ref={tabInputRef}
                    type="text"
                    value={tabNameInput}
                    onChange={(e) => setTabNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveInlineTabName(tab.id);
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelInlineTabName();
                      }
                    }}
                    onBlur={handleCancelInlineTabName}
                    className="text-xs font-semibold px-1.5 py-0.5 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 w-28 shadow-xs"
                  />
                  <button
                    type="button"
                    title="Save name"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveInlineTabName(tab.id); }}
                    className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <Check className="w-2.5 h-2.5"/>
                  </button>
                  <button
                    type="button"
                    title="Cancel edition"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelInlineTabName(); }}
                    className="p-1 rounded bg-rose-500 text-white hover:bg-rose-600"
                  >
                    <X className="w-2.5 h-2.5"/>
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1">
                  {!tab.isLocked && (
                    <span className="text-current opacity-40 hover:opacity-80 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-3 h-3"/>
                    </span>
                  )}
                  {tab.name}
                </span>
              )}

              {hasOverrides && (
                <span
                  title="This tab has custom layout overrides"
                  className="opacity-80"
                >
                  <Layers className="w-3 h-3"/>
                </span>
              )}

              {tab.isLocked && <Lock className="w-3 h-3 opacity-70"/>}

              {!tab.isLocked && tabs.length > 1 && !isEditingThisTab && (
                <button
                  type="button"
                  title="Remove Tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRequestDeleteTab) {
                      onRequestDeleteTab(tab);
                    } else {
                      setTabs(prev => prev.filter(t => t.id !== tab.id));
                    }
                  }}
                  className="p-0.5 rounded hover:bg-rose-500/30 text-inherit opacity-60 hover:opacity-100 transition-colors ml-0.5 cursor-pointer"
                >
                  <Trash className="w-3 h-3"/>
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          title="Create New Tab"
          onClick={handleAddNewTab}
          className="p-1.5 rounded-t-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Plus className="w-4 h-4"/>
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenTabConfig}
        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center gap-1 mb-1 cursor-pointer"
      >
        <Settings className="w-3 h-3"/>
        <span>
          Tab Config
        </span>
      </button>
    </div>
  );
};