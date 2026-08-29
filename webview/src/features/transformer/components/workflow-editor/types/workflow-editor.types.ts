import { TransformerWorkflow } from '../../../types/transformer.types';

export type WorkflowEditorTab = 'json' | 'tree' | 'graph';

export interface WorkflowEditorProps {
  workflowJsonText: string;
  setWorkflowJsonText: (val: string) => void;
  workflowParseError: string | null;
  parsedWorkflow: TransformerWorkflow;
  onSelectVariable?: (variableName: string) => void;
}
