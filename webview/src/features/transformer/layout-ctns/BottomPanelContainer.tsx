import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { Activity } from 'lucide-react';
import { PipelineExecutionMetrics } from '@/shared/services/transform-content/model/transform-content-model';

interface BottomPanelContainerProps {
  metrics: PipelineExecutionMetrics;
}

export const BottomPanelContainer: React.FC<BottomPanelContainerProps> = ({ metrics }) => {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Execution Metrics & Logs" path="workspace.bottom" />
      <div className="flex-1 space-y-1.5 p-2 min-h-0 overflow-y-auto font-mono text-[11px]">
        <div className="flex items-center gap-4 pb-1 border-border/50 border-b text-muted-foreground shrink-0">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <Activity size={13} className="text-primary" /> Metrics:
          </span>
          <span>Duration: <strong className="text-emerald-500">{metrics.executionTimeMs}ms</strong></span>
          <span>Input: <strong>{metrics.inputBytes}B</strong></span>
          <span>Output: <strong>{metrics.outputBytes}B</strong></span>
          <span>Matches: <strong>{metrics.totalMatches}</strong></span>
        </div>

        <div className="space-y-0.5 text-[10px] text-muted-foreground">
          {metrics.logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
