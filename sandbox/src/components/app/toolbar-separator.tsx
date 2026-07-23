import React from 'react';

export type ToolbarSeparatorOrientation = 'VERTICAL' | 'HORIZONTAL';

export interface ToolbarSeparatorProps {
  orientation?: ToolbarSeparatorOrientation;
}

export function ToolbarSeparator({ orientation = 'VERTICAL' }: ToolbarSeparatorProps) {
  if (orientation === 'VERTICAL') {
    return <div className="mx-1 bg-border w-px h-5"></div>;
  } else {
    return <div className="my-1 bg-border h-px w-full"></div>;
  }
}