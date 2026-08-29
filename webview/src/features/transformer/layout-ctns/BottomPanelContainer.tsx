import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { PipelineExecutionMetrics } from '../types/transformer.types';
import { Activity } from 'lucide-react';

interface BottomPanelContainerProps {
  metrics: PipelineExecutionMetrics;
}

export const BottomPanelContainer: React.FC<BottomPanelContainerProps> = ({ metrics }) => {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Execution Metrics & Logs" path="workspace.bottom" />
      <div className="flex-1 p-2 min-h-0 overflow-y-auto font-mono text-[11px] space-y-1.5">
        <div className="flex items-center gap-4 text-muted-foreground border-b border-border/50 pb-1 shrink-0">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <Activity size={13} className="text-primary" /> Metrics:
          </span>
          <span>Duration: <strong className="text-emerald-500">{metrics.executionTimeMs}ms</strong></span>
          <span>Input: <strong>{metrics.inputBytes}B</strong></span>
          <span>Output: <strong>{metrics.outputBytes}B</strong></span>
          <span>Matches: <strong>{metrics.totalMatches}</strong></span>
        </div>

        <div className="space-y-0.5 text-muted-foreground text-[10px]">
          {metrics.logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
