import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { GraphPanel } from '../components/dependency-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from '../components/dependency-graph/GraphPanelHeader';
import { useCodebaseDomainState } from '../store/useCodebaseDomainState';

export function CenterPanelContainer() {
  const callersDepth = useCodebaseDomainState((s) => s.callersDepth);
  const setCallersDepth = useCodebaseDomainState((s) => s.setCallersDepth);
  const calleesDepth = useCodebaseDomainState((s) => s.calleesDepth);
  const setCalleesDepth = useCodebaseDomainState((s) => s.setCalleesDepth);
  const currentLayout = useCodebaseDomainState((s) => s.currentLayout);
  const setCurrentLayout = useCodebaseDomainState((s) => s.setCurrentLayout);
  const maxNodesLimit = useCodebaseDomainState((s) => s.maxNodesLimit);
  const setMaxNodesLimit = useCodebaseDomainState((s) => s.setMaxNodesLimit);
  const displayLevel = useCodebaseDomainState((s) => s.displayLevel);
  const setDisplayLevel = useCodebaseDomainState((s) => s.setDisplayLevel);

  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);

  return (
    <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.center"
        isHiddable={true}
        headerLeft={<GraphPanelHeaderLeft />}
        headerCenter={
          <GraphPanelHeaderCenter
            maxNodesLimit={maxNodesLimit}
            setMaxNodesLimit={setMaxNodesLimit}
            callersDepth={callersDepth}
            setCallersDepth={setCallersDepth}
            calleesDepth={calleesDepth}
            setCalleesDepth={setCalleesDepth}
            displayLevel={displayLevel}
            setDisplayLevel={setDisplayLevel}
            currentLayout={currentLayout}
            setCurrentLayout={setCurrentLayout}
          />
        }
        headerRight={
          <GraphPanelHeaderRight
            isGraphMaximized={false}
            setIsGraphMaximized={() => toggleContainerMaximized('workspace.center')}
          />
        }
      />
      <div className="relative flex-1 w-full h-full min-h-0">
        <GraphPanel />
      </div>
    </div>
  );
}
