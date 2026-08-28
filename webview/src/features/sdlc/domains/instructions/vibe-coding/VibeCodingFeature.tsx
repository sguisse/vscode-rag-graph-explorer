import React from 'react';
import { VibeInstructionsPanel } from './components/VibeInstructionsPanel';

export function VibeCodingFeature() {
  return (
    <div className="flex flex-col bg-card p-1.5 w-full h-full min-h-0 overflow-hidden font-mono text-xs">
      <VibeInstructionsPanel />
    </div>
  );
}
