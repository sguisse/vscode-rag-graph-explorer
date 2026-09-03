import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function ImageNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();
  const imageUrl = node.data.imageUrl || '';
  const displayImageOnly = Boolean(node.data.displayImageOnly);

  return (
    <BaseNodeContainer node={node} icon={ImageIcon} headerBg="bg-indigo-500/10">
      <div className="flex flex-col h-full font-mono text-xs">
        {!displayImageOnly && (
          <div className="mb-1.5">
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => updateNodeData(node.id, { imageUrl: e.target.value })}
              placeholder="https://... or data:image/..."
              className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono truncate"
            />
          </div>
        )}

        <div
          className={`flex-1 min-h-0 relative flex items-center justify-center overflow-hidden ${
            displayImageOnly ? 'p-[0px]' : 'p-[3px] border border-border rounded bg-muted/20'
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={node.data.label}
              className="w-full h-full object-contain rounded"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-[10px] text-muted-foreground italic">No Image URL Specified</span>
          )}
        </div>
      </div>
    </BaseNodeContainer>
  );
}
