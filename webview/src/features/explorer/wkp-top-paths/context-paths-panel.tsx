import React from 'react';
import { useContextPaths } from './use-context-paths';

export function ContextPathsPanel() {
  const { currentPath } = useContextPaths();
  return (
    <div className="p-3 font-mono text-muted-foreground text-xs">
      {currentPath}
    </div>
  );
}
