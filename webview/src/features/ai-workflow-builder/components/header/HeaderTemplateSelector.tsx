import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { WORKFLOW_PRESET_TEMPLATES } from '../../constants/workflow-templates.constants';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function HeaderTemplateSelector() {
  const { loadWorkflow } = useWorkflowStore();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const found = WORKFLOW_PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      loadWorkflow(found.schema);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <LayoutTemplate size={13} className="text-primary shrink-0" />
      <select
        defaultValue="ai-agent-setup"
        onChange={handleSelect}
        className="px-1.5 py-0.5 bg-background border border-border rounded font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        title="Load Predefined AI Workflow Preset"
      >
        {WORKFLOW_PRESET_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
