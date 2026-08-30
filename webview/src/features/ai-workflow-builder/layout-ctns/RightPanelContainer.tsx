import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { AttributesPanel } from '../components/inspector/AttributesPanel';

export const RightPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Inspector & Telemetry" path="workspace.right" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <AttributesPanel />
      </div>
    </div>
  );
};

export default RightPanelContainer;
