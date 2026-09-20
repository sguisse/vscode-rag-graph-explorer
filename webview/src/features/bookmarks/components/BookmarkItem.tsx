import React, { useState, memo } from 'react';
import { Lock, EyeOff, BookOpen, Copy, Edit, Trash } from 'lucide-react';
import { Bookmark, CardBookmarkLocks } from '../types/bookmarks.types';
import { IconRenderer } from './IconRenderer';
import { RadialContextMenu } from './RadialContextMenu';

const HealthStatusDot = ({ status, lastCheckedAt }: { status: string, lastCheckedAt?: number }) => {
  let colorClass = 'bg-emerald-500';
  let label = 'Healthy (200 OK)';
  if (status === 'broken') {
    colorClass = 'bg-rose-500 ring-rose-300';
    label = 'Broken (404/500)';
  } else if (status === 'checking') {
    colorClass = 'bg-amber-400 animate-pulse';
    label = 'Verifying link...';
  } else if (status === 'ssl_error') {
    colorClass = 'bg-purple-500';
    label = 'SSL Handshake Issue';
  }

  return (
    <span
      title={`${label}${lastCheckedAt ? ` • Last check: ${new Date(lastCheckedAt).toLocaleTimeString()}` : ''}`}
      className={`w-2.5 h-2.5 rounded-full inline-block ${colorClass} ring-2 ring-white dark:ring-slate-900 transition-all`}
    />
  );
};

interface BookmarkItemProps {
  bookmark: Bookmark;
  cardId: string;
  cardLocks: CardBookmarkLocks;
  onEdit: (item: Bookmark) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
  onOpenReader: (bm: Bookmark) => void;
  onCopyBookmark: (bm: Bookmark) => void;
  isCmdPressed?: boolean;
  bookmarkDisplayMode?: 'compact' | 'details';
}

export const BookmarkItem = memo(({
  bookmark,
  cardId,
  cardLocks,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  onOpenReader,
  onCopyBookmark,
  isCmdPressed = false,
  bookmarkDisplayMode = 'compact'
}: BookmarkItemProps) => {
  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null);
  const isItemLocked = bookmark.isLocked;
  const canEdit = cardLocks.editable && !isItemLocked;
  const canDelete = cardLocks.removable && !isItemLocked;

  const handleDoubleClick = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setRadialPos({ x: e.clientX, y: e.clientY });
  };

  const handleRadialAction = (actionKey: string, bm: Bookmark) => {
    if (actionKey === 'read') onOpenReader(bm);
    if (actionKey === 'copy') onCopyBookmark(bm);
    if (actionKey === 'edit') onEdit(bm);
    if (actionKey === 'delete') onDelete(bm.id);
  };

  return (
    <>
      <div
        title={`URL: ${bookmark.url}${bookmark.description ? `\n\n${bookmark.description}` : ''}`}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onClick={(e) => onSelect(e, bookmark.id)}
        draggable={cardLocks.reorderable && !isItemLocked}
        onDragStart={(e) => {
          e.stopPropagation();
          const isCopy = e.ctrlKey || e.metaKey || isCmdPressed;
          e.dataTransfer.effectAllowed = isCopy ? 'copy' : 'move';
          e.dataTransfer.setData('text/plain', bookmark.url);
          e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'bookmark',
            bookmarkId: bookmark.id,
            sourceCardId: cardId
          }));
          e.dataTransfer.setData('application/x-bookmark-item', JSON.stringify({
            bookmarkId: bookmark.id,
            sourceCardId: cardId
          }));
        }}
        className={`group relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all border select-none ${
          isSelected
            ? 'bg-brand-50/90 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 ring-1 ring-brand-400'
            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-200/60 dark:border-slate-700/60 relative">
            <IconRenderer className="w-4 h-4" icon={bookmark.icon} iconType={bookmark.iconType}/>
            {isCmdPressed && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
                +
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {bookmark.name}
              </span>
              {bookmark.isLocked && (
                <span title="Bookmark locked">
                  <Lock className="w-3 h-3 text-slate-400 flex-shrink-0"/>
                </span>
              )}
              {bookmark.isPrivate && (
                <span title="Private Bookmark">
                  <EyeOff className="w-3 h-3 text-amber-500 flex-shrink-0"/>
                </span>
              )}
            </div>

            {bookmarkDisplayMode === 'details' && (
              <div className="mt-0.5 space-y-1">
                {bookmark.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {bookmark.description}
                  </p>
                )}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {bookmark.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <HealthStatusDot lastCheckedAt={bookmark.lastCheckedAt} status={bookmark.healthStatus}/>

          <div className="hidden group-hover:flex items-center gap-1">
            <button
              type="button"
              title="Open Reader View"
              onClick={(e) => { e.stopPropagation(); onOpenReader(bookmark); }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <BookOpen className="w-3 h-3"/>
            </button>

            <button
              type="button"
              title="Copy URL"
              onClick={(e) => { e.stopPropagation(); onCopyBookmark(bookmark); }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Copy className="w-3 h-3"/>
            </button>

            {canEdit && (
              <button
                type="button"
                title="Edit Bookmark"
                onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }}
                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Edit className="w-3 h-3"/>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                title="Delete Bookmark"
                onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <Trash className="w-3 h-3"/>
              </button>
            )}
          </div>
        </div>
      </div>

      <RadialContextMenu
        bookmark={bookmark}
        onClose={() => setRadialPos(null)}
        position={radialPos}
        onAction={handleRadialAction}
      />
    </>
  );
});

BookmarkItem.displayName = 'BookmarkItem';
