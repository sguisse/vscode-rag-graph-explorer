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
    <div id={id} className={cn("flex justify-between items-center w-full min-w-0", className)} {...props}>
      <div id={leftId ?? `${id}-left`} className="empty:hidden flex-1 flex items-center justify-start gap-2 min-w-0">
        {left}
      </div>
      <div id={centerId ?? `${id}-center`} className="empty:hidden flex-1 flex items-center justify-center px-2 min-w-0">
        {center}
      </div>
      <div id={rightId ?? `${id}-right`} className="empty:hidden flex-1 flex items-center justify-end gap-2 min-w-0 ml-auto">
        {right}
      </div>
    </div>
  );
}
