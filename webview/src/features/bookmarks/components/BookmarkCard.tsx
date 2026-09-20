import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Search, GripVertical, Lock, Plus, Settings, Trash, Check, X } from 'lucide-react';
import { BookmarkCard as CardType, Bookmark } from '../types/bookmarks.types';
import { BookmarkItem } from './BookmarkItem';
import { IconRenderer } from './IconRenderer';

interface BookmarkCardProps {
  card: CardType;
  currentUser: any;
  onEditCard: (card: CardType) => void;
  onDeleteCard: (card: CardType) => void;
  onAddBookmark: (cardId: string) => void;
  onEditBookmark: (cardId: string, bookmark: Bookmark) => void;
  onDeleteBookmark: (cardId: string, bookmarkId: string) => void;
  onOpenReader: (bm: Bookmark) => void;
  onCopyBookmark: (bm: Bookmark) => void;
  onDropLinkOntoCard: (cardId: string, payload: any, type: 'uri' | 'tree') => void;
  onMoveOrCopyBookmark: (sourceCardId: string, targetCardId: string, bookmarkId: string, isCopy: boolean) => void;
  isSelected: boolean;
  onSelectCard: (e: React.MouseEvent, cardId: string) => void;
  onCardPositionChange: (cardId: string, x: number, y: number) => void;
  onCardSizeChange: (cardId: string, w: number, h: number) => void;
  cardsCollisionAlgo: 'Grid' | 'Compact';
  gridCols?: number;
  gridRows?: number;
  rowHeight?: number;
  gapX?: number;
  gapY?: number;
  defaultHeaderBg?: string;
  defaultHeaderTextColor?: string;
  onCardDragStart: (cardId: string) => void;
  onCardDragEnd: () => void;
  onCardDragOverCard: (cardId: string) => void;
  onCardDragLeaveCard: (cardId: string) => void;
  onCardDropOnCard: (fromCardId: string, toCardId: string) => void;
  isDropTarget?: boolean;
  canvasContainerRef?: React.RefObject<HTMLDivElement | null>;
  isCmdPressed?: boolean;
  isBeingDragged?: boolean;
  hidePrivate?: boolean;
}

