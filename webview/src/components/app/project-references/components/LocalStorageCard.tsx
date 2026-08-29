import React from 'react';
import { Database } from 'lucide-react';
import { CollapsibleCard } from '@/components/app/collapsible-card';

export function LocalStorageCard({ localDocumentStorage }: { localDocumentStorage: string }) {
  return (
    <CollapsibleCard
      title={
        <div className="flex items-center gap-1.5">
          <Database size={13} className="text-indigo-400" />
          <span className="font-bold text-xs">Local Document Storage</span>
        </div>
      }
      badge={localDocumentStorage}
      defaultExpanded={false}
      contentToCopy=""
      className="bg-card border-border"
    >
      <div className="p-2 space-y-1 text-[10px] text-muted-foreground font-mono">
        <p>
          <strong className="text-foreground">Storage Domain Key:</strong> {localDocumentStorage}
        </p>
        <p>
          Selected references above are made available to the LLM agent prompt strategy context.
        </p>
      </div>
    </CollapsibleCard>
  );
}
