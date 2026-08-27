import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { WkpBottomPanel } from '../wkp-btm-infos/wkp-bottom-panel';

export function BottomPanelContainer() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
      <div className="flex-1 min-h-0 overflow-auto">
        <WkpBottomPanel />
      </div>
    </div>
  );
}
