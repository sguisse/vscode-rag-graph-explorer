import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { HomePanel } from '../components/HomePanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">

      <div className="flex-1 min-h-0 overflow-hidden">
        <HomePanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
