import React from "react";
import { cn } from "../../lib/utils";
import { LayoutPanel } from "./layout-panel";

export interface ResizableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  visible?: boolean;
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  titleBarId?: string;
  contentId?: string;
  handleId?: string;
  headerClassName?: string;
  contentClassName?: string;
  resizeHandle?: 'top' | 'right' | 'bottom' | 'left' | 'none';
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function ResizableContainer({
  id,
  visible = true,
  headerLeft,
  headerCenter,
  headerRight,
  titleBarId,
  contentId,
  handleId,
  headerClassName,
  contentClassName,
  resizeHandle = 'none',
  onResizeStart,
  className,
  children,
  style,
  ...props
}: ResizableContainerProps) {
  if (!visible) return null;

  const handleClasses = {
    top: "top-0 right-0 left-0 h-1 cursor-row-resize",
    right: "top-0 right-0 bottom-0 w-1 cursor-col-resize",
    bottom: "bottom-0 right-0 left-0 h-1 cursor-row-resize",
    left: "top-0 bottom-0 left-0 w-1 cursor-col-resize",
    none: "hidden"
  };

  const handleInnerClasses = {
    top: "top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px]",
    right: "top-1/2 right-[1px] -translate-y-1/2 w-[2px] h-8",
    bottom: "bottom-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px]",
    left: "top-1/2 left-[1px] -translate-y-1/2 w-[2px] h-8",
    none: "hidden"
  };

  const hasHeader = headerLeft || headerCenter || headerRight;

  return (
    <div
      id={id}
      style={style}
      className={cn("relative flex flex-col bg-card border-border min-w-0 min-h-0 overflow-hidden shrink-0", className)}
      {...props}
    >
      {hasHeader && (
        <LayoutPanel
          id={titleBarId || `${id}-title-bar`}
          left={headerLeft}
          center={headerCenter}
          right={headerRight}
          className={cn(
            "bg-secondary px-3 border-border border-b h-8 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider select-none shrink-0",
            headerClassName
          )}
        />
      )}

      <div id={contentId || `${id}-content`} className={cn("relative flex-1 bg-background w-full min-w-0 h-full min-h-0 overflow-auto scrollbar-hide", contentClassName)}>
        {children}
      </div>

      {resizeHandle !== 'none' && onResizeStart && (
        <div
          id={handleId || `${id}-handle`}
          className={cn("group z-20 absolute hover:bg-primary/20 transition-colors", handleClasses[resizeHandle])}
          onMouseDown={onResizeStart}
        >
          <div className={cn("absolute bg-border rounded-full", handleInnerClasses[resizeHandle])} style={{display: 'none'}}></div>
        </div>
      )}
    </div>
  );
}
