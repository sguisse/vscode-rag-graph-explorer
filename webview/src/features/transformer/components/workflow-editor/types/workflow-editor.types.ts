import { TransformerWorkflow } from "@/shared/services/transform-content/model/transform-content-model";

export type WorkflowEditorTab = 'json' | 'tree' | 'graph';

export interface WorkflowEditorProps {
  workflowJsonText: string;
  setWorkflowJsonText: (val: string) => void;
  workflowParseError: string | null;
  parsedWorkflow: TransformerWorkflow;
  onSelectVariable?: (variableName: string) => void;
}
