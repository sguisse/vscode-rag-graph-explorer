import React from 'react';
import { FileText } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function MarkdownFileNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={FileText} headerBg="bg-amber-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Markdown File</label>
          <div className="flex items-center gap-1.5 mt-0.5">
            <input
              type="text"
              value={node.data.markdownFile || ''}
              onChange={(e) => updateNodeData(node.id, { markdownFile: e.target.value })}
              className="flex-1 px-1.5 py-0.5 bg-background border border-border rounded text-[11px]"
            />
            <button className="bg-muted hover:bg-muted/80 px-2 py-0.5 border border-border rounded font-semibold text-[10px] cursor-pointer">
              Replace
            </button>
          </div>
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Instruction</label>
          <textarea
            value={node.data.instructionText || ''}
            onChange={(e) => updateNodeData(node.id, { instructionText: e.target.value })}
            className="p-1.5 border border-border rounded w-full h-20 bg-background text-[11px] resize-none"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
