import React from 'react';
import { cn } from '@/lib/utils';

export interface LeftCenterRightPanelProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export const LeftCenterRightPanel: React.FC<LeftCenterRightPanelProps> = ({
  id,
  className,
  style,
  left,
  center,
  right,
}) => {
  return (
    <div
      id={id}
      style={style}
      className={cn(
        'flex items-center justify-between w-full min-w-0 gap-2 overflow-hidden',
        className
      )}
    >
      {left && (
        <div className="shrink-0 flex items-center gap-1.5">
          {left}
        </div>
      )}

      {center && (
        <div className="flex-1 min-w-0 h-full flex items-center justify-center">
          {center}
        </div>
      )}

      {right && (
        <div className="shrink-0 flex items-center gap-1.5 ml-auto">
          {right}
        </div>
      )}
    </div>
  );
};

export default LeftCenterRightPanel;
