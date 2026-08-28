import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { FilesContextPanel } from '@/features/sdlc/domains/codebase-context/components/files-selection/files-context';

export function FilesContextLeftContainer() {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Files Selection tuning" path="workspace.left" />
      <div className="flex-1 p-1.5 min-h-0 overflow-auto">
        <FilesContextPanel />
      </div>
    </div>
  );
}
