import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ExporterPanel } from '../components/ExporterPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Codebase Exporter" path="workspace.center" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ExporterPanel />
      </div>
    </div>
  );
};

export default CenterPanelContainer;
