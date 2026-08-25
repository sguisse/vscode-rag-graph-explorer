import React from 'react';
import { useSdlcWorkflowMachine, SdlcStep } from '../../core/workflow/useSdlcWorkflowMachine';
import { FolderTree, Settings, Bot, TerminalSquare, ListChecks } from 'lucide-react';

/**
 * SDLC Sidebar Navigation Component.
 * Dropping this into your sidebarLeft automatically controls the Workflow Machine
 * and pivots the center layout.
 */
export function SdlcSidebarMenu() {
  const transitionTo = useSdlcWorkflowMachine((s) => s.transitionTo);
  const currentStep = useSdlcWorkflowMachine((s) => s.currentStep);

  const steps: { id: SdlcStep; label: string; icon: any }[] = [
    { id: 'CODEBASE_CONTEXT', label: '1. Codebase Context', icon: FolderTree },
    { id: 'INSTRUCTIONS', label: '2. Instructions', icon: ListChecks },
    { id: 'LLM_CHAT', label: '3. LLM Chat', icon: Bot },
    { id: 'RESULTS_MANAGER', label: '4. Results Manager', icon: TerminalSquare },
  ];

  const configSteps: { id: SdlcStep; label: string; icon: any }[] = [
    { id: 'CONFIGURATION', label: 'App Configuration', icon: Settings },
  ];

  return (
    <div className="flex flex-col space-y-4 p-2 font-mono text-xs">
      <div className="space-y-1">
        <h4 className="px-2 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">SDLC Workflow Steps</h4>
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => transitionTo(step.id)}
              className={`flex w-full items-center gap-2 px-2 py-1.5 rounded transition-colors ${isActive ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}
            >
              <Icon size={14} /> {step.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-1">
        <h4 className="px-2 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Configuration</h4>
        {configSteps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => transitionTo(step.id)}
              className={`flex w-full items-center gap-2 px-2 py-1.5 rounded transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-500 font-bold' : 'hover:bg-muted text-foreground'}`}
            >
              <Icon size={14} /> {step.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
