import React from 'react';
import { Focus, CheckCircle2, GitBranch, ArrowRight, Lock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowPanel } from './hooks/use-workflow-panel';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface WorkflowPanelProps {
  onSelectStep?: (stepId: string) => void;
}

export function WorkflowPanel({ onSelectStep }: WorkflowPanelProps) {
  const {
    containerRef,
    workflowTitle,
    workflowDescription,
    selectedNode,
    handleFitView,
  } = useWorkflowPanel(onSelectStep);

  return (
    <div className="flex flex-col w-full font-mono text-xs">
      {/* Panel Header */}
      <div className="flex justify-between items-center bg-muted/50 p-3 border-border/80 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch size={15} className="text-primary shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h4 className="font-bold text-foreground text-xs leading-none truncate">{workflowTitle}</h4>
            <p className="mt-1 text-[10px] text-muted-foreground truncate">{workflowDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 rounded-full font-bold text-[10px] text-emerald-500">
            <CheckCircle2 size={11} /> Step 1 Active
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/80 w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleFitView}
            data-tooltip="Fit Diagram View"
          >
            <Focus size={13} />
          </Button>
        </div>
      </div>

      {/* Cytoscape Canvas */}
      <div className="relative bg-muted/10 w-full h-[230px]">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Step Inspector Footer */}
      <div className="bg-muted/30 p-2.5 border-border/80 border-t min-h-[58px] flex items-center justify-between">
        {selectedNode ? (
          <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                    selectedNode.isCurrent
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : selectedNode.type === 'start'
                      ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      : selectedNode.type === 'end'
                      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                      : selectedNode.type === 'decision'
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {selectedNode.isCurrent
                    ? 'Active Step'
                    : selectedNode.type === 'start'
                    ? 'BPMN Start'
                    : selectedNode.type === 'end'
                    ? 'BPMN End'
                    : selectedNode.type === 'decision'
                    ? '◆ Decision Check'
                    : 'Process Step'}
                </span>
                <span className="font-bold text-foreground text-xs truncate">{selectedNode.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate leading-snug">{selectedNode.desc}</p>
            </div>

            <div className="shrink-0 ml-2">
              {selectedNode.isCurrent ? (
                <span className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground opacity-60">
                  <Lock size={10} /> Active
                </span>
              ) : selectedNode.type === 'step' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 h-6 font-bold text-[10px] text-primary hover:text-primary-foreground cursor-pointer"
                  onClick={() => {
                    logInfo(`[WorkflowPanel] Workflow step selected via inspector button: '${selectedNode.label}' (ID: ${selectedNode.id})`);
                    if (onSelectStep) {
                      onSelectStep(selectedNode.id);
                    }
                  }}
                >
                  <span>Select Step</span>
                  <ArrowRight size={10} />
                </Button>
              ) : (
                <span className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground opacity-50">
                  Info Only
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
            <HelpCircle size={12} />
            <span>Hover or click any node/decision diamond to inspect step details.</span>
          </div>
        )}
      </div>
    </div>
  );
}
