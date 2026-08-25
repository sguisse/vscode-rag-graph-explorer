import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { checkWorkflowAccessibility, AccessibilityIssue } from '../../utils/workflow-export.utils';

export function AccessibilityValidator() {
  const { nodes, edges, setSelectedNodeId } = useWorkflowStore();
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);

  const handleCheck = () => {
    const report = checkWorkflowAccessibility(nodes, edges);
    setIssues(report);
    setIsOpen(true);
  };

  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCheck}
        className="left-4 bottom-4 absolute bg-card shadow-md hover:bg-muted border-border h-8 font-mono font-semibold text-foreground text-xs gap-1.5 z-30 cursor-pointer"
      >
        <ShieldCheck size={14} className="text-primary" /> Check accessibility
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md font-mono">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck size={16} className="text-primary" /> Workflow Accessibility Diagnostic
            </DialogTitle>
            <DialogDescription className="text-xs">
              Automated validation report for node wiring, parameters, and DAG structure.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 max-h-72 overflow-y-auto">
            {issues.length === 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 p-3 border border-emerald-500/30 rounded text-emerald-500 text-xs">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>All workflow nodes are correctly configured and connected with zero errors.</span>
              </div>
            ) : (
              issues.map((issue, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (issue.nodeId) {
                      setSelectedNodeId(issue.nodeId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                    issue.nodeId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                  } ${
                    issue.type === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {issue.type === 'error' ? (
                    <XCircle size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{issue.message}</p>
                    {issue.nodeId && <span className="text-[10px] opacity-80">Click to select node in canvas</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-border border-t text-[11px] text-muted-foreground">
            <span>Errors: {errorCount} | Warnings: {warningCount}</span>
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-7 text-xs">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
