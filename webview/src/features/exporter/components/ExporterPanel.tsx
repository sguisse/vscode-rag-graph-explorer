import React from 'react';
import { Card } from '@/components/ui/card';
import { FolderDown, Sparkles, Clock } from 'lucide-react';

export function ExporterPanel() {
  return (
    <div className="flex flex-1 justify-center items-center space-y-4 bg-background p-4 md:p-6 min-h-0 overflow-y-auto text-foreground">
      <Card className="flex flex-col items-center gap-4 bg-card/80 shadow-lg p-8 border border-primary/20 w-full max-w-md text-center">
        <div className="bg-primary/10 p-4 rounded-full text-primary">
          <FolderDown size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="flex justify-center items-center gap-2 font-bold text-foreground text-lg">
            <Sparkles size={18} className="text-primary animate-pulse" />
            Codebase Exporter
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Actual Exporter extension will be migrated in this feature,<br/><b>coming soon !</b>
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full font-mono text-[11px] text-muted-foreground">
          <Clock size={12} />
          <span>Under Active Migration</span>
        </div>
      </Card>
    </div>
  );
}

export default ExporterPanel;
