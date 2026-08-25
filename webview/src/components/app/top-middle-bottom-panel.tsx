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
    <div id={id} className={cn("flex flex-col w-full h-full min-h-0 overflow-hidden select-none", className)} {...props}>
      <div id={topId ?? `${id}-top`} className="empty:hidden shrink-0 w-full flex flex-col">{top}</div>
      <div id={middleId ?? `${id}-middle`} className="empty:hidden flex-1 min-h-0 overflow-y-auto w-full">{middle}</div>
      <div id={bottomId ?? `${id}-bottom`} className="empty:hidden shrink-0 w-full flex flex-col">{bottom}</div>
    </div>
  );
}
