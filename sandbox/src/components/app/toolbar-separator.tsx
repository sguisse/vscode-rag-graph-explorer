import React from 'react';

export type ToolbarSeparatorOrientation = 'VERTICAL' | 'HORIZONTAL';

export interface ToolbarSeparatorProps {
  orientation?: ToolbarSeparatorOrientation;
  className?: string;
}

export function ToolbarSeparator({ orientation = 'VERTICAL', className = '' }: ToolbarSeparatorProps) {
  if (orientation === 'VERTICAL') {
    return (
      <div className={`flex items-center justify-center h-full w-3 select-none ${className}`}>
        <div className="bg-border w-[1px] h-4" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-5 py-1.5 shrink-0 select-none ${className}`}>
      <div className="bg-border w-2 h-[1px] shrink-0" />
    </div>
  );
}
