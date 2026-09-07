import React, { useRef } from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ExportConfigurationPanel, ExportConfigurationPanelHandle } from '../components/ExportConfigurationPanel';
import { ExportConfigurationPanelHeaderRight } from '../components/ExportConfigurationPanelHeader';

export const LeftPanelContainer: React.FC = () => {
  const panelRef = useRef<ExportConfigurationPanelHandle>(null);

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        title="⚙️ Export Configuration"
        path="workspace.left"
        headerRight={
          <ExportConfigurationPanelHeaderRight
            onCollapseAll={() => panelRef.current?.collapseAll()}
            onExpandAll={() => panelRef.current?.expandAll()}
          />
        }
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ExportConfigurationPanel ref={panelRef} />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
