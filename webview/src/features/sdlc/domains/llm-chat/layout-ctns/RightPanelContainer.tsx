import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { FilesCtxExportPanel } from '@/features/sdlc/domains/codebase-context/components/files-ctx-export/files-ctx-export-panel';
import { FilesContextPanel } from '../../codebase-context/components/files-selection/files-context';

export const RightPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Files Context Export" path="workspace.right" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <FilesContextPanel />
      </div>
    </div>
  );
};

export default RightPanelContainer;
