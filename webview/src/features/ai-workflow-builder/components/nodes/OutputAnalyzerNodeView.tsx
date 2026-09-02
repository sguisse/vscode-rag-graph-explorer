import React from 'react';
import { GitFork, CheckCircle2, XCircle } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function OutputAnalyzerNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  const condition = node.data.analyzerCondition || 'exit_code == 0';
  const status = node.data.analyzerStatus || 'idle';

  return (
    <BaseNodeContainer node={node} icon={GitFork} headerBg="bg-amber-500/10">
      <div className="flex flex-col justify-between h-full font-mono text-xs space-y-2">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Condition Rule</label>
          <input
            type="text"
            value={condition}
            onChange={(e) => updateNodeData(node.id, { analyzerCondition: e.target.value })}
            placeholder="e.g. exit_code == 0"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        {/* Live Evaluation Status */}
        <div className="flex items-center justify-between bg-muted/30 p-1.5 border border-border rounded text-[10px]">
          <span className="font-semibold text-muted-foreground uppercase">Status:</span>
          {status === 'OK' && (
            <span className="flex items-center gap-1 font-bold text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 size={11} /> OK
            </span>
          )}
          {status === 'KO' && (
            <span className="flex items-center gap-1 font-bold text-rose-500 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
              <XCircle size={11} /> KO
            </span>
          )}
          {status !== 'OK' && status !== 'KO' && (
            <span className="text-muted-foreground italic">Pending</span>
          )}
        </div>

        {/* Visual Endpoint Indicators for OK / KO */}
        <div className="flex justify-end gap-2 pt-1 border-t border-border/50 text-[10px]">
          <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
            <span>OK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-1 bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
            <span>KO</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </div>
        </div>
      </div>
    </BaseNodeContainer>
  );
}
