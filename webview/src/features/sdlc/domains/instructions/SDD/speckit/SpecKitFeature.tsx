import React from 'react';
import { SpecKitInstructionsPanel } from './components/SpecKitInstructionsPanel';

export function SpecKitFeature() {
  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-y-auto font-mono text-xs p-2">
      <SpecKitInstructionsPanel />
    </div>
  );
}
