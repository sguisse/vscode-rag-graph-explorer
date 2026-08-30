import React from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';

export function ResultsManagerPanel() {
  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-y-auto font-mono text-xs p-3 space-y-3">
      <div className="bg-primary/5 p-3 border border-primary/20 rounded-lg">
        <h4 className="flex items-center gap-1.5 font-bold text-foreground text-sm uppercase">
          <Terminal size={14} className="text-primary" /> SDLC Results Manager
        </h4>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Inspect generated artifacts, test execution logs, and workflow execution outputs.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 border border-border border-dashed rounded-lg text-muted-foreground gap-2">
        <CheckCircle2 size={24} className="text-emerald-500" />
        <span className="font-bold text-xs text-foreground">Results Manager Dashboard</span>
        <p className="text-[10px] text-center max-w-sm">
          Execution history, logs, and generated files will be presented here.
        </p>
      </div>
    </div>
  );
}

export default ResultsManagerPanel;
