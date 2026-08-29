import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { InputPanel } from '../components/InputPanel';
import { TransformationsTable } from '../components/TransformationsTable';
import { ExtractedTableRecord } from '../types/transformer.types';

interface LeftPanelContainerProps {
  inputText: string;
  setInputText: (val: string) => void;
  records: ExtractedTableRecord[];
}

export const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  inputText,
  setInputText,
  records,
}) => {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Ingestion & Extractions" path="workspace.left" />
      <div className="flex-1 p-2 min-h-0 overflow-y-auto space-y-3">
        <InputPanel inputText={inputText} setInputText={setInputText} />
        <div className="flex flex-col gap-1.5 p-2 bg-card border border-border rounded-md">
          <span className="font-mono font-bold text-[10px] text-muted-foreground uppercase">Extracted Variables Data Table</span>
          <TransformationsTable records={records} />
        </div>
      </div>
    </div>
  );
};
