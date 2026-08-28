import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { BMadMethodPanel } from '../components/BMadMethodPanel';

export function BMadLeftContainer() {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="BMad Skills & Agents" path="workspace.left" />
      <div className="flex-1 p-1.5 min-h-0 overflow-auto">
        <BMadMethodPanel />
      </div>
    </div>
  );
}
