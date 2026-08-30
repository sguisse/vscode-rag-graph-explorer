import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ResultsManagerPanel } from '../components/ResultsManagerPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="SDLC Results Manager" path="workspace.center" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsManagerPanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
