import React from 'react';

export function HelpPanel() {
  return (
    <div className="flex flex-col bg-background p-6 w-full h-full min-h-0 overflow-y-auto font-mono text-xs">
      <h3 className="font-bold text-foreground text-sm">Documentation & User Manual</h3>
      <p className="mt-1 text-muted-foreground">Guide on graph navigation, impact analysis, and layout controls.</p>
    </div>
  );
}

export default HelpPanel;
