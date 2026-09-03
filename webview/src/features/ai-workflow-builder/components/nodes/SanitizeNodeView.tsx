import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function SanitizeNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  const method = node.data.sanitizeMethod || 'Mask';

  return (
    <BaseNodeContainer node={node} icon={ShieldCheck} headerBg="bg-emerald-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Regex Pattern</label>
          <input
            type="text"
            value={node.data.sanitizePattern || ''}
            onChange={(e) => updateNodeData(node.id, { sanitizePattern: e.target.value })}
            placeholder="e.g. \b\d{4}-\d{4}-\d{4}-\d{4}\b"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Sanitize Method</label>
          <select
            value={method}
            onChange={(e) => updateNodeData(node.id, { sanitizeMethod: e.target.value as any })}
            className="mt-0.5 p-1 bg-background border border-border rounded w-full text-[11px] font-mono cursor-pointer"
          >
            <option value="Mask">Mask (****)</option>
            <option value="Hash">Hash (SHA256)</option>
            <option value="MD5">MD5</option>
            <option value="Redact">Redact ([REDACTED])</option>
          </select>
        </div>
      </div>
    </BaseNodeContainer>
  );
}
