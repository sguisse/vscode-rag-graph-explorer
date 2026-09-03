import React from 'react';
import { Globe } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function UrlNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Globe} headerBg="bg-sky-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Target URL</label>
          <input
            type="text"
            value={node.data.url || ''}
            onChange={(e) => updateNodeData(node.id, { url: e.target.value })}
            placeholder="https://api.example.com/data"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono truncate"
          />
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Bearer Token</label>
          <input
            type="password"
            value={node.data.bearerToken || ''}
            onChange={(e) => updateNodeData(node.id, { bearerToken: e.target.value })}
            placeholder="bearer token..."
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
