import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { InstructionsPanel } from '../components/InstructionsPanel';

export function CenterPanelContainer() {


  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);

  return (
    <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Instructions & Skills" path="workspace.center" />
      <div className="relative flex-1 w-full h-full min-h-0">
        <InstructionsPanel />
      </div>
    </div>
  );
}
