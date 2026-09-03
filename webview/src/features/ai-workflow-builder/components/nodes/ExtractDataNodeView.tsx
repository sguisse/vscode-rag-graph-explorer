import React from 'react';
import { FileCode } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function ExtractDataNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={FileCode} headerBg="bg-sky-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Regex Pattern</label>
          <input
            type="text"
            value={node.data.extractPattern || ''}
            onChange={(e) => updateNodeData(node.id, { extractPattern: e.target.value })}
            placeholder="e.g. ([a-z0-9]+@[a-z]+\.[a-z]+)"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Output Variable Name</label>
          <input
            type="text"
            value={node.data.extractVarName || ''}
            onChange={(e) =>
              updateNodeData(node.id, {
                extractVarName: e.target.value,
                outputVariableName: e.target.value,
              })
            }
            placeholder="e.g. extractedEmail"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
