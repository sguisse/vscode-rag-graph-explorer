import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { TabsFilesContextContainer } from '../wkp-rgt-tabs-files-context/tabs-files-context-container';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useExplorerStore } from '../store/useExplorerStore';

export function RightPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const setEnableDownstream = useExplorerStore((s) => s.setEnableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);
  const setEnableUpstream = useExplorerStore((s) => s.setEnableUpstream);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Files Context Builder" path="workspace.right" />
      <div className="flex-1 min-h-0 overflow-auto">
        <TabsFilesContextContainer
          selectedEntity={selectedEntity}
          initialCodebase={codebase}
          enableDownstream={enableDownstream}
          setEnableDownstream={setEnableDownstream}
          enableUpstream={enableUpstream}
          setEnableUpstream={setEnableUpstream}
          impactedSet={impactedSet}
          handleCopy={handleCopy}
        />
      </div>
    </div>
  );
}
