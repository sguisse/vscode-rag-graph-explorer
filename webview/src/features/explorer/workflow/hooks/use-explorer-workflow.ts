import { useExplorerStore } from '@/features/explorer/store/useExplorerStore';
import { useCallback } from 'react';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { useLayoutStore } from '@/store/useLayoutStore';

export function useExplorerWorkflow() {
  const dataWorkflow = useExplorerStore((s) => s.dataWorkflow);
  const setSelectedWorkflowStep = useExplorerStore((s) => s.setSelectedWorkflowStep);

  const handleSelectStep = useCallback(
    (stepId: string) => {
      logInfo(`[useExplorerWorkflow] Step selected: '${stepId}'`);
      if (stepId === 'files_selection') {
        useLayoutStore.getState().setContainerVisible('workspace.left', true);
        useLayoutStore.getState().setContainerVisible('workspace.center', true);
        useLayoutStore.getState().setContainerVisible('workspace.right', true);
        useLayoutStore.getState().setContainerVisible('sidebarRight', false);
      }
      if (stepId === 'prompt') {
        useLayoutStore.getState().setContainerVisible('sidebarRight', true);
        useLayoutStore.getState().setContainerVisible('workspace.left', false);
        useLayoutStore.getState().setContainerVisible('workspace.center', false);
        useLayoutStore.getState().setContainerVisible('workspace.right', true);
      }

      setSelectedWorkflowStep(stepId);
    },
    [setSelectedWorkflowStep]
  );

  return {
    dataWorkflow,
    handleSelectStep,
  };
}
