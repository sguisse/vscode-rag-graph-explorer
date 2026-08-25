import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';

export function FormattedOutputNodeView({ node }: { node: WorkflowNode }) {
  return (
    <BaseNodeContainer node={node} icon={LayoutTemplate} headerBg="bg-emerald-500/10">
      <div className="space-y-1 h-full font-mono">
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Output Result</label>
        <div className="p-1.5 border border-border rounded w-full h-24 bg-background overflow-y-auto text-[10px] text-foreground whitespace-pre-wrap">
          {node.data.outputText || 'Run the flow to see output...'}
        </div>
      </div>
    </BaseNodeContainer>
  );
}
