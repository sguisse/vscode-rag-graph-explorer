import React from "react";
import { cn } from "../../lib/utils";

export interface TopMiddleBottomPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  top?: React.ReactNode;
  middle?: React.ReactNode;
  bottom?: React.ReactNode;
  topId?: string;
  middleId?: string;
  bottomId?: string;
}

export function TopMiddleBottomPanel({
  id,
  top,
  middle,
  bottom,
  topId,
  middleId,
  bottomId,
  className,
  ...props
}: TopMiddleBottomPanelProps) {
  return (
    <div id={id} className={cn("flex flex-col w-full h-full", className)} {...props}>
      <div id={topId ?? `${id}-top`} className="empty:hidden flex items-center gap-2">{top}</div>
      <div id={middleId ?? `${id}-middle`} className="empty:hidden flex flex-1 overflow-auto">{middle}</div>
      <div id={bottomId ?? `${id}-bottom`} className="empty:hidden flex items-center gap-2">{bottom}</div>
    </div>
  );
}
