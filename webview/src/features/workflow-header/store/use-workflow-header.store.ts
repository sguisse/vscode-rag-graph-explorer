import { WorkflowData } from '@/components/app/workflow/model/workflow-model';
import workflowHeaderData from '@/features/workflow-header/data/workflow-header-data.json';
import { create } from 'zustand/react';

export interface WorkflowHeaderState {
  dataWorkflow: WorkflowData;
  setDataWorkflow: (data: WorkflowData) => void;
  setSelectedWorkflowStep: (stepId: string) => void;
}


export const useWorkflowHeaderStore = create<WorkflowHeaderState>((set) => ({
  // Workflow State & Actions
  dataWorkflow: workflowHeaderData as WorkflowData,
  setDataWorkflow: (dataWorkflow) => set({ dataWorkflow }),
  setSelectedWorkflowStep: (stepId) =>
    set((state) => {
      const updatedNodes = state.dataWorkflow.workflow.nodes.map((node) => {
        if (node.id === stepId) {
          return { ...node, status: 'current' as const };
        }
        if (node.status === 'current') {
          return { ...node, status: 'completed' as const };
        }
        return node;
      });

      return {
        dataWorkflow: {
          ...state.dataWorkflow,
          workflow: {
            ...state.dataWorkflow.workflow,
            initialStepId: stepId,
            nodes: updatedNodes,
          },
        },
      };
    })
}));
