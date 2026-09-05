import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ExportConfigurationPanel } from '../components/ExportConfigurationPanel';

export const LeftPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="⚙️ Export Configuration" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ExportConfigurationPanel />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
