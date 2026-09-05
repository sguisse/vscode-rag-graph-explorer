import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BadgeObject {
  label: React.ReactNode;
  tooltip?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export interface CollapsibleCardProps {
  id?: string;
  title: React.ReactNode;
  tooltip?: string;
  summaryText?: string;
  summaryBadges?: (string | BadgeObject)[];
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  id,
  title,
  tooltip,
  summaryText,
  summaryBadges,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  children,
  headerRight,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const nextOpen = !open;
    if (!isControlled) {
      setInternalIsOpen(nextOpen);
    }
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
  };

  const rawBadges =
    summaryBadges ||
    (summaryText
      ? summaryText
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
      : []);

  const badgeItems: BadgeObject[] = rawBadges.map((item) =>
    typeof item === 'string' ? { label: item, tooltip: item } : item
  );

  return (
    <div
      id={id}
      className={cn(
        'bg-card border border-border/60 rounded-md w-full min-w-0 transition-all duration-150',
        className
      )}
    >
      {/* Card Header */}
      <div
        onClick={handleToggle}
        title={tooltip}
        className={cn(
          'flex flex-col border-border/40 cursor-pointer select-none font-mono text-xs',
          open ? 'py-1 px-2 border-b' : 'p-1'
        )}
      >
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            <span className="text-primary shrink-0">
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="font-bold text-foreground text-xs shrink-0">{title}</span>
          </div>

          {headerRight && (
            <div className="shrink-0 flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
        </div>

        {/* Collapsed Mode: Badges on a new line aligned to the left */}
        {!open && badgeItems.length > 0 && (
          <div className="flex flex-wrap items-center justify-start gap-1.5 w-full min-w-0 mt-1 pt-0.5">
            {badgeItems.map((badge, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  if (badge.onClick) {
                    e.stopPropagation();
                    badge.onClick(e);
                  }
                }}
                onDoubleClick={(e) => {
                  if (badge.onDoubleClick) {
                    e.stopPropagation();
                    badge.onDoubleClick(e);
                  }
                }}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-mono leading-none shadow-2xs min-w-0 truncate shrink border cursor-pointer hover:opacity-85 active:scale-[0.98] transition-all',
                  badge.className || 'bg-primary/10 text-primary border-primary/20'
                )}
                title={badge.tooltip || (typeof badge.label === 'string' ? badge.label : undefined)}
                data-tooltip={badge.tooltip || (typeof badge.label === 'string' ? badge.label : undefined)}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      {open && <div className="p-2 w-full min-w-0">{children}</div>}
    </div>
  );
};

export default CollapsibleCard;
