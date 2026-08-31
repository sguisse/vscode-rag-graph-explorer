import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { TransformationsTable } from '../../TransformationsTable';
import { ExtractedTableRecord } from '@/shared/services/transform-content/model/transform-content-model';

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
    <div className="flex justify-between items-center bg-card p-1.5 pb-1 border-border border-b shrink-0">
      <span className="bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20 rounded font-bold text-[10px] text-emerald-500 uppercase">
        Format: {outputFormat}
      </span>
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1 h-6 text-[10px] cursor-pointer">
        <Copy size={11} /> Copy Output
      </Button>
    </div>
  );

  const middleContent = (
    <div className="flex flex-col bg-card p-1.5 w-full h-full font-mono text-xs">
      <Textarea
        readOnly
        value={renderedOutput}
        className="flex-1 bg-slate-950 border-slate-800 h-full font-mono text-slate-200 text-xs resize-none"
      />
    </div>
  );

  const bottomContent = (
    <div className="flex flex-col bg-card p-1.5 border-border border-t font-mono text-xs select-none shrink-0">
      <div
        onClick={() => setIsTableExpanded(!isTableExpanded)}
        className="flex justify-between items-center py-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5 font-mono font-bold text-[10px] uppercase tracking-wider">
          {isTableExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <Table size={12} className="text-primary" />
          <span>Extracted Variables Data Table ({records.length})</span>
        </div>
        <span className="font-medium text-[10px] text-muted-foreground">
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
