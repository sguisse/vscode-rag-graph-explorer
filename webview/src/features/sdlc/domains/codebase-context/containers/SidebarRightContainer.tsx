import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { InspectorPanel } from '../components/inspector/inspector-panel';

export function SidebarRightContainer() {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Inspector" path="sidebarRight" />
      <div className="flex-1 p-1.5 min-h-0 overflow-auto">
        <InspectorPanel />
      </div>
    </div>
  );
}
