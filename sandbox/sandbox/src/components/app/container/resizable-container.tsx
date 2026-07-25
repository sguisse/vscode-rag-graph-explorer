import React from "react";
import { cn } from "@/lib/utils";

export interface ResizableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  visible?: boolean;
  resizeHandle?: 'top' | 'right' | 'bottom' | 'left' | 'none';
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function ResizableContainer({
  id,
  visible = true,
  resizeHandle = 'none',
  onResizeStart,
  className,
  children,
  style,
  ...props
}: ResizableContainerProps) {
  if (!visible) return null;

  const handleClasses = {
    top: "top-0 right-0 left-0 h-1 cursor-row-resize hover:bg-primary/40",
    right: "top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40",
    bottom: "bottom-0 right-0 left-0 h-1 cursor-row-resize hover:bg-primary/40",
    left: "top-0 bottom-0 left-0 w-1 cursor-col-resize hover:bg-primary/40",
    none: "hidden"
  };

  const childrenWithParentId = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        parentContainerId: id,
      } as React.Attributes & { parentContainerId?: string });
    }
    return child;
  });

  return (
    <div
      id={id}
      style={style}
      className={cn("relative flex flex-col bg-card border-border min-w-0 min-h-0 overflow-hidden shrink-0", className)}
      {...props}
    >
      <div
        id={`${id}-content`}
        className="relative flex-1 flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-auto scrollbar-hide"
      >
        {childrenWithParentId}
      </div>

      {resizeHandle !== 'none' && onResizeStart && (
        <div
          id={`${id}-handle`}
          className={cn("group z-20 absolute transition-colors", handleClasses[resizeHandle])}
          onMouseDown={onResizeStart}
        />
      )}
    </div>
  );
}
