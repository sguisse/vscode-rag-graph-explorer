import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface JsonSourceTabProps {
  workflowJsonText: string;
  setWorkflowJsonText: (val: string) => void;
  workflowParseError: string | null;
}

export const JsonSourceTab: React.FC<JsonSourceTabProps> = ({
  workflowJsonText,
  setWorkflowJsonText,
  workflowParseError,
}) => {
  return (
    <div className="flex flex-col h-full w-full gap-2 p-1.5 font-mono text-xs bg-card">
      <Textarea
        value={workflowJsonText}
        onChange={(e) => setWorkflowJsonText(e.target.value)}
        placeholder="Paste your ETL Workflow JSON specification here..."
        className="flex-1 bg-muted/20 font-mono text-xs resize-none border-border focus-visible:ring-1"
        spellCheck={false}
      />

      {workflowParseError && (
        <div className="flex items-center gap-2 p-2 bg-destructive/15 border border-destructive/30 rounded text-destructive text-[11px] shrink-0">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="truncate">{workflowParseError}</span>
        </div>
      )}
    </div>
  );
};
