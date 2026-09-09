import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Terminal, BookmarkPlus } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';

interface InspectResultsPanelProps {
  executionLog: string;
  impactedFilesCount?: number;
  onCopyResult: () => void;
  onCreateProfile: () => void;
}

export const InspectResultsPanel: React.FC<InspectResultsPanelProps> = ({
  executionLog,
  impactedFilesCount = 0,
  onCopyResult,
  onCreateProfile,
}) => {
  const middleContent = (
    <div className="p-3 h-full min-h-0 flex flex-col font-mono text-xs">
      <Card className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-md overflow-hidden p-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0 font-bold text-xs text-foreground">
          <span className="flex items-center gap-1.5">
            <Terminal size={14} className="text-primary" />
            <span>Execution Result</span>
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onCopyResult}
            data-tooltip="Copy Execution Result to Clipboard"
            className="h-6 w-6 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Copy size={13} />
          </Button>
        </div>
        <div className="flex-1 min-h-0 bg-black text-emerald-400 border border-border/60 rounded p-3 mt-2 overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-text">
          {executionLog || (
            <span className="text-slate-500 italic select-none">
              No execution results yet. Apply a script from "Apply Response" tab to view output.
            </span>
          )}
        </div>
      </Card>
    </div>
  );

  const bottomContent = (
    <div className="p-3 bg-card border-t border-border space-y-2 font-mono text-xs">
      <div className="p-2.5 bg-muted/40 border border-border/60 rounded-md text-muted-foreground text-[11px] leading-relaxed">
        💡 the number of files impacted by the change and the token could be saved in input if we have selected only the modified files present in the script
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Impacted files count: <strong className="text-primary">{impactedFilesCount}</strong>
        </span>
        <Button
          size="sm"
          onClick={onCreateProfile}
          className="h-7 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
          data-tooltip="Create profile targeting only impacted files"
        >
          <BookmarkPlus size={13} />
          <span>Create Profile from Impacted Files</span>
        </Button>
      </div>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-inspect-results"
      className="w-full h-full min-h-0 overflow-hidden bg-background"
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default InspectResultsPanel;
