import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { Sliders } from 'lucide-react';

export const TopPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="ETL Transformer Studio" path="workspace.top" />
      <div className="flex-1 p-2 min-h-0 overflow-auto flex items-center gap-2 font-mono text-xs">
        <Sliders size={16} className="text-primary shrink-0" />
        <span className="font-bold uppercase tracking-wider text-foreground">Client-Side Data Transformation Engine</span>
        <span className="text-muted-foreground text-[10px]">(Multi-stage Regex Extraction, Sanitization & Mustache Templating)</span>
      </div>
    </div>
  );
};
