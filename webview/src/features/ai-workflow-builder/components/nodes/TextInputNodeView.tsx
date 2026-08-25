import React from 'react';
import { Type } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function TextInputNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Type} headerBg="bg-rose-500/10">
      <div className="space-y-1 h-full">
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Prompt Text</label>
        <textarea
          value={node.data.promptText || ''}
          onChange={(e) => updateNodeData(node.id, { promptText: e.target.value })}
          placeholder="Enter prompt text..."
          className="p-1.5 border border-border rounded w-full h-24 bg-background font-mono text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </BaseNodeContainer>
  );
}
