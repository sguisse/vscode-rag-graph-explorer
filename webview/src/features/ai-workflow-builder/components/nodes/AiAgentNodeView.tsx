import React from 'react';
import { Bot } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function AiAgentNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Bot} headerBg="bg-primary/15">
      <div className="flex flex-col gap-2 font-mono text-xs select-none">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Model</label>
          <select
            value={node.data.model || 'Mock - Offline'}
            onChange={(e) => updateNodeData(node.id, { model: e.target.value })}
            className="mt-0.5 p-1 bg-background border border-border rounded w-full text-[11px] font-mono cursor-pointer"
          >
            <option value="Mock - Offline">Mock - Offline</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center text-[9px] gap-2 mb-0.5">
            <span className="font-bold text-muted-foreground uppercase whitespace-nowrap">Token Budget</span>
            <span className="font-bold text-primary shrink-0">{node.data.tokenBudget || 1000}</span>
          </div>
          <input
            type="range"
            min="100"
            max="4000"
            step="100"
            value={node.data.tokenBudget || 1000}
            onChange={(e) => updateNodeData(node.id, { tokenBudget: Number(e.target.value) })}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
