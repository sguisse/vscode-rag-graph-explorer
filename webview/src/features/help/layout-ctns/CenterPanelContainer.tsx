import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { HelpPanel } from '../components/HelpPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Help & Documentation" path="workspace.center" isHiddable={false} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <HelpPanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
