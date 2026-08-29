import { useState } from 'react';
import { WorkflowEditorTab } from '../types/workflow-editor.types';

export function useWorkflowEditor() {
  const [activeTab, setActiveTab] = useState<WorkflowEditorTab>('json');
  return { activeTab, setActiveTab };
}
