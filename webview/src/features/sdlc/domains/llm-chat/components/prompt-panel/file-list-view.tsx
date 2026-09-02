import React from 'react';
import { Button } from '@/components/ui/button';

export interface FileListItem {
  id: string;
  name: string;
  category?: string;
  emoji?: string;
  sizeKb?: number;
  isSelected?: boolean;
  detail?: string;
}

export interface FileListViewProps {
  title: string;
  icon?: React.ReactNode;
  items?: FileListItem[];
  onToggleItem?: (item: FileListItem) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  customContent?: React.ReactNode;
  emptyMessage?: string;
  badgeText?: string;
}

export const FileListView: React.FC<FileListViewProps> = ({
  title,
  icon,
  items = [],
  onToggleItem,
  onSelectAll,
  onDeselectAll,
  customContent,
  emptyMessage = 'No files available',
  badgeText,
}) => {
  return (
    <div className="flex flex-col bg-background/60 border border-border/80 rounded-md w-full h-full min-h-0 overflow-hidden font-mono text-xs">
      {/* List Header */}
      <div className="flex justify-between items-center bg-muted/30 px-2.5 py-1 border-border/50 border-b shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon}
          <span className="font-bold text-[11px] text-foreground uppercase truncate">
            {title} {badgeText ? `(${badgeText})` : ''}
          </span>
        </div>
        {(onSelectAll || onDeselectAll) && (
          <div className="flex items-center gap-1 text-[10px] shrink-0">
            {onSelectAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="px-1.5 h-5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Select All
              </Button>
            )}
            {onSelectAll && onDeselectAll && <span className="text-muted-foreground/40">|</span>}
            {onDeselectAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                className="px-1.5 h-5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Deselect All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* List Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1">
        {customContent ? (
          customContent
        ) : items.length === 0 ? (
          <div className="flex justify-center items-center h-full text-[10px] text-muted-foreground italic p-4">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleItem?.(item)}
              className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                item.isSelected
                  ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                  : 'bg-card border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              {item.category && (
                <span className="inline-flex items-center bg-muted/60 px-1.5 py-0 border border-border rounded-md font-bold text-[9px] text-foreground uppercase shrink-0">
                  {item.category}
                </span>
              )}

              <input
                type="checkbox"
                checked={Boolean(item.isSelected)}
                onChange={() => onToggleItem?.(item)}
                onClick={(e) => e.stopPropagation()}
                className="bg-background border-border rounded w-3.5 h-3.5 accent-primary cursor-pointer shrink-0"
              />

              <div className="flex flex-1 items-center gap-1.5 min-w-0 truncate">
                <span className="shrink-0">{item.emoji || '📄'}</span>
                <span className="font-semibold text-foreground text-xs truncate">
                  {item.name}
                </span>
              </div>

              {item.sizeKb !== undefined && item.sizeKb > 0 && (
                <span className="bg-muted/40 px-1 rounded text-[9px] text-muted-foreground shrink-0">
                  {item.sizeKb} KB
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileListView;
