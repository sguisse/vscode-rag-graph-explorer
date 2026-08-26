import React from 'react';
import { useWkpBottomPanel } from './hooks/use-wkp-bottom-panel';

export function WkpBottomPanel() {
  const { statusText } = useWkpBottomPanel();

  return (
    <div className="px-4 py-2 font-medium text-muted-foreground text-xs">
      {statusText}
    </div>
  );
}