export const BookmarkCard = memo(({
  card,
  currentUser,
  onEditCard,
  onDeleteCard,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onOpenReader,
  onCopyBookmark,
  onDropLinkOntoCard,
  onMoveOrCopyBookmark,
  isSelected,
  onSelectCard,
  onCardPositionChange,
  onCardSizeChange,
  cardsCollisionAlgo,
  gridCols = 4,
  gridRows = 8,
  rowHeight = 130,
  gapX = 16,
  gapY = 16,
  defaultHeaderBg = '#312e81',
  defaultHeaderTextColor = '#ffffff',
  onCardDragStart,
  onCardDragEnd,
  onCardDragOverCard,
  onCardDragLeaveCard,
  onCardDropOnCard,
  isDropTarget = false,
  canvasContainerRef,
  isCmdPressed = false,
  isBeingDragged = false,
  hidePrivate = false
}: BookmarkCardProps) => {
  const [filterTerm, setFilterTerm] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<Set<string>>(new Set());
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(card.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameInputValue(card.name);
  }, [card.name]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveInlineName = () => {
    const trimmed = nameInputValue.trim();
    if (trimmed && trimmed !== card.name) {
      onEditCard({ ...card, name: trimmed });
    } else {
      setNameInputValue(card.name);
    }
    setIsEditingName(false);
  };

  const handleCancelInlineName = () => {
    setNameInputValue(card.name);
    setIsEditingName(false);
  };

  const selfLocks = card.locks.cardLocks;
  const bmLocks = card.locks.bookmarkLocks;
  const isCardDraggable = !selfLocks.lockedPosition;
  const isCardResizable = !selfLocks.lockedSize;

  const accessibleBookmarks = useMemo(() => {
    return card.bookmarks.filter(bm => {
      if (hidePrivate && bm.isPrivate) return false;
      if (bm.isPrivate && bm.owner !== currentUser.id) return false;
      return true;
    });
  }, [card.bookmarks, hidePrivate, currentUser.id]);

  const filteredBookmarks = useMemo(() => {
    return accessibleBookmarks.filter(bm => {
      if (!filterTerm) return true;
      const term = filterTerm.toLowerCase();
      return (
        bm.name.toLowerCase().includes(term) ||
        bm.url.toLowerCase().includes(term) ||
        (bm.description && bm.description.toLowerCase().includes(term)) ||
        (bm.tags && bm.tags.some(t => t.toLowerCase().includes(term)))
      );
    });
  }, [accessibleBookmarks, filterTerm]);

  const healthRatio = useMemo(() => {
    if (!accessibleBookmarks.length) return 100;
    const healthy = accessibleBookmarks.filter(b => b.healthStatus === 'healthy').length;
    return Math.round((healthy / accessibleBookmarks.length) * 100);
  }, [accessibleBookmarks]);

  const handleBookmarkSelect = (e: React.MouseEvent, bId: string) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedBookmarkIds(prev => {
        const next = new Set(prev);
        if (next.has(bId)) next.delete(bId);
        else next.add(bId);
        return next;
      });
    } else {
      setSelectedBookmarkIds(new Set([bId]));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cardDragPayload = e.dataTransfer.types.includes('application/x-bookmark-card-id');
    if (cardDragPayload) {
      onCardDragOverCard(card.id);
      return;
    }

    if (bmLocks.addable) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    onCardDragLeaveCard(card.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const draggedCardId = e.dataTransfer.getData('application/x-bookmark-card-id');
    if (draggedCardId && draggedCardId !== card.id) {
      onCardDropOnCard(draggedCardId, card.id);
      return;
    }

    if (!bmLocks.addable) return;

    const bookmarkItemRaw = e.dataTransfer.getData('application/x-bookmark-item');
    if (bookmarkItemRaw) {
      try {
        const { bookmarkId, sourceCardId } = JSON.parse(bookmarkItemRaw);
        const isCopyAction = e.ctrlKey || e.metaKey || isCmdPressed;
        onMoveOrCopyBookmark(sourceCardId, card.id, bookmarkId, isCopyAction);
        return;
      } catch (err) {}
    }

    const treeDataJson = e.dataTransfer.getData('application/bookmark-tree-node');
    if (treeDataJson) {
      try {
        const treeNode = JSON.parse(treeDataJson);
        onDropLinkOntoCard(card.id, treeNode, 'tree');
        return;
      } catch (err) {}
    }

    const uriList = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (uriList && (uriList.startsWith('http://') || uriList.startsWith('https://') || uriList.startsWith('file://'))) {
      onDropLinkOntoCard(card.id, { url: uriList }, 'uri');
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isCardResizable) return;
    e.preventDefault();
    e.stopPropagation();

    const canvasEl = canvasContainerRef?.current || cardContainerRef.current?.parentElement;
    const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : { width: 1200, height: 800 };
    const colWidthPx = (canvasRect.width - (gridCols - 1) * gapX) / gridCols;
    const rowHeightPx = rowHeight + gapY;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = card.position.w;
    const initialH = card.position.h || 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const addCols = Math.round(deltaX / (colWidthPx + gapX));
      const addRows = Math.round(deltaY / rowHeightPx);

      const newW = Math.max(1, Math.min(gridCols, initialW + addCols));
      const newH = Math.max(1, Math.min(gridRows, initialH + addRows));

      if (newW !== card.position.w || newH !== card.position.h) {
        onCardSizeChange(card.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleVerticalResizeStart = (e: React.MouseEvent) => {
    if (!isCardResizable) return;
    e.preventDefault();
    e.stopPropagation();

    const rowHeightPx = rowHeight + gapY;
    const startY = e.clientY;
    const initialH = card.position.h || 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const addRows = Math.round(deltaY / rowHeightPx);
      const newH = Math.max(1, Math.min(gridRows, initialH + addRows));

      if (newH !== card.position.h) {
        onCardSizeChange(card.id, card.position.w, newH);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const posX = card.position?.x ?? 0;
  const posY = card.position?.y ?? 0;
  const spanW = Math.min(card.position?.w || 2, gridCols);
  const spanH = card.position?.h || 2;

  return (
    <div
      ref={cardContainerRef}
      onClick={(e) => onSelectCard(e, card.id)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        gridColumn: `${posX + 1} / span ${spanW}`,
        gridRow: `${posY + 1} / span ${spanH}`,
        minHeight: `${spanH * rowHeight + (spanH - 1) * gapY}px`,
        borderColor: card.contentStyle?.borderColor || undefined,
        borderStyle: card.contentStyle?.borderStyle || 'solid',
        backgroundColor: card.contentStyle?.backgroundColor || undefined,
      }}
      className={`group flex flex-col rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 relative overflow-hidden h-full ${
        isSelected ? 'ring-2 ring-brand-500 shadow-md' : 'hover:shadow-md'
      } ${isDraggingOver ? 'ring-2 ring-emerald-500 bg-emerald-50/10' : ''} ${
        isDropTarget ? 'scale-[0.98] ring-2 ring-brand-500 ring-offset-2 border-brand-500 shadow-xl opacity-90' : ''
      } ${isBeingDragged ? 'opacity-35 scale-[0.98] ring-2 ring-brand-400 border-dashed' : ''}`}
    >
      <div
        draggable={isCardDraggable && !isEditingName}
        onDragStart={(e) => {
          if (isEditingName) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.setData('application/x-bookmark-card-id', card.id);
          if (cardContainerRef.current) {
            const rect = cardContainerRef.current.getBoundingClientRect();
            e.dataTransfer.setDragImage(cardContainerRef.current, e.clientX - rect.left, e.clientY - rect.top);
          }
          onCardDragStart(card.id);
        }}
        onDragEnd={onCardDragEnd}
        style={{
          backgroundColor: card.headerStyle?.backgroundColor || defaultHeaderBg,
          color: card.headerStyle?.textColor || defaultHeaderTextColor,
        }}
        className={`px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 ${
          isCardDraggable && !isEditingName ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCardDraggable && (
            <span
              title="Drag to reorder card position"
              className="text-slate-400 hover:text-slate-200 flex-shrink-0"
            >
              <GripVertical className="w-4 h-4"/>
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 w-full"
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameInputValue}
                    onChange={(e) => setNameInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') { e.preventDefault(); handleSaveInlineName(); }
                      if (e.key === 'Escape') { e.preventDefault(); handleCancelInlineName(); }
                    }}
                    onBlur={handleCancelInlineName}
                    className="w-full text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
                  />
                  <button
                    type="button"
                    title="Save name"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveInlineName(); }}
                    className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 flex-shrink-0"
                  >
                    <Check className="w-3 h-3"/>
                  </button>
                  <button
                    type="button"
                    title="Cancel edition"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelInlineName(); }}
                    className="p-1 rounded bg-rose-500 text-white hover:bg-rose-600 flex-shrink-0"
                  >
                    <X className="w-3 h-3"/>
                  </button>
                </div>
              ) : (
                <h3
                  title={selfLocks.lockedName ? 'Card name locked' : 'Double-click to rename'}
                  onDoubleClick={(e) => {
                    if (!selfLocks.lockedName) {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }
                  }}
                  className="font-semibold text-sm truncate tracking-tight select-none cursor-pointer hover:underline decoration-dotted"
                >
                  {card.name}
                </h3>
              )}

              {card.isPrivate && (
                <span
                  title="Private Card"
                  className="text-amber-400 flex-shrink-0"
                >
                  <Lock className="w-3.5 h-3.5"/>
                </span>
              )}

              {selfLocks.lockedPosition && (
                <span
                  title="Locked Position"
                  className="text-xs bg-black/20 text-slate-300 px-1 rounded flex-shrink-0 font-mono"
                >
                  🔒 Pos
                </span>
              )}

              {selfLocks.lockedSize && (
                <span
                  title="Locked Size"
                  className="text-xs bg-black/20 text-slate-300 px-1 rounded flex-shrink-0 font-mono"
                >
                  🔒 Size
                </span>
              )}
            </div>

            {card.badges && card.badges.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {card.badges.map(b => (
                  <span
                    key={b.id}
                    style={{ backgroundColor: b.backgroundColor, color: b.textColor }}
                    className="text-[10px] font-medium px-1.5 py-0.2 rounded-full inline-flex items-center gap-1"
                  >
                    <IconRenderer className="w-2.5 h-2.5" icon={b.icon} iconType={b.iconType}/>
                    {b.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {bmLocks.addable && (
            <button
              type="button"
              title="Add Bookmark"
              onClick={(e) => { e.stopPropagation(); onAddBookmark(card.id); }}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-current transition-colors"
            >
              <Plus className="w-3.5 h-3.5"/>
            </button>
          )}
          <button
            type="button"
            title="Configure Card"
            onClick={(e) => { e.stopPropagation(); onEditCard(card); }}
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-current transition-colors"
          >
            <Settings className="w-3.5 h-3.5"/>
          </button>
          {!selfLocks.lockedDeletion && (
            <button
              type="button"
              title="Remove Card"
              onClick={(e) => { e.stopPropagation(); onDeleteCard(card); }}
              className="p-1 rounded-md bg-white/10 hover:bg-rose-500/30 text-current transition-colors"
            >
              <Trash className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
      </div>

      <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 pointer-events-none">
            <Search className="w-3 h-3"/>
          </span>
          <input
            type="text"
            placeholder="Search bookmarks in card..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="p-2 space-y-1.5 flex-1 min-h-0 overflow-y-auto">
        {filteredBookmarks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            {card.bookmarks.length === 0 ? (
              <p>
                Drop URLs or click <span className="font-semibold text-brand-500">+</span> to add bookmarks
              </p>
            ) : (
              <p>
                No matching bookmarks found
              </p>
            )}
          </div>
        ) : (
          filteredBookmarks.map((bm) => (
            <BookmarkItem bookmark={bm} cardId={card.id} cardLocks={bmLocks} key={bm.id} onEdit={(item) => onEditBookmark(card.id, item)}
              onDelete={() => onDeleteBookmark(card.id, bm.id)}
              onOpenReader={onOpenReader}
              onCopyBookmark={onCopyBookmark}
              isSelected={selectedBookmarkIds.has(bm.id)}
              onSelect={handleBookmarkSelect}
              isCmdPressed={isCmdPressed}
              bookmarkDisplayMode={card.bookmarkDisplayMode || 'compact'}
            />
          ))
        )}
      </div>

      <div className="mt-auto flex-shrink-0 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 truncate">
          <span>
            {accessibleBookmarks.length} links
          </span>
          <span>•</span>
          <span className={healthRatio < 100 ? 'text-amber-500 font-medium' : 'text-emerald-500 font-medium'}>
            {healthRatio}% healthy
          </span>
          <span>•</span>
          <span className="font-mono text-[10px]">
            ({posX},{posY})
          </span>
        </div>

        {isCardResizable && (
          <div className="flex items-center gap-2">
            <div
              title="Drag vertically to change card height in grid rows"
              onMouseDown={handleVerticalResizeStart}
              className="cursor-ns-resize px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors flex items-center gap-0.5 text-[9px] font-mono select-none"
            >
              <span className="leading-none">
                ↕
              </span>
              <span className="hidden sm:inline">
                Row
              </span>
            </div>

            <div
              title="Drag to resize card width and height"
              onMouseDown={handleResizeStart}
              className="cursor-nwse-resize p-0.5 text-slate-400 hover:text-brand-500 transition-colors"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="1.5"
                />
                <circle
                  cx="4"
                  cy="8"
                  r="1.5"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {isCardResizable && (
        <div
          title="Drag edge to resize height"
          onMouseDown={handleVerticalResizeStart}
          className="absolute bottom-0 inset-x-0 h-1 cursor-ns-resize hover:bg-brand-500/50 transition-colors"
        />
      )}
    </div>
  );
});

BookmarkCard.displayName = 'BookmarkCard';