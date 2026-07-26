import React from "react";
import { cn } from "../../lib/utils";

export interface LeftCenterRightPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  leftId?: string;
  centerId?: string;
  rightId?: string;
}

export function LeftCenterRightPanel({
  id,
  left,
  center,
  right,
  leftId,
  centerId,
  rightId,
  className,
  ...props
}: LeftCenterRightPanelProps) {
  return (
    <div id={id} className={cn("flex justify-between items-center w-full", className)} {...props}>
      <div id={leftId ?? `${id}-left`} className="empty:hidden flex items-center gap-2">{left}</div>
      <div id={centerId ?? `${id}-center`} className="empty:hidden flex flex-1 justify-center items-center px-2 overflow-hidden">{center}</div>
      <div id={rightId ?? `${id}-right`} className="empty:hidden flex justify-end items-center gap-2">{right}</div>
    </div>
  );
}
