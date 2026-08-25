import React from 'react';
import { Info } from 'lucide-react';

export function InstructionBox() {
  return (
    <div className="top-8 left-80 absolute bg-sky-500/10 shadow-sm p-3.5 border border-sky-500/30 rounded-xl w-72 font-mono text-xs pointer-events-none select-none">
      <div className="flex items-center gap-1.5 mb-1.5 font-bold text-sky-500">
        <Info size={15} /> AI agent setup
      </div>
      <ol className="space-y-1 text-[11px] text-foreground/80 list-decimal list-inside">
        <li>Choose a model</li>
        <li>Set token budget</li>
        <li>Connect prompt & skill</li>
        <li>Add agent tools</li>
        <li>Run & view result</li>
      </ol>
      <p className="mt-2 text-[10px] text-muted-foreground leading-tight">
        💡 Tip: Runs with mock data by default — add your Anthropic or OpenAI API key to use a real LLM.
      </p>
    </div>
  );
}
