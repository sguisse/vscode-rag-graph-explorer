import React from 'react';
import { BMadInstructionsPanel } from './components/BMadInstructionsPanel';

export function BMadMethodFeature() {
  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-y-auto font-mono text-xs p-2">
      <BMadInstructionsPanel />
    </div>
  );
}
