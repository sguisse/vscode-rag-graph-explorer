import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ConfigurationPanel } from '../components/ConfigurationPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="SDLC Configuration" path="workspace.center" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ConfigurationPanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
