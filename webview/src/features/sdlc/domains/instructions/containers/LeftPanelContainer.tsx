import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { InstructionsMethodPanel } from '../components/InstructionsMethodPanel';

export function LeftPanelContainer() {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Instructions & Skills" path="workspace.left" />
      <div className="flex-1 p-0 min-h-0 overflow-auto">
        <InstructionsMethodPanel />
      </div>
    </div>
  );
}
