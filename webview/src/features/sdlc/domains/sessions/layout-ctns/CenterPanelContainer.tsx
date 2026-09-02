import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { SessionsManagerPanel } from '../components/SessionsManagerPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="SDLC Sessions Manager" path="workspace.center" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <SessionsManagerPanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
