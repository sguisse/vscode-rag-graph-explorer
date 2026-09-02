import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { FilesContextPanel } from '../../codebase-context/components/files-selection/files-context';

export const LeftPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Files Selection & Context" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <FilesContextPanel />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
