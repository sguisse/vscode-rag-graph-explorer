import React from 'react';
import { Variable } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function ArgumentNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Variable} headerBg="bg-sky-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Argument Name</label>
          <input
            type="text"
            value={node.data.argumentName || ''}
            onChange={(e) => updateNodeData(node.id, { argumentName: e.target.value })}
            placeholder="e.g. env"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Value</label>
          <input
            type="text"
            value={node.data.argumentValue || ''}
            onChange={(e) => updateNodeData(node.id, { argumentValue: e.target.value })}
            placeholder="e.g. production"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
