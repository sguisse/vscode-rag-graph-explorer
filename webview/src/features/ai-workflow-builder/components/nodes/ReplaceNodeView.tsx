import React from 'react';
import { Replace } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function ReplaceNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Replace} headerBg="bg-rose-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Regex Pattern</label>
          <input
            type="text"
            value={node.data.replacePattern || ''}
            onChange={(e) => updateNodeData(node.id, { replacePattern: e.target.value })}
            placeholder="e.g. TODO|FIXME"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Replace By</label>
          <input
            type="text"
            value={node.data.replaceBy || ''}
            onChange={(e) => updateNodeData(node.id, { replaceBy: e.target.value })}
            placeholder="Replacement string..."
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
