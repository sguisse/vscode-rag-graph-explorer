import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PreviewTabProps {
  renderedOutput: string;
  outputFormat: string;
  onCopy: () => void;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ renderedOutput, outputFormat, onCopy }) => {
  return (
    <div className="flex flex-col h-full w-full gap-2 p-1.5 font-mono text-xs bg-card">
      <div className="flex justify-between items-center border-b border-border pb-1 shrink-0">
        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
          Format: {outputFormat}
        </span>
        <Button size="sm" variant="outline" onClick={onCopy} className="h-6 gap-1 text-[10px] cursor-pointer">
          <Copy size={11} /> Copy Output
        </Button>
      </div>

      <Textarea
        readOnly
        value={renderedOutput}
        className="flex-1 bg-slate-950 text-slate-200 border-slate-800 font-mono text-xs resize-none"
      />
    </div>
  );
};
