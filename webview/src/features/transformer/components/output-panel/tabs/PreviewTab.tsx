import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { TransformationsTable } from '../../TransformationsTable';
import { ExtractedTableRecord } from '../../../types/transformer.types';

interface PreviewTabProps {
  renderedOutput: string;
  outputFormat: string;
  records: ExtractedTableRecord[];
  onCopy: () => void;
  onSelectVariable?: (variableName: string) => void;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({
  renderedOutput,
  outputFormat,
  records,
  onCopy,
  onSelectVariable,
}) => {
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);

  const topContent = (
    <div className="flex justify-between items-center border-b border-border pb-1 p-1.5 shrink-0 bg-card">
      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
        Format: {outputFormat}
      </span>
      <Button size="sm" variant="outline" onClick={onCopy} className="h-6 gap-1 text-[10px] cursor-pointer">
        <Copy size={11} /> Copy Output
      </Button>
    </div>
  );

  const middleContent = (
    <div className="flex flex-col h-full w-full p-1.5 font-mono text-xs bg-card">
      <Textarea
        readOnly
        value={renderedOutput}
        className="flex-1 h-full bg-slate-950 text-slate-200 border-slate-800 font-mono text-xs resize-none"
      />
    </div>
  );

  const bottomContent = (
    <div className="flex flex-col p-1.5 bg-card border-t border-border shrink-0 font-mono text-xs select-none">
      <div
        onClick={() => setIsTableExpanded(!isTableExpanded)}
        className="flex items-center justify-between cursor-pointer py-0.5 hover:text-foreground text-muted-foreground transition-colors"
      >
        <div className="flex items-center gap-1.5 font-mono font-bold text-[10px] uppercase tracking-wider">
          {isTableExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <Table size={12} className="text-primary" />
          <span>Extracted Variables Data Table ({records.length})</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          {isTableExpanded ? 'Collapse' : 'Expand'}
        </span>
      </div>

      {isTableExpanded && (
        <div className="mt-1.5">
          <TransformationsTable records={records} onSelectVariable={onSelectVariable} />
        </div>
      )}
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-output-preview"
      topId="panel-output-preview-top"
      middleId="panel-output-preview-middle"
      bottomId="panel-output-preview-bottom"
      className="bg-card w-full h-full min-h-0 overflow-hidden"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};
