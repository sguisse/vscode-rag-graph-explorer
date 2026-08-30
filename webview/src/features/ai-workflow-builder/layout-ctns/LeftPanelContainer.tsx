import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { NodePalettePanel } from '../components/palette/NodePalettePanel';

export const LeftPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Node Palette" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <NodePalettePanel />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
