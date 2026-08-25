import React from 'react';
import { Search } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function SearchToolNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Search} headerBg="bg-rose-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Subreddit</label>
          <input
            type="text"
            value={node.data.subreddit || ''}
            onChange={(e) => updateNodeData(node.id, { subreddit: e.target.value })}
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px]"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="font-bold text-muted-foreground uppercase">Topic Limit</span>
            <span className="font-bold text-primary">{node.data.topicLimit || 10}</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={node.data.topicLimit || 10}
            onChange={(e) => updateNodeData(node.id, { topicLimit: Number(e.target.value) })}
            className="mt-1 w-full accent-primary cursor-pointer"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
