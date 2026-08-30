import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ReferencePanel } from '../components/ReferencePanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Project References" path="workspace.center" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ReferencePanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
