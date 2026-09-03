import React from 'react';
import { FileJson } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function JsonInputNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={FileJson} headerBg="bg-amber-500/10">
      <div className="space-y-1 h-full font-mono text-xs">
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">JSON Payload Value</label>
        <textarea
          value={node.data.jsonText || ''}
          onChange={(e) => updateNodeData(node.id, { jsonText: e.target.value })}
          placeholder='{\n  "key": "value"\n}'
          className="p-1.5 border border-border rounded w-full h-24 bg-background font-mono text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </BaseNodeContainer>
  );
}
