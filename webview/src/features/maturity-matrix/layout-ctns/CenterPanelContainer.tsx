import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { MaturityMatrixPanel } from '../components/MaturityMatrixPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader path="workspace.center" title="🌀 Maturity Matrix & Evaluation"/>
      <div className="flex-1 min-h-0 overflow-hidden">
        <MaturityMatrixPanel/>
      </div>
    </div>
  );
};

export default CenterPanelContainer;
