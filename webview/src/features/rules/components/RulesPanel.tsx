import React from 'react';

export function RulesPanel() {
  return (
    <div className="flex flex-col bg-background p-6 w-full h-full min-h-0 overflow-y-auto font-mono text-xs">
      <h3 className="font-bold text-foreground text-sm">Architectural Rules & Impact Policies</h3>
      <p className="mt-1 text-muted-foreground">Configured AST impact rules and linting metrics.</p>
    </div>
  );
}

export default RulesPanel;
