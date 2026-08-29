import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { WorkflowEditor } from '../components/workflow-editor/WorkflowEditor';
import { TransformerWorkflow } from '../types/transformer.types';

interface CenterPanelContainerProps {
  workflowJsonText: string;
  setWorkflowJsonText: (val: string) => void;
  workflowParseError: string | null;
  parsedWorkflow: TransformerWorkflow;
}

export const CenterPanelContainer: React.FC<CenterPanelContainerProps> = (props) => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workflow Spec Editor" path="workspace.center" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <WorkflowEditor {...props} />
      </div>
    </div>
  );
};
