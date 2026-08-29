import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

export const CopyButton: React.FC<{ text: string; title?: string; className?: string }> = ({
  text,
  title = 'Copy content',
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      data-tooltip={title}
      className={cn(
        "hover:bg-muted p-0 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
        className
      )}
    >
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
    </Button>
  );
};

export interface CollapsibleCardProps {
  cardId?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  title: React.ReactNode;
  badge?: string;
  defaultExpanded?: boolean;
  globalExpanded?: { value: boolean; id: number };
  contentToCopy: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  contentClassName?: string;
  footer?: React.ReactNode;
  footerStyle?: React.CSSProperties;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  cardId,
  isOpen: externalIsOpen,
  onToggle,
  title,
  badge,
  defaultExpanded = true,
  globalExpanded,
  contentToCopy,
  children,
  className,
  style,
  headerClassName,
  headerStyle,
  contentClassName,
  footer,
  footerStyle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultExpanded);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleCardToggle = () => {
    const nextState = !isOpen;
    if (onToggle) {
      onToggle(nextState);
    } else {
      setInternalIsOpen(nextState);
    }
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (globalExpanded !== undefined) {
      if (onToggle) {
        onToggle(globalExpanded.value);
      } else {
        setInternalIsOpen(globalExpanded.value);
      }
    }
  }, [globalExpanded?.id]);

  return (
    <Card
      className={cn("flex flex-col py-0 border rounded-sm overflow-hidden shrink-0", className)}
      style={style}
    >
      <CardHeader
        onClick={handleCardToggle}
        className={cn(
          "flex flex-row justify-between items-center space-y-0 p-1.5 px-3 rounded-t-none transition-colors cursor-pointer select-none",
          headerClassName
        )}
        style={headerStyle}
      >
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span className="text-[10px]">{isOpen ? '▼' : '►'}</span>
          {typeof title === 'string' ? <span>{title}</span> : title}
          {badge && (
            <span className="bg-primary/10 px-1.5 py-0.5 rounded-sm font-semibold text-[9px] text-primary">
              {badge}
            </span>
          )}
        </div>

        <CopyButton text={contentToCopy} data-tooltip="Copy block content" />
      </CardHeader>

      {isOpen && children && (
        <CardContent
          className={cn(
            "p-1 font-mono text-[11px] break-words leading-relaxed whitespace-pre-wrap overflow-y-auto min-h-0 max-h-[600px]",
            contentClassName
          )}
        >
          {children}
        </CardContent>
      )}

      {footer && (
        <CardFooter
          className="justify-end opacity-70 p-1 px-2.5 text-[10px] italic"
          style={footerStyle}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
