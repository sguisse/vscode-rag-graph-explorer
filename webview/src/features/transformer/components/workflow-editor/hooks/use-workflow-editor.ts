import { useState } from 'react';
import { WorkflowEditorTab } from '../types/workflow-editor.types';

export function useWorkflowEditor() {
  const [activeTab, setActiveTab] = useState<WorkflowEditorTab>('tree');
  return { activeTab, setActiveTab };
}
