import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface CollapsibleCardProps {
  id?: string;
  title: React.ReactNode;
  tooltip?: string;
  summaryText?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  id,
  title,
  tooltip,
  summaryText,
  defaultOpen = true,
  children,
  className = '',
  headerExtra,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card id={id} className={`bg-card border-border/80 border rounded-md shadow-2xs overflow-hidden transition-all duration-200 ${className}`}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        data-tooltip={tooltip}
        className="flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 cursor-pointer border-b border-border/60 transition-colors select-none"
      >
        <div className="flex items-center gap-2 font-mono font-semibold text-xs text-foreground truncate">
          {isOpen ? (
            <ChevronDown size={14} className="shrink-0 text-primary transition-transform duration-200" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-muted-foreground transition-transform duration-200" />
          )}
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerExtra}
          {!isOpen && summaryText && (
            <span className="font-mono text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium truncate max-w-[200px]">
              {summaryText}
            </span>
          )}
        </div>
      </div>
      {isOpen && <div className="p-3 font-mono text-xs bg-card/60">{children}</div>}
    </Card>
  );
};

export default CollapsibleCard;
