import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { TabsPromptContainer } from '../sdb-rgt-prompt/tabs-prompt-container';
import { useExplorerStore } from '../store/useExplorerStore';

export function SidebarRightContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setNotification = useAppContextStore((s) => s.setNotification);

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
      <ContainerPanelHeader title="Prompt & LLM Studio" path="sidebarRight" />
      <div className="flex-1 min-h-0 overflow-auto">
        <TabsPromptContainer
          selectedEntity={selectedEntity}
          initialCodebase={codebase}
          handleCopy={handleCopy}
        />
      </div>
    </div>
  );
}
