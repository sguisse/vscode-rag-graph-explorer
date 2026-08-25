import React from 'react';
import { Braces } from 'lucide-react';

export function CodebaseParsersConfigFeature() {
  return (
    <div className="space-y-4 p-4 font-mono text-xs animate-in fade-in">
      <div className="space-y-1 bg-indigo-500/10 p-3 border border-indigo-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Braces size={16} className="text-indigo-500" />
          <h4 className="font-bold text-foreground text-xs uppercase">Codebase Parsers (jQA)</h4>
        </div>
        <p className="text-[10px] text-muted-foreground">Manage jQAssistant rules, Graphify regex filters, and parsing strategies.</p>
      </div>
      <div className="p-8 text-center border border-border border-dashed rounded-lg text-muted-foreground">
        Parser configuration UI will be implemented here.
      </div>
    </div>
  );
}
