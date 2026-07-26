import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CopyFloatingButtonProps {
  onCopy: () => void;
  tooltipText?: string;
}

export function CopyFloatingButton({ onCopy, tooltipText = "Copy payload to clipboard" }: CopyFloatingButtonProps) {
  return (
    <Button
      onClick={onCopy}
      className="top-3 right-5 z-10 absolute flex items-center gap-1 bg-slate-800 hover:bg-slate-700 opacity-0 group-hover:opacity-100 shadow-md px-2 py-1 border border-slate-600 rounded h-6 font-mono text-[10px] text-white transition-opacity"
      data-tooltip={tooltipText}
    >
      <Copy size={10} /> Copy
    </Button>
  );
}
