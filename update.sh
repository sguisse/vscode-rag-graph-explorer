#!/usr/bin/env bash
set -e

# Update WorkflowPanel to apply dynamic light/dark theme colors for hover tooltips
cat << 'EOF' > webview/src/components/app/workflow/workflow-panel.tsx
import React from 'react';
import { Focus, CheckCircle2, GitBranch, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowPanel } from './hooks/use-workflow-panel';
import { useAppContextStore } from '@/store/useAppContextStore';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { WorkflowData } from './model/workflow-model';

interface WorkflowPanelProps {
  workflowData?: WorkflowData;
  onSelectStep?: (stepId: string) => void;
}

export function WorkflowPanel({ workflowData, onSelectStep }: WorkflowPanelProps) {
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const {
    containerRef,
    workflowTitle,
    workflowDescription,
    selectedNode,
    hoverTooltip,
    handleFitView,
  } = useWorkflowPanel(workflowData, onSelectStep);

  return (
    <div className="flex flex-col w-full font-mono text-xs">
      {/* Panel Header */}
      <div className="flex justify-between items-center bg-muted/50 p-3 border-border/80 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch size={15} className="text-primary animate-pulse shrink-0" />
          <div className="min-w-0">
            <h4 className="font-bold text-foreground text-xs truncate leading-none">{workflowTitle}</h4>
            <p className="mt-1 text-[10px] text-muted-foreground truncate">{workflowDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 rounded-full font-bold text-[10px] text-emerald-500">
            <CheckCircle2 size={11} /> All steps available
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

      {/* Cytoscape Canvas & Theme-Aware Floating Tooltip */}
      <div className="relative bg-muted/10 w-full h-[300px] overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {hoverTooltip && (
          <div
            className="absolute z-50 pointer-events-none border border-border/80 shadow-lg rounded-md px-2.5 py-1 text-[10px] font-mono max-w-[220px] truncate animate-in fade-in zoom-in-95 -translate-x-1/2 -translate-y-full transition-colors duration-150"
            style={{
              left: `${hoverTooltip.x}px`,
              top: `${hoverTooltip.y - 10}px`,
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
            }}
          >
            {hoverTooltip.text}
          </div>
        )}
      </div>

      {/* Step Inspector Footer */}
      <div className="flex justify-between items-center bg-muted/30 p-2.5 border-border/80 border-t min-h-[58px]">
        {selectedNode ? (
          <div className="flex flex-1 justify-between items-center gap-2 min-w-0">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                    selectedNode.isCurrent
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
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
                <span className="font-bold text-foreground text-xs truncate">
                  {selectedNode.label.replace(/\n/g, ' ')}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate leading-snug">{selectedNode.desc}</p>
            </div>

            <div className="ml-2 shrink-0">
              {selectedNode.clickEnabled ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 h-6 font-bold text-[10px] text-primary hover:text-primary-foreground cursor-pointer"
                  onClick={() => {
                    logInfo(`[WorkflowPanel] Workflow step selected via inspector button: '${selectedNode.label.replace(/\n/g, ' ')}' (ID: ${selectedNode.id})`);
                    if (onSelectStep) {
                      onSelectStep(selectedNode.id);
                    }
                  }}
                >
                  <span>Select Step</span>
                  <ArrowRight size={10} />
                </Button>
              ) : (
                <span className="flex items-center gap-1 opacity-50 font-bold text-[10px] text-muted-foreground">
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
EOF

# Rebuild workspace
